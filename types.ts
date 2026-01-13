
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
  id: string; // This will be the uid_ prefix
  name: string;
  avatar: string;
  position: string;
  status: 'online' | 'offline' | 'idle';
  bio: string;
}

export interface Message {
  id: string;
  roomId?: string; // Routing identifier for floating windows (gid_ or dm_)
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
  type: 'text' | 'image' | 'video';
  mediaUrl?: string;
  isFlagged?: boolean;
}

export interface ChatRoom {
  id: string; // This will be the gid_ prefix for groups or dm_ for private
  name: string;
  description: string;
  type: 'dm' | 'group' | 'global' | 'clan';
  lastMessage?: string;
  members: string[];
  icon?: string;
}

export interface Clan {
  id: string; // cid_ prefix
  name: string;
  tag: string;
  leaderId: string;
  membersCount: number;
  level: number;
  banner: string;
}

export interface AIResponse {
  isHarmful: boolean;
  reason?: string;
  suggestions: string[];
}
