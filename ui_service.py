
import time
import asyncio
from js import document, console
from bus import bus

class UIRenderer:
    def __init__(self, app):
        self.app = app
        bus.subscribe("MSG_LOGGED", self.on_msg)
        bus.subscribe("AI_SUGGESTIONS", self.render_sugs)
        bus.subscribe("NODE_FOUND", self.on_node)

    def on_msg(self, msg):
        if msg.roomId == self.app.active_room_id:
            self.render_messages()
            if msg.senderId != self.app.user.id:
                asyncio.ensure_future(self.app.ai.generate_replies(msg.content))
        self.render_sidebar()

    def render_messages(self):
        container = document.getElementById("message-container")
        container.innerHTML = ""
        msgs = self.app.messaging.messages.get(self.app.active_room_id, [])
        for m in msgs:
            is_self = m.senderId == self.app.user.id
            container.innerHTML += f"""
            <div class="flex { 'justify-end' if is_self else 'justify-start' } animate-fade">
                <div class="max-w-[80%]">
                    <p class="text-[8px] text-slate-500 uppercase font-bold mb-1 { 'text-right' if is_self else '' }">{m.senderName}</p>
                    <div class="p-3 rounded-2xl text-[13px] { 'bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-500/10' if is_self else 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700' }">
                        {m.content}
                    </div>
                </div>
            </div>
            """
        container.scrollTo(0, container.scrollHeight)

    def render_sugs(self, sugs):
        box = document.getElementById("suggestion-box")
        if not box: return
        box.innerHTML = ""
        for s in sugs:
            box.innerHTML += f'<button onclick="app.ui_reply(\'{s}\')" class="whitespace-nowrap px-4 py-2 bg-blue-900/30 text-blue-400 border border-blue-800/50 rounded-full text-[10px] font-bold uppercase hover:bg-blue-800/40 transition-colors">{s}</button>'

    def on_node(self, identity):
        res = document.getElementById("probe-result")
        if res:
            res.classList.remove("hidden")
            document.getElementById("probe-name-txt").innerText = identity.get("name")
            document.getElementById("probe-icon").innerText = identity.get("name")[0]
            document.getElementById("probe-connect-btn").classList.remove("hidden")
            self.app.temp_id = identity

    def render_sidebar(self):
        container = document.getElementById("sidebar-container")
        container.innerHTML = f"""
        <div class="p-5 border-b border-slate-800 flex justify-between items-center">
            <h2 class="text-[10px] font-bold gaming-font uppercase tracking-widest text-slate-400">Neural Nodes</h2>
            <button onclick="app.open_probe_modal()" class="p-1.5 bg-blue-600/10 text-blue-400 border border-blue-600/30 rounded-lg hover:bg-blue-600/20 transition-all">+</button>
        </div>
        <div class="flex-grow overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {"".join([self.get_room_html(r) for r in self.app.rooms.values()]) if self.app.rooms else '<p class="text-[8px] text-center text-slate-600 mt-10">Searching frequencies...</p>'}
        </div>
        """

    def get_room_html(self, room):
        active = "bg-blue-600/10 border-blue-500/30 text-blue-400" if room.id == self.app.active_room_id else "border-transparent text-slate-400"
        return f"""
        <div onclick="app.set_room('{room.id}')" class="w-full flex items-center p-3 rounded-xl border cursor-pointer transition-all {active}">
            <div class="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center font-bold">{room.name[0]}</div>
            <div class="ml-3 overflow-hidden">
                <p class="text-xs font-bold truncate uppercase">{room.name}</p>
                <p class="text-[8px] text-slate-500 uppercase tracking-tighter">Connected</p>
            </div>
        </div>
        """
