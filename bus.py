
import asyncio
from typing import Dict, List, Callable
from js import console

class ServiceMesh:
    def __init__(self):
        self.listeners: Dict[str, List[Callable]] = {}

    def subscribe(self, event: str, callback: Callable):
        if event not in self.listeners:
            self.listeners[event] = []
        self.listeners[event].append(callback)

    def publish(self, event: str, data: any = None):
        if event in self.listeners:
            for cb in self.listeners[event]:
                if asyncio.iscoroutinefunction(cb):
                    asyncio.ensure_future(cb(data))
                else:
                    try:
                        cb(data)
                    except Exception as e:
                        console.error(f"[ServiceMesh Fail] {event}: {str(e)}")

bus = ServiceMesh()
