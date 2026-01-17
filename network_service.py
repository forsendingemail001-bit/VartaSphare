
from js import window, console, io
from pyodide.ffi import to_js
from bus import bus

class NetworkService:
    def __init__(self):
        self.socket = None

    def connect(self):
        url = window.location.origin
        if "localhost" in window.location.hostname and window.location.port != "3000":
             url = f"{window.location.protocol}//{window.location.hostname}:3000"
        
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
                console.warn(f"[Network] Connect Error: {err}")
                
        except Exception as e:
            console.error(f"[Network] Connect failed: {str(e)}")

    def emit_remote(self, event, data):
        if self.socket:
            self.socket.emit(event, to_js(data))
