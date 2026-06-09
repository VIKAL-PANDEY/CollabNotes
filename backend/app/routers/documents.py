from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List, Optional
from app.database.db import get_db
from app.models.models import User, Document, DocumentShare, DocumentHistory, ActivityLog
from app.schemas.schemas import (
    DocumentCreate, DocumentUpdate, DocumentResponse, 
    DocumentListItemResponse, DocumentHistoryResponse, ActivityLogResponse
)
from app.services.auth_service import get_current_user
from app.services.pdf_service import export_document_to_pdf

router = APIRouter(prefix="/api/documents", tags=["documents"])

def check_permission(db: Session, document_id: int, user_id: int, allowed_permissions: List[str]) -> str:
    # 1. Check if owner
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    if doc.owner_id == user_id:
        return "Owner"
        
    # 2. Check if shared
    share = db.query(DocumentShare).filter(
        DocumentShare.document_id == document_id,
        DocumentShare.user_id == user_id
    ).first()
    
    if not share or share.permission not in allowed_permissions:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this document"
        )
        
    return share.permission

@router.get("", response_model=List[DocumentListItemResponse])
def get_documents(
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Fetch all documents where user is owner OR has shared access
    query = db.query(Document).outerjoin(DocumentShare).filter(
        or_(
            Document.owner_id == current_user.id,
            DocumentShare.user_id == current_user.id
        )
    )
    
    if search:
        query = query.filter(Document.title.ilike(f"%{search}%"))
        
    docs = query.distinct().all()
    
    response_data = []
    for doc in docs:
        if doc.owner_id == current_user.id:
            permission = "Owner"
        else:
            share = db.query(DocumentShare).filter(
                DocumentShare.document_id == doc.id,
                DocumentShare.user_id == current_user.id
            ).first()
            permission = share.permission if share else "Viewer"
            
        response_data.append(
            DocumentListItemResponse(
                id=doc.id,
                title=doc.title,
                owner_id=doc.owner_id,
                created_at=doc.created_at,
                updated_at=doc.updated_at,
                owner=doc.owner,
                user_permission=permission
            )
        )
        
    # Sort: newest/most recently updated first
    response_data.sort(key=lambda x: x.updated_at, reverse=True)
    return response_data

@router.post("", response_model=DocumentResponse)
def create_document(
    doc_data: DocumentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Create document
    doc = Document(
        title=doc_data.title,
        content=doc_data.content,
        owner_id=current_user.id
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    
    # Save first history version
    history = DocumentHistory(
        document_id=doc.id,
        content=doc.content,
        version=1,
        updated_by_id=current_user.id
    )
    db.add(history)
    
    # Log activity
    log = ActivityLog(
        document_id=doc.id,
        user_id=current_user.id,
        action="create",
        details=f"Created document '{doc.title}'"
    )
    db.add(log)
    db.commit()
    db.refresh(doc)
    
    return doc

@router.get("/activity", response_model=List[ActivityLogResponse])
def get_activity_logs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Fetch activity logs where user is owner or has share access
    logs = db.query(ActivityLog).join(Document, isouter=True).outerjoin(
        DocumentShare, DocumentShare.document_id == Document.id
    ).filter(
        or_(
            ActivityLog.user_id == current_user.id,
            Document.owner_id == current_user.id,
            DocumentShare.user_id == current_user.id
        )
    ).order_by(ActivityLog.created_at.desc()).limit(50).all()
    
    return logs

@router.get("/{id}", response_model=DocumentResponse)
def get_document(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    check_permission(db, id, current_user.id, ["Owner", "Editor", "Viewer"])
    doc = db.query(Document).filter(Document.id == id).first()
    return doc

@router.put("/{id}", response_model=DocumentResponse)
def update_document(
    id: int,
    doc_data: DocumentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    check_permission(db, id, current_user.id, ["Owner", "Editor"])
    doc = db.query(Document).filter(Document.id == id).first()
    
    is_modified = False
    
    if doc_data.title is not None and doc_data.title != doc.title:
        doc.title = doc_data.title
        is_modified = True
        
    if doc_data.content is not None and doc_data.content != doc.content:
        doc.content = doc_data.content
        is_modified = True
        
    if is_modified:
        db.commit()
        db.refresh(doc)
        
        # Get next version number
        last_version = db.query(DocumentHistory).filter(
            DocumentHistory.document_id == id
        ).order_by(DocumentHistory.version.desc()).first()
        
        next_ver = (last_version.version + 1) if last_version else 1
        
        # Add to history
        history = DocumentHistory(
            document_id=doc.id,
            content=doc.content,
            version=next_ver,
            updated_by_id=current_user.id
        )
        db.add(history)
        
        # Log activity
        log = ActivityLog(
            document_id=doc.id,
            user_id=current_user.id,
            action="update",
            details=f"Updated document content/title to version {next_ver}"
        )
        db.add(log)
        db.commit()
        db.refresh(doc)
        
    return doc

@router.delete("/{id}")
def delete_document(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    check_permission(db, id, current_user.id, ["Owner"])
    doc = db.query(Document).filter(Document.id == id).first()
    
    # Log activity before deleting (cascade logic will nullify/delete records)
    log = ActivityLog(
        document_id=None,
        user_id=current_user.id,
        action="delete",
        details=f"Deleted document '{doc.title}'"
    )
    db.add(log)
    
    db.delete(doc)
    db.commit()
    
    return {"message": "Document successfully deleted"}

@router.get("/{id}/history", response_model=List[DocumentHistoryResponse])
def get_document_history(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    check_permission(db, id, current_user.id, ["Owner", "Editor", "Viewer"])
    history = db.query(DocumentHistory).filter(
        DocumentHistory.document_id == id
    ).order_by(DocumentHistory.version.desc()).all()
    
    return history

@router.get("/{id}/export")
def export_document(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    check_permission(db, id, current_user.id, ["Owner", "Editor", "Viewer"])
    doc = db.query(Document).filter(Document.id == id).first()
    
    pdf_buffer = export_document_to_pdf(doc.title, doc.content)
    
    # Log activity
    log = ActivityLog(
        document_id=doc.id,
        user_id=current_user.id,
        action="export",
        details=f"Exported document '{doc.title}' to PDF"
    )
    db.add(log)
    db.commit()
    
    filename = f"{doc.title.replace(' ', '_')}.pdf"
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
