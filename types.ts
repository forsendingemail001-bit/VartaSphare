
export enum HubType {
  PERSONAL = 'PERSONAL',
  GLOBAL = 'GLOBAL'
}

export enum MessageSender {
  USER = 'USER',
  SYSTEM = 'SYSTEM',
  AI = 'AI'
}

export interface User {
  id: string; 
  name: string;
  avatar: string;
  position: string;
  status: 'online' | 'offline' | 'idle';
  bio: string;
}

export interface FileTransmission {
  hash: string;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: 'seeding' | 'leeching' | 'completed' | 'paused';
  seeds: number;
  peers: number;
  dataUrl?: string; 
  thumbnail?: string; 
}

export interface CursorPos {
  userId: string;
  userName: string;
  x: number;
  y: number;
  roomId: string;
  color: string;
}

export interface PipState {
  id: string;
  type: 'image' | 'video' | 'audio' | 'file';
  url: string;
  title: string;
  isVisible: boolean;
  minimized: boolean;
  x: number;
  y: number;
}

export interface Message {
  id: string;
  roomId?: string; 
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: number;
  type: 'text' | 'image' | 'video' | 'file';
  mediaUrl?: string;
  isFlagged?: boolean;
  fileMetadata?: Partial<FileTransmission>;
}

export interface ChatRoom {
  id: string; 
  name: string;
  description: string;
  type: 'dm' | 'group' | 'global' | 'clan';
  lastMessage?: string;
  members: string[];
  icon?: string;
}

export interface Clan {
  id: string; 
  name: string;
  tag: string;
  leaderId: string;
  membersCount: number;
  level: number;
  banner: string;
}
