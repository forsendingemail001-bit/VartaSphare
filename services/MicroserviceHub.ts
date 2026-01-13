
import { storageEngine } from '../persistence/StorageEngine';
import { Message, ChatRoom, Clan } from '../types';

type Callback = (data: any) => void;

class EventBus {
  private listeners: { [key: string]: Callback[] } = {};
  on(event: string, cb: Callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(cb);
  }
  emit(event: string, data: any) {
    this.listeners[event]?.forEach(cb => cb(data));
  }
}

export class MessagingMicroservice {
  constructor(private bus: EventBus) {}
  
  async sendMessage(msg: Message) {
    await storageEngine.save('messages', msg);
    this.bus.emit('MESSAGE_SENT', msg);
  }
  
  async loadHistory(roomId: string): Promise<Message[]> {
    const all = await storageEngine.getAll('messages');
    return all.filter(m => m.roomId === roomId || m.id === roomId); // Simplified logic
  }
}

export class CommunityMicroservice {
  constructor(private bus: EventBus) {}

  async joinRoom(room: ChatRoom) {
    await storageEngine.save('rooms', room);
    this.bus.emit('ROOM_JOINED', room);
  }

  async getJoinedRooms(): Promise<ChatRoom[]> {
    return await storageEngine.getAll('rooms');
  }

  async getClans(): Promise<Clan[]> {
    return await storageEngine.getAll('clans');
  }
}

class ServiceHub {
  public bus = new EventBus();
  public messaging = new MessagingMicroservice(this.bus);
  public community = new CommunityMicroservice(this.bus);
  
  async start() {
    await storageEngine.init();
    console.log("Service Hub: All microservices operational.");
  }
}

export const hub = new ServiceHub();
