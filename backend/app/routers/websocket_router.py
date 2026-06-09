import json
import logging
import datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, Depends
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.services.auth_service import get_user_from_token
from app.websocket.websocket_manager import manager
from app.models.models import Document, DocumentHistory, ActivityLog
from app.routers.documents import check_permission

router = APIRouter(tags=["websockets"])
logger = logging.getLogger("collabnotes.websocket")

@router.websocket("/ws/document/{document_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    document_id: int,
    token: str = Query(None),
    db: Session = Depends(get_db)
):
    if not token:
        await websocket.close(code=4001, reason="Token missing")
        return
        
    user = get_user_from_token(token, db)
    if not user:
        await websocket.close(code=4002, reason="Invalid credentials")
        return
        
    # Check if user has permission
    try:
        permission = check_permission(db, document_id, user.id, ["Owner", "Editor", "Viewer"])
    except Exception as e:
        logger.error(f"WebSocket auth denied for user {user.username} on doc {document_id}: {e}")
        await websocket.close(code=4003, reason="Permission denied")
        return
        
    # Connect and register in the manager
    await manager.connect(websocket, document_id, user)
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            event = message.get("event")
            
            # Read-only guard for Viewers
            if event == "document_update" and permission == "Viewer":
                await websocket.send_text(json.dumps({
                    "event": "error",
                    "message": "Viewers cannot edit this document"
                }))
                continue
                
            if event == "document_update":
                content = message.get("content")
                title = message.get("title")
                
                doc = db.query(Document).filter(Document.id == document_id).first()
                if doc:
                    is_modified = False
                    if title is not None and title != doc.title:
                        doc.title = title
                        is_modified = True
                    if content is not None and content != doc.content:
                        doc.content = content
                        is_modified = True
                        
                    if is_modified:
                        db.commit()
                        
                        # Debounced history logging to prevent DB bloat
                        last_version = db.query(DocumentHistory).filter(
                            DocumentHistory.document_id == document_id
                        ).order_by(DocumentHistory.version.desc()).first()
                        
                        now = datetime.datetime.utcnow()
                        should_create_history = False
                        
                        if not last_version:
                            should_create_history = True
                        elif last_version.content != doc.content:
                            time_diff = now - last_version.created_at
                            # Save snapshot if last edit was > 30 seconds ago
                            if time_diff.total_seconds() > 30:
                                should_create_history = True
                                
                        if should_create_history:
                            next_ver = (last_version.version + 1) if last_version else 1
                            history = DocumentHistory(
                                document_id=doc.id,
                                content=doc.content,
                                version=next_ver,
                                updated_by_id=user.id,
                                created_at=now
                            )
                            db.add(history)
                            
                            log = ActivityLog(
                                document_id=doc.id,
                                user_id=user.id,
                                action="update",
                                details=f"Auto-saved content to version {next_ver} (WebSocket)"
                            )
                            db.add(log)
                            db.commit()
                        else:
                            db.commit()
                
                # Broadcast changes to all other sockets in the room
                await manager.broadcast(
                    document_id,
                    {
                        "event": "document_update",
                        "user_id": user.id,
                        "username": user.username,
                        "content": content,
                        "title": title
                    },
                    exclude=websocket
                )
                
            elif event == "user_typing":
                is_typing = message.get("is_typing", False)
                await manager.update_typing(websocket, document_id, is_typing)
                
            elif event == "cursor_move":
                cursor = message.get("cursor") # e.g. { index: 10, length: 0 }
                await manager.update_cursor(websocket, document_id, cursor)
                
    except WebSocketDisconnect:
        await manager.disconnect(websocket, document_id)
    except Exception as e:
        logger.error(f"WebSocket session error: {e}")
        await manager.disconnect(websocket, document_id)
