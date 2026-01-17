
import asyncio
import json
import random
from dataclasses import asdict
from js import window, document, localStorage, console
from bus import bus
from models import User, ChatRoom, Message
from network_service import NetworkService
from messaging_service import MessagingService
from discovery_service import DiscoveryService
from ai_service import AIService
from ui_service import UIRenderer

class VartaApp:
    def __init__(self):
        self.user = None
        self.rooms = {}
        self.active_room_id = None
        self.active_view = "hub"
        
        # Microservice Cluster
        self.network = NetworkService()
        self.messaging = MessagingService(self.network)
        self.discovery = DiscoveryService(self.network)
        self.ai = AIService()
        self.ui = UIRenderer(self)

    async def boot(self):
        document.getElementById("boot-status").innerText = "Kernel Loading..."
        await asyncio.sleep(0.5)
        
        raw = localStorage.getItem("varta_session")
        if raw:
            self.user = User(**json.loads(raw))
            self.start_cluster()
        else:
            self.show_onboarding()

    def show_onboarding(self):
        document.getElementById("boot-screen").classList.add("hidden")
        document.getElementById("login-view").classList.remove("hidden")
        document.getElementById("login-view").innerHTML = f"""
        <div class="max-w-md w-full glass-effect rounded-[3rem] p-12 text-center border border-white/10 animate-fade">
            <img src="Varta.png" class="w-32 mx-auto mb-8 logo-glow" alt="Logo">
            <h1 class="text-3xl font-bold gaming-font text-white mb-2 uppercase tracking-tighter">VartaSphere</h1>
            <input id="onboard-name" type="text" placeholder="Designation..." class="w-full bg-black border border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-blue-500 outline-none mb-6">
            <button onclick="app.complete_onboarding()" class="w-full py-5 varta-btn-primary rounded-2xl font-bold uppercase tracking-widest active:scale-95">Link Identity</button>
        </div>
        """

    def complete_onboarding(self):
        name = document.getElementById("onboard-name").value
        if not name: return
        self.user = User(id=f"node_{random.randint(1000,9999)}", name=name, avatar=f"https://api.dicebear.com/7.x/bottts/svg?seed={name}")
        localStorage.setItem("varta_session", json.dumps(asdict(self.user)))
        self.start_cluster()

    def start_cluster(self):
        document.getElementById("boot-screen").classList.add("hidden")
        document.getElementById("login-view").classList.add("hidden")
        shell = document.getElementById("app-shell")
        shell.classList.remove("hidden")
        asyncio.ensure_future(self.fade_in())
        
        self.network.connect()
        bus.subscribe("INVITE_RCVD", self.on_invite)
        self.render_all()

    async def fade_in(self):
        await asyncio.sleep(0.1)
        document.getElementById("app-shell").classList.remove("opacity-0")

    def render_all(self):
        self.render_navbar()
        self.ui.render_sidebar()
        self.render_view()

    def render_navbar(self):
        container = document.getElementById("navbar-container")
        container.innerHTML = f"""
        <div class="flex items-center space-x-4">
            <img src="Varta.png" class="h-8 w-auto" alt="Logo">
            <span class="gaming-font font-bold text-lg hidden md:block">VARTASPHERE</span>
        </div>
        <div onclick="app.set_view('profile')" class="flex items-center space-x-3 cursor-pointer">
            <span class="text-xs font-bold text-slate-300">{self.user.name}</span>
            <img src="{self.user.avatar}" class="w-9 h-9 bg-slate-800 rounded-lg border border-white/10" />
        </div>
        """

    def set_view(self, view):
        self.active_view = view
        self.render_view()

    def render_view(self):
        document.getElementById("chat-view").classList.add("hidden")
        document.getElementById("hub-view").classList.add("hidden")
        document.getElementById("profile-view").classList.add("hidden")
        
        if self.active_view == "chat":
            document.getElementById("chat-view").classList.remove("hidden")
            self.ui.render_messages()
            self.render_input()
        elif self.active_view == "hub":
            document.getElementById("hub-view").classList.remove("hidden")
            self.render_hub()
        elif self.active_view == "profile":
            document.getElementById("profile-view").classList.remove("hidden")
            self.render_profile()

    def render_input(self):
        document.getElementById("chat-input-area").innerHTML = f"""
        <div id="suggestion-box" class="flex space-x-2 mb-4 overflow-x-auto scrollbar-none"></div>
        <div class="flex items-center space-x-3">
            <input id="chat-box" type="text" placeholder="Transmit..." class="flex-grow bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 outline-none" onkeydown="app.on_key(event)">
            <button onclick="app.send()" class="p-3 varta-btn-primary rounded-xl">SEND</button>
        </div>
        """

    def render_hub(self):
        document.getElementById("hub-view").innerHTML = """
        <div class="max-w-4xl mx-auto py-10 text-center">
            <h1 class="text-4xl font-bold gaming-font mb-4">THE NEURAL MESH</h1>
            <p class="text-slate-500 uppercase tracking-widest text-xs mb-10">Microservice Protocol v3.2</p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div class="p-8 bg-slate-900/40 border border-slate-800 rounded-3xl">
                    <h3 class="font-bold mb-2">GLOBAL CHANNEL</h3>
                    <button class="w-full py-3 bg-blue-600 rounded-xl text-[10px] font-bold">SYNC</button>
                </div>
            </div>
        </div>
        """

    def render_profile(self):
        document.getElementById("profile-view").innerHTML = f"""
        <div class="max-w-md w-full glass-effect rounded-[3rem] p-10 text-center animate-fade">
            <img src="{self.user.avatar}" class="w-24 h-24 mx-auto rounded-2xl mb-6 shadow-xl" />
            <h2 class="text-2xl font-bold gaming-font mb-8">{self.user.name}</h2>
            <button onclick="app.logout()" class="w-full py-4 bg-red-900/20 text-red-500 border border-red-900/30 rounded-2xl text-[10px] font-bold uppercase tracking-widest">DISCONNECT</button>
        </div>
        """

    def on_invite(self, data):
        room = ChatRoom(**data)
        if room.id not in self.rooms:
            self.rooms[room.id] = room
            self.network.emit_remote("join_room", {"id": room.id})
            self.ui.render_sidebar()

    def set_room(self, rid):
        self.active_room_id = rid
        self.active_view = "chat"
        self.render_view()

    def open_probe_modal(self):
        document.getElementById("modal-container").classList.remove("hidden")
        document.getElementById("modal-container").innerHTML = """
        <div class="max-w-sm w-full glass-effect rounded-[2.5rem] p-8 border border-slate-700 animate-fade">
            <h3 class="text-xs font-bold gaming-font text-center mb-6 text-white">NEURAL PROBE</h3>
            <input id="probe-id" type="text" placeholder="Target UID..." class="w-full bg-black border border-slate-800 rounded-xl px-4 py-3 text-sm text-white mb-4">
            <div id="probe-result" class="hidden p-4 bg-blue-600/10 border border-blue-500/30 rounded-2xl flex items-center mb-4">
                <div class="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center font-bold mr-4" id="probe-icon">?</div>
                <div><p class="text-xs font-bold text-white uppercase" id="probe-name-txt">---</p></div>
            </div>
            <button onclick="app.run_probe()" class="w-full py-4 bg-slate-800 text-slate-300 rounded-xl text-[10px] font-bold mb-2">PULSE</button>
            <button id="probe-connect-btn" class="hidden w-full py-4 varta-btn-primary rounded-xl font-bold text-[10px]" onclick="app.link()">ESTABLISH</button>
            <button class="w-full text-slate-600 text-[10px] font-bold mt-2" onclick="app.close_modal()">CANCEL</button>
        </div>
        """

    def close_modal(self):
        document.getElementById("modal-container").classList.add("hidden")

    def run_probe(self):
        uid = document.getElementById("probe-id").value.strip()
        if uid: self.discovery.probe(uid)

    def link(self):
        target = self.temp_id
        rid = f"dm_{min(self.user.id, target['id'])}_{max(self.user.id, target['id'])}"
        room = ChatRoom(id=rid, name=target['name'], description="P2P Link", type="dm", members=[self.user.id, target['id']])
        self.rooms[rid] = room
        self.network.emit_remote("join_room", {"id": rid})
        self.discovery.send_sig({"type": "INVITE", "targetId": target['id'], "room": asdict(room)})
        self.close_modal()
        self.set_room(rid)

    def send(self):
        box = document.getElementById("chat-box")
        val = box.value.strip()
        if val and self.active_room_id:
            self.messaging.dispatch(self.user, self.active_room_id, val)
            box.value = ""

    def ui_reply(self, text):
        document.getElementById("chat-box").value = text
        self.send()

    def on_key(self, e):
        if e.key == "Enter": self.send()

    def logout(self):
        localStorage.removeItem("varta_session")
        window.location.reload()

app = VartaApp()
window.app = app
asyncio.ensure_future(app.boot())
