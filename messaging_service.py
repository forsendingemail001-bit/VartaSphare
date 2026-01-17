
import time
from typing import Dict, List
from bus import bus
from models import Message

class MessagingService:
    def __init__(self, network):
        self.network = network
        self.messages: Dict[str, List[Message]] = {}
        bus.subscribe("RAW_SIGNAL", self.process_incoming)

    def process_incoming(self, data):
        rid = data.get("roomId", "global")
        if rid == "varta_global_signaling": return
        
        new_msg = Message(
            id=data.get("id"),
            roomId=rid,
            senderId=data.get("senderId"),
            senderName=data.get("senderName"),
            content=data.get("content"),
            timestamp=data.get("timestamp")
        )
        if rid not in self.messages: self.messages[rid] = []
        self.messages[rid].append(new_msg)
        bus.publish("MSG_LOGGED", new_msg)

    def dispatch(self, user, room_id, content):
        msg = {
            "id": f"msg_{int(time.time()*1000)}",
            "roomId": room_id,
            "senderId": user.id,
            "senderName": user.name,
            "content": content,
            "timestamp": int(time.time()*1000)
        }
        self.network.emit_remote("send_message", msg)
