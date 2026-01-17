
from js import window, console, io
from pyodide.ffi import to_js
from bus import bus

class NetworkService:
    def __init__(self):
        self.socket = None

    def connect(self):
        hostname = window.location.hostname
        protocol = window.location.protocol
        port = window.location.port
        origin = window.location.origin
        
        is_local = (
            hostname == "localhost" or 
            hostname == "127.0.0.1" or 
            hostname.startswith("192.168.") or 
            hostname.startswith("10.") or 
            hostname.startswith("172.") or
            hostname.endswith(".local")
        )
        
        url = origin
        if is_local and port and port not in ["3000"]:
             url = f"{protocol}//{hostname}:3000"
        
        console.log(f"[Network] Signaling Service targeting: {url}")
        
        options = to_js({
            "transports": ["polling", "websocket"],
            "reconnection": True
        })
        
        try:
            self.socket = io.connect(url, options)
            
            @self.socket.on("connect")
            def on_connect():
                bus.publish("NET_CONNECTED", self.socket.id)
                self.socket.emit("join_room", to_js({"id": "varta_global_signaling"}))

            @self.socket.on("message")
            def on_msg(msg):
                msg_py = msg.to_py() if hasattr(msg, 'to_py') else msg
                bus.publish("RAW_SIGNAL", msg_py)
                
            @self.socket.on("connect_error")
            def on_error(err):
                console.warn(f"[Network] Connection Interruption: {err}")
                
        except Exception as e:
            console.error(f"[Network] Signaling link failed: {str(e)}")

    def emit_remote(self, event, data):
        if self.socket:
            self.socket.emit(event, to_js(data))
