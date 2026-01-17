
import { io, Socket } from 'socket.io-client';
import { Message, CursorPos } from '../types';

const getSocketURL = () => {
  const { protocol, hostname, port } = window.location;
  const isLocal = hostname === 'localhost' || 
                  hostname === '127.0.0.1' || 
                  hostname.startsWith('192.168.') || 
                  hostname.startsWith('10.') || 
                  hostname.startsWith('172.');

  if (isLocal && port !== '3000') {
    return `${protocol}//${hostname}:3000`;
  }
  return window.location.origin;
};

export class P2PMesh {
  private socket: Socket | null = null;
  private localBus: BroadcastChannel;
  private activeRooms: Set<string> = new Set();
  private pendingJoins: Set<string> = new Set();

  public onMessage: (msg: Message, roomId: string) => void = () => {};
  public onCursor: (cursor: CursorPos, roomId: string) => void = () => {};

  constructor() {
    // Unique bus per session to avoid cross-tab echo loops during testing
    const sessionToken = Math.random().toString(36).substring(7);
    this.localBus = new BroadcastChannel(`varta_mesh_${sessionToken}`);
    this.init();
  }

  private init() {
    const url = getSocketURL();
    this.socket = io(url, { 
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionDelay: 1000
    });

    this.socket.on("connect", () => {
      console.log(`[Handshake] Node Online. ID: ${this.socket?.id}`);
      // Always join the global signaling channel immediately
      this.socket?.emit("join_room", { id: 'varta_global_signaling', visibility: 'public' });
      
      // Re-sync existing rooms
      this.activeRooms.forEach(rid => {
        this.socket?.emit("join_room", { id: rid, visibility: 'public' });
      });
    });

    this.socket.on("message", (msg: any) => {
      const rid = msg.roomId || 'global';
      this.onMessage(msg, rid);
    });

    this.socket.on("typing", (data: any) => {
      this.onCursor(data, data.roomId);
    });

    this.socket.on("room_joined", (roomId: string) => {
      console.log(`[Handshake] Frequency Locked: ${roomId}`);
      this.activeRooms.add(roomId);
      this.pendingJoins.delete(roomId);
    });
  }

  public getSelfId() {
    // Priority: Socket ID (truly unique per tab) > Session ID
    return this.socket?.id || 'unlinked_node';
  }

  public async joinHubSwarm(roomId: string, password?: string) {
    if (this.activeRooms.has(roomId) || this.pendingJoins.has(roomId)) return;
    this.pendingJoins.add(roomId);
    this.socket?.emit("join_room", { id: roomId, visibility: password ? 'protected' : 'public', password });
  }

  public leaveHubSwarm(roomId: string) {
    this.socket?.emit("leave", roomId);
    this.activeRooms.delete(roomId);
  }

  public broadcastToHub(roomId: string, msg: Message) {
    const payload = { ...msg, roomId };
    
    // Safety check: Join room if we aren't in it
    if (!this.activeRooms.has(roomId)) {
        this.joinHubSwarm(roomId);
    }

    this.socket?.emit("send_message", payload);
    
    // Sync local tab state
    this.localBus.postMessage({ 
        type: 'message', 
        payload: { roomId, msg }, 
        senderId: this.getSelfId() 
    });
  }

  public broadcastCursorToHub(roomId: string, cursor: CursorPos) {
    this.socket?.emit("typing", { roomId, ...cursor });
  }

  public isConnected() {
    return this.socket?.connected || false;
  }
}

export const p2pMesh = new P2PMesh();
