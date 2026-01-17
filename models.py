
from dataclasses import dataclass, asdict
from typing import List, Optional

@dataclass
class User:
    id: str
    name: str
    avatar: str = ""
    role: str = "Explorer"

@dataclass
class Message:
    id: str
    roomId: str
    senderId: str
    senderName: str
    content: str
    timestamp: int

@dataclass
class ChatRoom:
    id: str
    name: str
    description: str
    type: str
    members: List[str]
    icon: str = "#"
