
import asyncio
import json
import random
import time
from dataclasses import dataclass, asdict
from typing import Dict, List, Callable, Any, Optional
from js import window, document, localStorage, console, navigator, Image, FileReader
from pyodide.ffi import to_js, create_proxy

# --- [Core Data Structures] ---

@dataclass
class LiaisonSignature:
    uid: str
    designation: str
    avatar_proxy: str = ""
    liaison_status: str = "Authorized"
    last_seen: float = 0.0

@dataclass
class StrategicPulse:
    id: str
    protocol_code: str
    origin_uid: str
    origin_designation: str
    transmission: str
    timestamp: int
    asset_type: str = "TEXT" # TEXT or FILE

@dataclass
class CommunicationProtocol:
    gid: str
    nomenclature: str
    classification: str # P2P or ASSEMBLY
    participants: List[str]
    description: str = "Secure Liaison Link"

# --- [Branding & Visuals] ---

def get_varta_logo_svg(size="w-12 h-12"):
    return f"""
    <div class="flex items-center space-x-4">
        <div class="radar-container">
            <div class="radar-wave"></div>
            <div class="radar-wave"></div>
            <div class="radar-wave"></div>
        </div>
        <svg class="{size}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#1e40af;stop-opacity:1" />
                </linearGradient>
            </defs>
            <path d="M50 5L10 25V75L50 95L90 75V25L50 5Z" fill="url(#logoGrad)" />
            <path d="M35 40L50 60L65 40" stroke="white" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
    </div>
    """

# --- [System Event Bus] ---

class ServiceMesh:
    def __init__(self):
        self._registry: Dict[str, List[Callable]] = {}

    def subscribe(self, event: str, callback: Callable):
        if event not in self._registry:
            self._registry[event] = []
        self._registry[event].append(callback)

    def publish(self, event: str, data: Any = None):
        if event in self._registry:
            for callback in self._registry[event]:
                if asyncio.iscoroutinefunction(callback):
                    asyncio.ensure_future(callback(data))
                else:
                    try:
                        callback(data)
                    except Exception as e:
                        console.error(f"Mesh Publish Error: {str(event)} - {str(e)}")

nexus_bus = ServiceMesh()

# --- [Persistence & Registry] ---

class PulseRegistry:
    def __init__(self, network, uid):
        self._network = network
        self._uid = uid
        self._archives: Dict[str, List[StrategicPulse]] = {}
        self._load_msgstore()
        nexus_bus.subscribe("REMOTE_SIGNAL", self._ingest_signal)

    def _load_msgstore(self):
        try:
            stored = localStorage.getItem(f"varta_msgstore_{self._uid}")
            if stored:
                raw_data = json.loads(stored)
                for gid, pulses in raw_data.items():
                    self._archives[gid] = [StrategicPulse(**p) for p in pulses]
        except:
            pass

    def _save_msgstore(self):
        try:
            serializable = {gid: [asdict(p) for p in pulses] for gid, pulses in self._archives.items()}
            localStorage.setItem(f"varta_msgstore_{self._uid}", json.dumps(serializable))
        except:
            pass

    def _ingest_signal(self, data):
        if not isinstance(data, dict): return
        rid = data.get("roomId", "nexus")
        if rid == "varta_global_signaling": return
        
        content = data.get("content", "")
        asset_type = data.get("assetType", "TEXT")
        
        try:
            payload = json.loads(content)
            ptype = payload.get("type")
            if ptype in ["BOARD_PULSE", "MOUSE_PULSE", "POP_PULSE"]:
                nexus_bus.publish(f"REMOTE_{ptype}", (rid, payload))
                return 
        except:
            pass 

        # Visual Pop for all incoming non-technical signals
        nexus_bus.publish("REMOTE_POP_PULSE", (rid, {"text": content, "name": data.get("senderName")}))

        pulse = StrategicPulse(
            id=data.get("id"),
            protocol_code=rid,
            origin_uid=data.get("senderId"),
            origin_designation=data.get("senderName"),
            transmission=content,
            timestamp=data.get("timestamp"),
            asset_type=asset_type
        )
        self.archive_pulse(pulse)

    def archive_pulse(self, pulse: StrategicPulse):
        rid = pulse.protocol_code
        if rid not in self._archives:
            self._archives[rid] = []
        if not any(x.id == pulse.id for x in self._archives[rid]):
            self._archives[rid].append(pulse)
            self._save_msgstore()
            nexus_bus.publish("PULSE_ARCHIVED", pulse)

    def dispatch_pulse(self, liaison, protocol_code, content, asset_type="TEXT"):
        payload = {
            "id": f"P-{int(time.time()*1000)}-{random.randint(100,999)}",
            "roomId": protocol_code,
            "senderId": liaison.uid,
            "senderName": liaison.designation,
            "content": content,
            "timestamp": int(time.time()*1000),
            "assetType": asset_type
        }
        
        try:
            p_check = json.loads(content)
            is_technical = p_check.get("type") in ["BOARD_PULSE", "MOUSE_PULSE", "POP_PULSE"]
        except:
            is_technical = False
            
        if not is_technical:
            local_pulse = StrategicPulse(
                id=payload["id"],
                protocol_code=payload["roomId"],
                origin_uid=payload["senderId"],
                origin_designation=payload["senderName"],
                transmission=payload["content"],
                timestamp=payload["timestamp"],
                asset_type=payload["assetType"]
            )
            self.archive_pulse(local_pulse)
            
        self._network.transmit_protocol("send_message", payload)

