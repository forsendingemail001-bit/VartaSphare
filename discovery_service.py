
import json
import time
from dataclasses import asdict
from bus import bus

class DiscoveryService:
    def __init__(self, network):
        self.network = network
        bus.subscribe("RAW_SIGNAL", self.handle_signaling)

    def handle_signaling(self, data):
        rid = data.get("roomId")
        if rid != "varta_global_signaling": return
        try:
            from main import app # Delayed import to avoid circular dependency
            sig = json.loads(data.get("content", "{}"))
            user = app.user
            if sig.get("type") == "PING" and sig.get("targetId") == user.id:
                self.send_sig({"type": "PONG", "identity": asdict(user), "targetId": sig.get("senderId")})
            elif sig.get("type") == "PONG" and sig.get("targetId") == user.id:
                bus.publish("NODE_FOUND", sig.get("identity"))
            elif sig.get("type") == "INVITE" and sig.get("targetId") == user.id:
                bus.publish("INVITE_RCVD", sig.get("room"))
        except: pass

    def send_sig(self, payload):
        from main import app
        self.network.emit_remote("send_message", {
            "roomId": "varta_global_signaling",
            "senderId": app.user.id,
            "content": json.dumps(payload),
            "timestamp": int(time.time()*1000)
        })

    def probe(self, target_id):
        from main import app
        self.send_sig({"type": "PING", "senderId": app.user.id, "targetId": target_id})
