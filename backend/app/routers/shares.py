from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.database.db import get_db
from app.models.models import User, Document, DocumentShare, ActivityLog
from app.schemas.schemas import DocumentShareCreate, DocumentShareResponse
from app.services.auth_service import get_current_user
from app.routers.documents import check_permission

router = APIRouter(prefix="/api/documents", tags=["sharing"])

@router.post("/{id}/share", response_model=DocumentShareResponse)
def share_document(
    id: int,
    share_data: DocumentShareCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Only Owner can share the document
    check_permission(db, id, current_user.id, ["Owner"])
    doc = db.query(Document).filter(Document.id == id).first()
    
    # Check if target user exists
    target_user = db.query(User).filter(User.username == share_data.username).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User '{share_data.username}' not found"
        )
        
    # Cannot share with self (owner)
    if target_user.id == doc.owner_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot share a document with yourself (the owner)"
        )
        
    # Check if already shared
    existing_share = db.query(DocumentShare).filter(
        DocumentShare.document_id == id,
        DocumentShare.user_id == target_user.id
    ).first()
    
    if existing_share:
        # Update permission
        existing_share.permission = share_data.permission
        db.commit()
        db.refresh(existing_share)
        
        # Log activity
        log = ActivityLog(
            document_id=id,
            user_id=current_user.id,
            action="share",
            details=f"Updated share permission for '{target_user.username}' to '{share_data.permission}'"
        )
        db.add(log)
        db.commit()
        return existing_share
        
    # Create new share
    new_share = DocumentShare(
        document_id=id,
        user_id=target_user.id,
        permission=share_data.permission
    )
    db.add(new_share)
    db.commit()
    db.refresh(new_share)
    
    # Log activity
    log = ActivityLog(
        document_id=id,
        user_id=current_user.id,
        action="share",
        details=f"Shared document with '{target_user.username}' as '{share_data.permission}'"
    )
    db.add(log)
    db.commit()
    
    return new_share

@router.get("/{id}/users", response_model=List[Dict[str, Any]])
def get_document_users(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    check_permission(db, id, current_user.id, ["Owner", "Editor", "Viewer"])
    doc = db.query(Document).filter(Document.id == id).first()
    
    users_list = []
    
    # 1. Add owner
    users_list.append({
        "user_id": doc.owner.id,
        "username": doc.owner.username,
        "email": doc.owner.email,
        "permission": "Owner"
    })
    
    # 2. Add shared users
    shares = db.query(DocumentShare).filter(DocumentShare.document_id == id).all()
    for share in shares:
        users_list.append({
            "user_id": share.user.id,
            "username": share.user.username,
            "email": share.user.email,
            "permission": share.permission
        })
        
    return users_list