class LiaisonNetwork:
    def __init__(self):
        self._socket = None

    async def establish_synchronization(self):
        for _ in range(30):
            if hasattr(window, "io"): break
            await asyncio.sleep(0.2)
        if not hasattr(window, "io"): return

        hostname = window.location.hostname
        origin = window.location.origin
        base_endpoint = origin
        if hostname in ["localhost", "127.0.0.1"] and window.location.port != "3000":
             base_endpoint = f"{window.location.protocol}//{hostname}:3000"
        
        config = to_js({"transports": ["polling", "websocket"], "reconnection": True})
        try:
            self._socket = window.io.connect(base_endpoint, config)
            def on_handshake(*args):
                nexus_bus.publish("SYNC_ESTABLISHED", self._socket.id)
                self._socket.emit("join_room", to_js({"id": "varta_global_signaling"}))
                for gid in window.app._protocols.keys():
                    self._socket.emit("join_room", to_js({"id": gid}))
            def on_signal(signal, *args):
                try:
                    data = signal.to_py() if hasattr(signal, 'to_py') else signal
                    if data.get("senderId") != window.app._signature.uid:
                        nexus_bus.publish("REMOTE_SIGNAL", data)
                except:
                    pass
            self._socket.on("connect", create_proxy(on_handshake))
            self._socket.on("message", create_proxy(on_signal))
        except:
            pass

    def transmit_protocol(self, signal, payload):
        if self._socket and self._socket.connected: 
            self._socket.emit(signal, to_js(payload))

