import json
import logging
from typing import Dict, List, Any
from fastapi import WebSocket

logger = logging.getLogger("collabnotes.websocket")

class ConnectionManager:
    def __init__(self):
        # Maps document_id (int) to list of WebSockets
        self.active_connections: Dict[int, List[WebSocket]] = {}
        # Maps WebSocket connection to user metadata dict
        self.user_metadata: Dict[WebSocket, Dict[str, Any]] = {}

    async def connect(self, websocket: WebSocket, document_id: int, user: Any):
        await websocket.accept()
        
        if document_id not in self.active_connections:
            self.active_connections[document_id] = []
        
        self.active_connections[document_id].append(websocket)
        
        # Color palette for collaborative cursors
        colors = [
            "#3B82F6", "#EF4444", "#10B981", "#F59E0B", 
            "#8B5CF6", "#EC4899", "#14B8A6", "#6366F1"
        ]
        user_color = colors[user.id % len(colors)]
        
        self.user_metadata[websocket] = {
            "user_id": user.id,
            "username": user.username,
            "email": user.email,
            "color": user_color,
            "is_typing": False,
            "cursor": None # {index: 0, length: 0}
        }
        
        logger.info(f"User {user.username} (ID: {user.id}) joined document room {document_id}")
        
        # Notify room that user joined
        active_users = self.get_active_users(document_id)
        await self.broadcast(
            document_id,
            {
                "event": "user_joined",
                "user": {
                    "user_id": user.id,
                    "username": user.username,
                    "color": user_color
                },
                "active_users": active_users
            }
        )

    async def disconnect(self, websocket: WebSocket, document_id: int):
        if document_id in self.active_connections:
            if websocket in self.active_connections[document_id]:
                self.active_connections[document_id].remove(websocket)
                
            if not self.active_connections[document_id]:
                del self.active_connections[document_id]
                
        user_info = self.user_metadata.pop(websocket, None)
        
        if user_info:
            logger.info(f"User {user_info['username']} left document room {document_id}")
            # Notify others
            active_users = self.get_active_users(document_id)
            await self.broadcast(
                document_id,
                {
                    "event": "user_left",
                    "user": {
                        "user_id": user_info["user_id"],
                        "username": user_info["username"]
                    },
                    "active_users": active_users
                }
            )

    def get_active_users(self, document_id: int) -> List[Dict[str, Any]]:
        users = []
        connections = self.active_connections.get(document_id, [])
        seen_users = set()  # To avoid duplicates if same user opens multiple tabs
        
        for ws in connections:
            meta = self.user_metadata.get(ws)
            if meta and meta["user_id"] not in seen_users:
                users.append({
                    "user_id": meta["user_id"],
                    "username": meta["username"],
                    "color": meta["color"],
                    "is_typing": meta["is_typing"],
                    "cursor": meta["cursor"]
                })
                seen_users.add(meta["user_id"])
        return users

    async def broadcast(self, document_id: int, message: Dict[str, Any], exclude: WebSocket = None):
        connections = self.active_connections.get(document_id, [])
        payload = json.dumps(message)
        
        for ws in connections:
            if ws != exclude:
                try:
                    await ws.send_text(payload)
                except Exception as e:
                    logger.error(f"Error sending message to client: {e}")

    async def update_typing(self, websocket: WebSocket, document_id: int, is_typing: bool):
        if websocket in self.user_metadata:
            self.user_metadata[websocket]["is_typing"] = is_typing
            meta = self.user_metadata[websocket]
            await self.broadcast(
                document_id,
                {
                    "event": "user_typing",
                    "user_id": meta["user_id"],
                    "username": meta["username"],
                    "is_typing": is_typing
                },
                exclude=websocket
            )

    async def update_cursor(self, websocket: WebSocket, document_id: int, cursor: Any):
        if websocket in self.user_metadata:
            self.user_metadata[websocket]["cursor"] = cursor
            meta = self.user_metadata[websocket]
            await self.broadcast(
                document_id,
                {
                    "event": "cursor_move",
                    "user_id": meta["user_id"],
                    "username": meta["username"],
                    "color": meta["color"],
                    "cursor": cursor
                },
                exclude=websocket
            )

# Singleton manager
manager = ConnectionManager()
