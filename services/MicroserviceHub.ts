
import { storageEngine } from '../persistence/StorageEngine';
import { Message, ChatRoom, CursorPos } from '../types';
import { MOCK_DIRECTORY_USERS, MOCK_DIRECTORY_GROUPS } from '../constants';
import { p2pMesh } from './P2PMesh';

type Callback = (data: any) => void;

class VartaBroadcastNode {
  private channel: BroadcastChannel;
  private listeners: { [key: string]: Callback[] } = {};
  
  constructor() {
    this.channel = new BroadcastChannel('varta_internal_hub_v3');
    this.channel.onmessage = (event) => {
      const { type, data } = event.data;
      this.listeners[type]?.forEach(cb => cb(data));
    };
  }
  
  on(event: string, cb: Callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(cb);
    return () => {
      this.listeners[event] = this.listeners[event].filter(l => l !== cb);
    };
  }
  
  emit(event: string, data: any, broadcast = true) {
    this.listeners[event]?.forEach(cb => cb(data));
    if (broadcast) {
      this.channel.postMessage({ type: event, data });
    }
  }
}

export class MessagingMicroservice {
  constructor(private bus: VartaBroadcastNode) {}
  
  async sendMessage(msg: Message) {
    const rid = msg.roomId || 'global';
    await storageEngine.save('messages', msg);
    this.bus.emit('MESSAGE_SENT', msg);
    p2pMesh.broadcastToHub(rid, msg);
  }
  
  async loadHistory(roomId: string): Promise<Message[]> {
    const all = await storageEngine.getAll('messages');
    return all.filter(m => m.roomId === roomId).sort((a,b) => a.timestamp - b.timestamp);
  }

  async deleteHistory(roomId: string) {
    await storageEngine.clearByRoom(roomId);
    this.bus.emit('MESSAGE_HISTORY_CLEARED', { roomId });
  }
}

export class CommunityMicroservice {
  constructor(private bus: VartaBroadcastNode) {}

  async joinRoom(room: ChatRoom, signalRecipient = true) {
    await storageEngine.save('rooms', room);
    await p2pMesh.joinHubSwarm(room.id);
    this.bus.emit('ROOM_JOINED', room);

    if (signalRecipient && room.type === 'dm') {
        const targetId = room.members.find(m => m !== p2pMesh.getSelfId());
        if (targetId) {
            console.log(`[Handshake] Sending invite to ${targetId} for room ${room.id}`);
            p2pMesh.broadcastToHub('varta_global_signaling', {
                id: `inv_${Date.now()}`,
                senderId: p2pMesh.getSelfId(),
                senderName: 'System',
                content: JSON.stringify({ type: 'INVITE', roomId: room.id, targetId, room }),
                timestamp: Date.now(),
                type: 'text',
                roomId: 'varta_global_signaling'
            });
        }
    }
  }

  async createGroup(name: string, description: string, creatorId: string): Promise<ChatRoom> {
    const group: ChatRoom = {
      id: `group_${Math.random().toString(36).substr(2, 6)}`,
      name,
      description,
      type: 'group',
      members: [creatorId],
      icon: `https://api.dicebear.com/7.x/initials/svg?seed=${name}`
    };
    await this.joinRoom(group, false);
    return group;
  }

  async deleteRoom(roomId: string) {
    await storageEngine.delete('rooms', roomId);
    await storageEngine.clearByRoom(roomId);
    p2pMesh.leaveHubSwarm(roomId);
    this.bus.emit('ROOM_DELETED', { roomId });
  }

  async getJoinedRooms(): Promise<ChatRoom[]> {
    return await storageEngine.getAll('rooms');
  }

  announcePresence(user: any) {
    this.bus.emit('PEER_ANNOUNCEMENT', user);
  }
}

export class DiscoveryMicroservice {
  constructor(private bus: VartaBroadcastNode) {}