class SystemController:
    def __init__(self):
        self._signature: Optional[LiaisonSignature] = None
        self._protocols: Dict[str, CommunicationProtocol] = {}
        self._active_gid: Optional[str] = None
        self._active_nav: str = "nexus"
        self._sidebar_expanded: bool = True
        self._discovered_nodes: Dict[str, LiaisonSignature] = {}
        self._network = LiaisonNetwork()
        self._registry: Optional[PulseRegistry] = None
        
        self._is_drawing = False
        self._paint_active = False
        self._paint_tool = "brush" 
        self._ctx = None
        self._canvas = None

    def _get_safe_element(self, element_id: str):
        return document.getElementById(element_id)

    async def synchronize_nexus(self):
        boot_cont = self._get_safe_element("boot-logo-container")
        if boot_cont: boot_cont.innerHTML = get_varta_logo_svg("w-24 h-24")
        await asyncio.sleep(0.8)
        cached = localStorage.getItem("varta_liaison_signature")
        if cached:
            try:
                self._signature = LiaisonSignature(**json.loads(cached))
                await self._authorize_access()
            except:
                self._request_onboarding()
        else:
            self._request_onboarding()

    def _request_onboarding(self):
        self._get_safe_element("boot-screen").classList.add("hidden")
        onboarding = self._get_safe_element("liaison-onboarding")
        if onboarding:
            onboarding.classList.remove("hidden")
            onboarding.innerHTML = f"""
            <div class="max-w-md w-full glass-panel rounded-[4rem] p-16 text-center shadow-2xl animate-interface">
                <div class="flex justify-center mb-10">{get_varta_logo_svg("w-20 h-20")}</div>
                <h1 class="text-4xl font-bold branding-font text-blue-800 mb-8 uppercase">VartaSphere</h1>
                <input id="designation-input" type="text" placeholder="Identity Name..." class="w-full bg-slate-50 border rounded-2xl px-8 py-5 text-center text-slate-800 outline-none mb-10 transition-all font-bold focus:border-blue-500 shadow-sm">
                <button onclick="app.submit_onboarding()" class="w-full py-6 bg-blue-600 text-white rounded-[2.5rem] font-bold uppercase tracking-widest text-[11px] active:scale-95 shadow-lg">Enter Nexus</button>
            </div>
            """

    def submit_onboarding(self):
        inp = self._get_safe_element("designation-input")
        if not inp or not inp.value.strip(): return
        uid = f"LIA-{random.randint(100000, 999999)}"
        self._signature = LiaisonSignature(uid=uid, designation=inp.value.strip(), avatar_proxy=f"https://api.dicebear.com/7.x/initials/svg?seed={inp.value.strip()}")
        localStorage.setItem("varta_liaison_signature", json.dumps(asdict(self._signature)))
        asyncio.ensure_future(self._authorize_access())

    async def _authorize_access(self):
        self._get_safe_element("boot-screen").classList.add("hidden")
        self._get_safe_element("liaison-onboarding").classList.add("hidden")
        shell = self._get_safe_element("app-shell")
        if shell:
            shell.classList.remove("hidden")
            shell.classList.add("opacity-100")
        
        self._load_protocols()
        self._registry = PulseRegistry(self._network, self._signature.uid)
        asyncio.ensure_future(self._network.establish_synchronization())
        
        nexus_bus.subscribe("PULSE_ARCHIVED", lambda _: self._render_pulse_stream())
        nexus_bus.subscribe("REMOTE_SIGNAL", self._handle_signaling)
        nexus_bus.subscribe("REMOTE_BOARD_PULSE", self._handle_remote_draw)
        nexus_bus.subscribe("REMOTE_MOUSE_PULSE", self._handle_remote_mouse)
        nexus_bus.subscribe("REMOTE_POP_PULSE", self._handle_remote_pop)
        
        self._init_board()
        self._refresh_ui()
        # Start the autonomous background beaconing
        asyncio.ensure_future(self._start_discovery_beacon())

    async def _start_discovery_beacon(self):
        """Autonomous signal emission to ripple through the nexus pond."""
        while True:
            if self._network._socket and self._network._socket.connected:
                payload = {
                    "type": "BEACON",
                    "identity": asdict(self._signature),
                    "timestamp": time.time()
                }
                self._network.transmit_protocol("send_message", {
                    "roomId": "varta_global_signaling",
                    "senderId": self._signature.uid,
                    "senderName": self._signature.designation,
                    "content": json.dumps(payload),
                    "timestamp": int(time.time()*1000)
                })
            await asyncio.sleep(5.0)

    def _handle_signaling(self, data):
        if not isinstance(data, dict): return
        rid = data.get("roomId")
        if rid != "varta_global_signaling": return
        try:
            payload = json.loads(data.get("content"))
            msg_type = payload.get("type")
            sender_id = data.get("senderId")
            
            if msg_type == "BEACON" and sender_id != self._signature.uid:
                id_data = payload.get("identity")
                # Store discovered nodes for quick access
                node = LiaisonSignature(**id_data)
                node.last_seen = time.time()
                self._discovered_nodes[sender_id] = node
                self._render_directory()
        except: pass

    def toggle_sidebar(self):
        self._sidebar_expanded = not self._sidebar_expanded
        self._render_directory()

    def _refresh_ui(self):
        self._render_nexus_header()
        self._render_navigation()
        self._render_directory()
        self._render_viewport()
        
        f_info = self._get_safe_element("footer-status-info")
        if f_info:
            status = "STABLE" if self._network._socket and self._network._socket.connected else "OFFLINE"
            f_info.innerHTML = f"<span>NEXUS SYNC V45.0</span><div class='flex items-center space-x-2'><span class='status-dot bg-green-500'></span><span>{status}</span></div>"

    def _render_nexus_header(self):
        container = self._get_safe_element("navbar-container")
        if container:
            container.innerHTML = f"""<div class="flex items-center space-x-6">{get_varta_logo_svg("w-9 h-9")}<span class="branding-font font-bold text-lg tracking-[0.25em] text-blue-800">VARTASPHERE</span></div>"""

    def _render_navigation(self):
        top_cont = self._get_safe_element("nav-top")
        bottom_cont = self._get_safe_element("nav-bottom")
        if not top_cont or not bottom_cont: return
        
        top_ops = [
            ("chat", "Chat", "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"),
            ("groupe", "Group", "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"),
            ("paint", "Paint", "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z")
        ]
        bottom_ops = [
            ("profil", "Profile", "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z")
        ]
        
        def gen_html(ops):
            html = ""
            for id, label, path in ops:
                active = ""
                if id == "paint": active = "active" if self._paint_active else ""
                else: active = "active" if self._active_nav == id else ""
                
                html += f"""<div onclick="app.handle_nav('{id}')" class="nav-anchor {active}"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="{path}"></path></svg><span class="text-[8px] mt-2 font-bold uppercase tracking-widest">{label}</span></div>"""
            return html
            
        top_cont.innerHTML = gen_html(top_ops)
        bottom_cont.innerHTML = gen_html(bottom_ops)

    def _render_directory(self):
        cont = self._get_safe_element("sidebar-container")
        if not cont: return
        if self._sidebar_expanded: cont.classList.remove("collapsed")
        else: cont.classList.add("collapsed")
        
        filter_type = "ASSEMBLY" if self._active_nav == "groupe" else "P2P"
        links = [l for l in self._protocols.values() if l.classification == filter_type]
        title = "P2P HUB" if filter_type == "P2P" else "ASSEMBLIES"
        
        # Add discovered "Beaconing" nodes to the Chat list
        discovered_html = ""
        if filter_type == "P2P":
            # Filter nodes seen in the last 20 seconds
            active_nodes = [n for n in self._discovered_nodes.values() if time.time() - n.last_seen < 20]
            if active_nodes:
                discovered_html = '<p class="text-[9px] font-black uppercase text-blue-600 mt-6 mb-2 tracking-widest">Available Nodes (Live)</p>'
                for node in active_nodes:
                    # Don't show if already in protocols
                    if not any(protocol.gid.startswith(f"P2P-") and node.uid in protocol.participants for protocol in self._protocols.values()):
                        discovered_html += f"""
                        <div onclick="app.quick_handshake('{node.uid}')" class="w-full flex items-center p-4 rounded-2xl border border-blue-100 bg-blue-50/50 cursor-pointer hover:bg-blue-100 transition-all mb-2 animate-pulse">
                            <div class="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-lg">{node.designation[0].upper()}</div>
                            <div class="ml-4 overflow-hidden">
                                <p class="text-[12px] font-extrabold truncate uppercase">{node.designation}</p>
                                <p class="text-[8px] text-blue-400 font-mono">NEURAL BEACON ACTIVE</p>
                            </div>
                        </div>"""

        cont.innerHTML = f"""
        <div class="h-full flex flex-col w-[320px]">
            <div class="p-8 border-b flex justify-between items-center bg-slate-50 flex-shrink-0">
                <h2 class="text-[10px] font-bold branding-font uppercase tracking-widest text-blue-900">{title}</h2>
                <div class="flex items-center space-x-2">
                    <button onclick='app.open_protocol_init()' class='w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-xl shadow-lg'>
                        <svg class='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M12 4v16m8-8H4'></path></svg>
                    </button>
                    <button onclick='app.toggle_sidebar()' class='p-2 hover:bg-slate-200 rounded-lg text-slate-400'>
                        <svg class='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 18L18 6M6 6l12 12'></path></svg>
                    </button>
                </div>
            </div>
            <div class="flex-grow overflow-y-auto p-6 space-y-3 custom-scrollbar">
                {discovered_html}
                <p class="text-[9px] font-black uppercase text-slate-400 mt-6 mb-2 tracking-widest">Saved Protocols</p>
                {"".join([self._get_protocol_card(l) for l in links]) if links else f'<div class="text-center py-20 text-slate-300 font-bold uppercase text-[9px] tracking-widest">Protocol Search Active</div>'}
            </div>
        </div>"""

    def quick_handshake(self, uid):
        """Instantly initialize a link with a beaconing node."""
        gid = f"P2P-{sorted([self._signature.uid, uid])[0][-4:]}-{sorted([self._signature.uid, uid])[1][-4:]}"
        node = self._discovered_nodes.get(uid)
        link = CommunicationProtocol(gid=gid, nomenclature=node.designation if node else f"Node {uid[-4:]}", classification="P2P", participants=[self._signature.uid, uid])
        self._protocols[gid] = link
        self._save_protocols()
        self._network.transmit_protocol("join_room", {"id": gid})
        self.activate_protocol(gid)

    def _get_protocol_card(self, protocol):
        active = "bg-blue-600 text-white shadow-xl scale-105" if protocol.gid == self._active_gid else "bg-white border-transparent hover:border-slate-200 hover:bg-slate-50 text-slate-700"
        sub_text = "text-blue-200" if protocol.gid == self._active_gid else "text-slate-400"
        
        return f"""
        <div onclick="app.activate_protocol('{protocol.gid}')" class="w-full flex items-center p-4 rounded-2xl border cursor-pointer transition-all {active}">
            <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-black text-lg border border-white/20">{protocol.nomenclature[0].upper()}</div>
            <div class="ml-4 overflow-hidden">
                <p class="text-[12px] font-extrabold truncate uppercase tracking-tight">{protocol.nomenclature}</p>
                <p class="text-[8px] {sub_text} font-mono">{protocol.gid}</p>
            </div>
        </div>"""

    def _render_viewport(self):
        for vid in ["board", "nexus", "signature", "toolkit"]:
            el = self._get_safe_element(f"view-{vid}")
            if el: el.classList.add("hidden")
        
        target = "nexus"
        if self._active_nav in ["chat", "groupe", "paint"]:
            target = "board" if self._active_gid else "nexus"
        elif self._active_nav == "profil": target = "signature"
        
        v = self._get_safe_element(f"view-{target}")
        if v: v.classList.remove("hidden")
        
        # Restore Active Pulse indicator
        pulse_ind = self._get_safe_element("pulse-status-indicator")
        if pulse_ind:
            pulse_ind.style.display = "flex" if self._active_gid else "none"

        if target == "board": self._resize_canvas()
        if target == "nexus": self._render_nexus_landing()
        if target == "signature": self._render_signature_dashboard()

        f_normal = self._get_safe_element("footer-normal-mode")
        f_paint = self._get_safe_element("footer-paint-tools")
        if self._paint_active:
            if f_normal: f_normal.classList.add("hidden")
            if f_paint: f_paint.classList.remove("hidden")
        else:
            if f_normal: f_normal.classList.remove("hidden")
            if f_paint: f_paint.classList.add("hidden")

        pip = self._get_safe_element("pip-chat-window")
        if pip:
            if self._active_gid:
                pip.style.display = "flex"
                label = self._get_safe_element("pip-mode-label")
                protocol = self._protocols.get(self._active_gid)
                if label and protocol: label.innerText = f"PULSE: {protocol.nomenclature}"
                self._render_pulse_stream()
            else:
                pip.style.display = "none"

    def handle_nav(self, nav_id):
        if nav_id == "paint":
            self._paint_active = not self._paint_active
        else:
            if self._active_nav == nav_id:
                self._sidebar_expanded = not self._sidebar_expanded
            else:
                self._active_nav = nav_id
                self._sidebar_expanded = True
            
        self._refresh_ui()

    def _init_board(self):
        self._canvas = self._get_safe_element("board-canvas")
        if not self._canvas: return
        self._ctx = self._canvas.getContext("2d")
        
        self._canvas.addEventListener("mousedown", create_proxy(lambda e: self._handle_draw_start(e)))
        self._canvas.addEventListener("mouseup", create_proxy(lambda e: self._handle_draw_stop(e)))
        self._canvas.addEventListener("mousemove", create_proxy(lambda e: self._handle_board_move(e)))
        window.addEventListener("resize", create_proxy(lambda e: self._resize_canvas()))

    def _resize_canvas(self):
        if not self._canvas: return
        rect = self._canvas.parentElement.getBoundingClientRect()
        if rect.width > 0 and rect.height > 0:
            if self._canvas.width != int(rect.width) or self._canvas.height != int(rect.height):
                try: temp = self._ctx.getImageData(0, 0, self._canvas.width, self._canvas.height)
                except: temp = None
                self._canvas.width = int(rect.width)
                self._canvas.height = int(rect.height)
                if temp: self._ctx.putImageData(temp, 0, 0)

    def _get_canvas_coords(self, e):
        rect = self._canvas.getBoundingClientRect()
        # Ensure scale is accurate for precise drawing
        scale_x = self._canvas.width / rect.width
        scale_y = self._canvas.height / rect.height
        return (e.clientX - rect.left) * scale_x, (e.clientY - rect.top) * scale_y

    def _handle_draw_start(self, e):
        if not self._paint_active: return
        self._is_drawing = True
        self._ctx.beginPath()
        x, y = self._get_canvas_coords(e)
        self._ctx.moveTo(x, y)
        self._draw(e)

    def _handle_draw_stop(self, e): 
        self._is_drawing = False
        self._ctx.beginPath()

    def _handle_board_move(self, e):
        if not self._canvas: return
        x, y = self._get_canvas_coords(e)
        if self._active_gid:
            self._registry.dispatch_pulse(self._signature, self._active_gid, json.dumps({"type": "MOUSE_PULSE", "x": x, "y": y, "uid": self._signature.uid, "name": self._signature.designation}))
        if self._is_drawing: self._draw(e)

    def _draw(self, e):
        if not self._is_drawing: return
        x, y = self._get_canvas_coords(e)
        size = int(self._get_safe_element("board-brush-size").value)
        color = self._get_safe_element("board-brush-color").value
        
        self._ctx.lineWidth = size
        self._ctx.lineCap = "round"
        self._ctx.lineJoin = "round"
        
        if self._paint_tool == "eraser":
            self._ctx.globalCompositeOperation = "destination-out"
        else:
            self._ctx.globalCompositeOperation = "source-over"
            self._ctx.strokeStyle = color
            
        self._ctx.lineTo(x, y)
        self._ctx.stroke()
        self._ctx.beginPath()
        self._ctx.moveTo(x, y)
        
        if self._active_gid:
            self._registry.dispatch_pulse(self._signature, self._active_gid, json.dumps({
                "type": "BOARD_PULSE", "kind": "line", "x": x, "y": y, 
                "color": color if self._paint_tool == "brush" else "transparent", 
                "size": size, "tool": self._paint_tool
            }))

    def _handle_remote_draw(self, data_tuple):
        rid, payload = data_tuple
        if rid != self._active_gid: return
        if payload.get("kind") == "clear":
            self.clear_board_local()
            return
        if payload.get("kind") == "line":
            self._ctx.lineWidth = payload.get("size")
            self._ctx.lineCap = "round"
            self._ctx.lineJoin = "round"
            tool = payload.get("tool", "brush")
            if tool == "eraser": self._ctx.globalCompositeOperation = "destination-out"
            else:
                self._ctx.globalCompositeOperation = "source-over"
                self._ctx.strokeStyle = payload.get("color")
            self._ctx.lineTo(payload.get("x"), payload.get("y"))
            self._ctx.stroke()
            self._ctx.beginPath()
            self._ctx.moveTo(payload.get("x"), payload.get("y"))

    def set_paint_tool(self, tool):
        self._paint_tool = tool
        for t in ["brush", "eraser"]:
            btn = self._get_safe_element(f"tool-{t}")
            if btn:
                if t == tool: btn.classList.add("active")
                else: btn.classList.remove("active")

    def trigger_clear_board(self):
        self.clear_board_local()
        if self._active_gid: self._registry.dispatch_pulse(self._signature, self._active_gid, json.dumps({"type": "BOARD_PULSE", "kind": "clear"}))

    def clear_board_local(self):
        if self._ctx:
            self._ctx.globalCompositeOperation = "source-over"
            self._ctx.clearRect(0, 0, self._canvas.width, self._canvas.height)

    def _handle_remote_mouse(self, data_tuple):
        rid, payload = data_tuple
        if rid != self._active_gid: return
        uid = payload.get("uid")
        cont = self._get_safe_element("remote-cursors-container")
        cursor = self._get_safe_element(f"cursor-{uid}")
        
        if not cursor:
            cursor = document.createElement("div")
            cursor.id = f"cursor-{uid}"
            cursor.style.position = "absolute"; cursor.style.pointerEvents = "none"; cursor.style.zIndex = "100"
            cursor.innerHTML = f'<svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M0 0L19 7L11 9L9 17L0 0Z" fill="#1e40af" stroke="white" stroke-width="1"/></svg><div style="position:absolute;left:10px;top:10px;background:#1e40af;color:white;font-size:8px;padding:2px 4px;border-radius:4px;white-space:nowrap;">{payload.get("name")}</div>'
            cont.appendChild(cursor)
        
        rect = self._canvas.getBoundingClientRect()
        disp_scale_x = rect.width / self._canvas.width
        disp_scale_y = rect.height / self._canvas.height
        
        cursor.style.left = f"{payload.get('x') * disp_scale_x}px"
        cursor.style.top = f"{payload.get('y') * disp_scale_y}px"

    def _handle_remote_pop(self, data_tuple):
        rid, payload = data_tuple
        if rid != self._active_gid: return
        self._spawn_pop_visual(payload.get("text"), payload.get("name"))

    def _spawn_pop_visual(self, content, author):
        overlay = self._get_safe_element("pop-overlay")
        if not overlay: return
        pop = document.createElement("div")
        pop.className = "nexus-pop-item"
        pop.innerText = f"{author}: {content}"
        pop.style.left = f"{random.randint(15, 75)}%"
        pop.style.top = f"{random.randint(15, 75)}%"
        overlay.appendChild(pop)
        async def cleanup(): 
            await asyncio.sleep(5.0)
            pop.remove()
        asyncio.ensure_future(cleanup())

    def send_global_emoji(self, emoji):
        if self._active_gid:
            self._registry.dispatch_pulse(self._signature, self._active_gid, emoji)
            self._spawn_pop_visual(emoji, "ME")
        else:
            console.warn("Nexus Alert: No active protocol for reaction transmission.")

    def handle_file_select(self, event, context):
        files = event.target.files
        if not files or not files.length: return
        file = files[0]
        reader = FileReader.new()
        
        def on_load(e):
            base64_data = reader.result
            if self._active_gid:
                self._registry.dispatch_pulse(self._signature, self._active_gid, f"Shared Protocol Asset: {file.name}|{base64_data}", asset_type="FILE")
        
        reader.onload = create_proxy(on_load)
        reader.readAsDataURL(file)

    def dispatch_strategic_pulse(self):
        inp = self._get_safe_element("transmission-payload")
        if inp.value.strip():
            msg = inp.value.strip()
            self._registry.dispatch_pulse(self._signature, self._active_gid, msg)
            self._spawn_pop_visual(msg, "ME")
            inp.value = ""

    def activate_protocol(self, gid):
        self._active_gid = gid
        self._sidebar_expanded = False
        self._refresh_ui()

    def open_protocol_init(self):
        modal = self._get_safe_element("modal-container")
        if not modal: return
        modal.classList.remove("hidden")
        
        # Strictly separated Modal content logic
        if self._active_nav == "groupe":
            modal_content = f"""
            <h3 class="text-xl font-bold branding-font text-center mb-10 uppercase text-blue-800">Assembly Link</h3>
            <div class="space-y-10">
                <div class="space-y-4">
                    <p class="text-[10px] font-bold uppercase text-slate-400 pl-4 tracking-widest">Create Assembly</p>
                    <input id="assembly-name-input" type="text" placeholder="Assembly Designation..." class="w-full bg-slate-50 border rounded-2xl px-6 py-4 outline-none focus:border-blue-400 font-bold shadow-sm">
                    <button onclick="app.finalize_group()" class="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-700 transition-colors">Initialize Assembly</button>
                </div>
                <div class="relative py-2"><div class="absolute inset-0 flex items-center"><div class="w-full border-t border-slate-100"></div></div><div class="relative flex justify-center"><span class="px-4 bg-white text-slate-300 font-bold text-[9px]">OR SYNCHRONIZE GID</span></div></div>
                <div class="space-y-4">
                    <p class="text-[10px] font-bold uppercase text-slate-400 pl-4 tracking-widest">Join GID</p>
                    <input id="assembly-join-input" type="text" placeholder="GID Protocol..." class="w-full bg-slate-50 border rounded-2xl px-6 py-4 outline-none focus:border-blue-400 font-mono font-bold uppercase shadow-sm">
                    <button onclick="app.join_assembly()" class="w-full py-4 bg-slate-800 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition-colors">Synchronize GID</button>
                </div>
            </div>
            """
        else: # Chat Hub (P2P) Handshake
            modal_content = f"""
            <h3 class="text-xl font-bold branding-font text-center mb-10 uppercase text-blue-800">Liaison Handshake</h3>
            <div class="space-y-10">
                <div class="space-y-4">
                    <p class="text-[10px] font-bold uppercase text-slate-400 pl-4 tracking-widest">Neural Link Connection</p>
                    <input id="p2p-uid-input" type="text" placeholder="LIA-XXXXXX UID..." class="w-full bg-slate-50 border rounded-2xl px-6 py-4 outline-none focus:border-blue-400 font-mono font-bold uppercase shadow-sm">
                    <button onclick="app.finalize_p2p()" class="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-700 transition-colors">Establish Neural Link</button>
                </div>
                <div class="bg-blue-50 p-6 rounded-2xl">
                    <p class="text-[9px] text-blue-600 font-bold uppercase mb-2">Protocol Note</p>
                    <p class="text-[11px] text-blue-800 leading-relaxed">Discovery beacons allow you to see nodes appearing live in the directory. You can also manually link via UID above.</p>
                </div>
            </div>
            """

        modal.innerHTML = f"""
        <div class="max-w-md w-full glass-panel rounded-[3rem] p-12 shadow-2xl animate-interface">
            {modal_content}
            <button class="w-full mt-10 text-slate-400 text-[10px] font-bold uppercase hover:text-red-500 transition-colors" onclick="app.close_nexus_modal()">Abort Action</button>
        </div>"""

    def finalize_group(self):
        name = self._get_safe_element("assembly-name-input").value.strip()
        if not name: return
        gid = f"GID-{random.randint(100000, 999999)}"
        link = CommunicationProtocol(gid=gid, nomenclature=name, classification="ASSEMBLY", participants=[self._signature.uid])
        self._protocols[gid] = link
        self._save_protocols()
        self._network.transmit_protocol("join_room", {"id": gid})
        self.close_nexus_modal(); self.activate_protocol(gid)

    def finalize_p2p(self):
        uid = self._get_safe_element("p2p-uid-input").value.strip().upper()
        if not uid: return
        gid = f"P2P-{sorted([self._signature.uid, uid])[0][-4:]}-{sorted([self._signature.uid, uid])[1][-4:]}"
        link = CommunicationProtocol(gid=gid, nomenclature=f"Liaison {uid[-6:]}", classification="P2P", participants=[self._signature.uid, uid])
        self._protocols[gid] = link
        self._save_protocols()
        self._network.transmit_protocol("join_room", {"id": gid})
        self.close_nexus_modal(); self.activate_protocol(gid)

    def join_assembly(self):
        gid = self._get_safe_element("assembly-join-input").value.strip().upper()
        if not gid: return
        link = CommunicationProtocol(gid=gid, nomenclature=f"Assembly {gid[-4:]}", classification="ASSEMBLY", participants=[self._signature.uid])
        self._protocols[gid] = link
        self._save_protocols()
        self._network.transmit_protocol("join_room", {"id": gid})
        self.close_nexus_modal(); self.activate_protocol(gid)

    def close_nexus_modal(self): self._get_safe_element("modal-container").classList.add("hidden")
    
    def _render_pulse_stream(self):
        cont = self._get_safe_element("pip-messages")
        if not cont: return
        cont.innerHTML = ""
        pulses = self._registry._archives.get(self._active_gid, [])
        for p in pulses:
            own = p.origin_uid == self._signature.uid
            content_html = ""
            if p.asset_type == "FILE":
                try:
                    name, data = p.transmission.split("|", 1)
                    name = name.replace("Shared Protocol Asset: ", "")
                    if "data:image" in data:
                        content_html = f'<div class="mb-2"><img src="{data}" class="rounded-lg max-h-40 w-full object-cover border" /></div><a href="{data}" download="{name}" class="text-[10px] font-bold underline text-blue-800">Download Asset</a>'
                    else:
                        content_html = f'<div class="flex items-center space-x-2"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg><a href="{data}" download="{name}" class="text-[11px] font-bold underline truncate text-blue-800">{name}</a></div>'
                except:
                    content_html = p.transmission
            else:
                content_html = p.transmission

            cont.innerHTML += f"""<div class="flex {'justify-end' if own else 'justify-start'} animate-interface"><div class="max-w-[85%]"><div class="sender-tag text-[8px] font-bold uppercase text-blue-800 mb-1 pl-1">{p.origin_designation}</div><div class="px-5 py-3 rounded-2xl text-[12px] shadow-sm {'bg-blue-600 text-white' if own else 'bg-white border text-slate-700'}" style="border-radius: {'1.5rem 0.5rem 1.5rem 1.5rem' if own else '0.5rem 1.5rem 1.5rem 1.5rem'}">{content_html}</div></div></div>"""
        cont.scrollTo(0, cont.scrollHeight)

    def _render_nexus_landing(self):
        cont = self._get_safe_element("view-nexus")
        if cont: cont.innerHTML = f"""<div class="max-w-4xl mx-auto py-32 text-center animate-interface"><div class="flex justify-center mb-16">{get_varta_logo_svg("w-32 h-32")}</div><h1 class="text-5xl font-bold branding-font mb-8 tracking-tighter text-blue-800">NEXUS CORE</h1><p class="text-slate-400 uppercase tracking-[0.5em] text-[10px] font-bold">Node Identity: {self._signature.uid if self._signature else 'None'}</p></div>"""

    def _render_signature_dashboard(self):
        cont = self._get_safe_element("view-signature")
        if cont: cont.innerHTML = f"""<div class="max-w-md w-full glass-panel rounded-[4rem] p-16 text-center animate-interface shadow-2xl"><img src="{self._signature.avatar_proxy}" class="w-44 h-44 mx-auto rounded-[3rem] shadow-xl border-8 border-white mb-12" /><h2 class="text-3xl font-bold branding-font mb-3 uppercase text-blue-900">{self._signature.designation}</h2><p class="text-slate-400 text-xs mb-10">{self._signature.uid}</p><button onclick="app.deauthorize_liaison()" class="w-full py-6 bg-red-50 text-red-600 border border-red-100 rounded-3xl text-[12px] font-bold uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-sm">Deauthorize Profile</button></div>"""

    def _load_protocols(self):
        stored = localStorage.getItem(f"varta_protocols_{self._signature.uid if self._signature else 'default'}")
        if stored:
            try:
                data = json.loads(stored)
                for k, v in data.items(): self._protocols[k] = CommunicationProtocol(**v)
            except: pass

    def _save_protocols(self): 
        if self._signature:
            localStorage.setItem(f"varta_protocols_{self._signature.uid}", json.dumps({k: asdict(v) for k, v in self._protocols.items()}))
            
    def deauthorize_liaison(self): localStorage.removeItem("varta_liaison_signature"); window.location.reload()
    def toggle_pip_visibility(self): 
        pip = self._get_safe_element("pip-chat-window")
        if pip: pip.style.display = "none" if pip.style.display == "flex" else "flex"
    def intercept_transmission(self, e): 
        if e.key == "Enter": self.dispatch_strategic_pulse()
    def toggle_pip_emojis(self):
        p = self._get_safe_element("pip-emoji-picker")
        if p: p.classList.toggle("hidden")
    def send_pip_emoji(self, emoji):
        if self._active_gid:
            self._registry.dispatch_pulse(self._signature, self._active_gid, emoji)
            self._spawn_pop_visual(emoji, "ME")
            self.toggle_pip_emojis()

app = SystemController()
window.app = app
asyncio.ensure_future(app.synchronize_nexus())
