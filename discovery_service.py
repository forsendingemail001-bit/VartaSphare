
import json
import time
from dataclasses import asdict
from js import window
from bus import bus

class DiscoveryService:
    def __init__(self, network):
        self.network = network
        bus.subscribe("RAW_SIGNAL", self.handle_signaling)

    def handle_signaling(self, data):
        rid = data.get("roomId")
        if rid != "varta_global_signaling": return
        try:
            app = window.app
            if not app or not app.user: return
            
            sig = json.loads(data.get("content", "{}"))
            user = app.user
            
            if sig.get("type") == "PING" and sig.get("targetId") == user.id:
                self.send_sig({"type": "PONG", "identity": asdict(user), "targetId": sig.get("senderId")})
            elif sig.get("type") == "PONG" and sig.get("targetId") == user.id:
                bus.publish("NODE_FOUND", sig.get("identity"))
            elif sig.get("type") == "INVITE" and sig.get("targetId") == user.id:
                bus.publish("INVITE_RCVD", sig.get("room"))
        except Exception:
            pass

    def send_sig(self, payload):
        app = window.app
        self.network.emit_remote("send_message", {
            "roomId": "varta_global_signaling",
            "senderId": app.user.id,
            "content": json.dumps(payload),
            "timestamp": int(time.time()*1000)
        })

    def probe(self, target_id):
        self.send_sig({"type": "PING", "senderId": window.app.user.id, "targetId": target_id})