  async resolveIdentity(id: string): Promise<any | null> {
    const q = id.trim();
    if (!q) return null;

    // 1. Static Mocks
    const mock = MOCK_DIRECTORY_USERS.find(u => u.id === q);
    if (mock) return { ...mock, verified: true };

    // 2. Real-time Mesh Probe
    return new Promise((resolve) => {
      console.log(`[Handshake] Probing mesh for ID: ${q}`);
      
      const timeout = setTimeout(() => {
        console.warn(`[Handshake] Probe timed out for: ${q}`);
        unsub();
        resolve(null);
      }, 5000);

      const unsub = this.bus.on('IDENTITY_PONG', (data) => {
        if (data.id === q) {
          console.log(`[Handshake] Probe Success! Verified Node: ${data.name}`);
          clearTimeout(timeout);
          unsub();
          resolve({ ...data, verified: true });
        }
      });

      p2pMesh.broadcastToHub('varta_global_signaling', {
        id: `ping_${Date.now()}`,
        senderId: p2pMesh.getSelfId(),
        senderName: 'Discovery',
        content: JSON.stringify({ type: 'PING', targetId: q }),
        timestamp: Date.now(),
        type: 'text',
        roomId: 'varta_global_signaling'
      });
    });
  }

  async findGroupGlobal(query: string): Promise<ChatRoom | null> {
    const q = query.trim().toLowerCase();
    const mock = MOCK_DIRECTORY_GROUPS.find(g => g.id.toLowerCase() === q || g.name.toLowerCase().includes(q));
    if (mock) return mock as any;
    return null;
  }
}

export class PeerTransmissionMicroservice {
  constructor(private bus: VartaBroadcastNode) {}
  broadcastCursor(cursor: CursorPos) {
    this.bus.emit('CURSOR_UPDATE', cursor, false);
    if (cursor.roomId) {
        p2pMesh.broadcastCursorToHub(cursor.roomId, cursor);
    }
  }
}

class ServiceHub {
  public bus = new VartaBroadcastNode();
  public discovery = new DiscoveryMicroservice(this.bus);
  public messaging = new MessagingMicroservice(this.bus);
  public community = new CommunityMicroservice(this.bus);
  public transmission = new PeerTransmissionMicroservice(this.bus);
  
  async start() {
    await storageEngine.init();
    
    p2pMesh.onMessage = (msg, roomId) => {
        if (roomId === 'varta_global_signaling') {
            try {
                const signal = JSON.parse(msg.content);
                const selfId = p2pMesh.getSelfId();

                // Respond to Discovery Pings
                if (signal.type === 'PING' && signal.targetId === selfId) {
                    console.log(`[Handshake] Discovery Probe detected. Sending Identity...`);
                    const session = JSON.parse(localStorage.getItem('varta_session') || '{}');
                    // We send our actual Identity back
                    p2pMesh.broadcastToHub('varta_global_signaling', {
                        id: `pong_${Date.now()}`,
                        senderId: selfId,
                        senderName: 'Discovery',
                        content: JSON.stringify({ 
                            type: 'PONG', 
                            identity: { 
                                ...session, 
                                id: selfId // Ensure they get our active Socket ID
                            } 
                        }),
                        timestamp: Date.now(),
                        type: 'text',
                        roomId: 'varta_global_signaling'
                    });
                }

                // Handle Identity Pongs
                if (signal.type === 'PONG') {
                    this.bus.emit('IDENTITY_PONG', signal.identity);
                }

                // Handle Incoming Room Invites
                if (signal.type === 'INVITE' && signal.targetId === selfId) {
                    console.log(`[Handshake] Invite received! Joining frequency: ${signal.roomId}`);
                    this.community.joinRoom(signal.room, false);
                }
            } catch (e) { }
            return;
        }
        
        // Pass regular messages to UI
        this.bus.emit('MESSAGE_SENT', msg, false);
        storageEngine.save('messages', msg);
    };

    p2pMesh.onCursor = (cursor) => {
        this.bus.emit('CURSOR_UPDATE', cursor);
    };

    // Join signaling immediately
    p2pMesh.joinHubSwarm('varta_global_signaling');
    const joined = await this.community.getJoinedRooms();
    joined.forEach(room => p2pMesh.joinHubSwarm(room.id));
  }
}

export const hub = new ServiceHub();
