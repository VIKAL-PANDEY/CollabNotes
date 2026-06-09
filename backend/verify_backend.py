import sys
import os

# Ensure app is in path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

try:
    from app.database.db import engine, SessionLocal, Base
    from app.models.models import User, Document, DocumentShare, DocumentHistory, ActivityLog
    from app.schemas.schemas import UserCreate, DocumentCreate
    from app.services.auth_service import get_password_hash, verify_password
    from app.services.pdf_service import export_document_to_pdf
    from app.websocket.websocket_manager import manager
    from app.main import app
    
    print("SUCCESS: All modules imported successfully.")
    
    # Try database creation and local sessions
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    print("SUCCESS: Database session created successfully.")
    db.close()
    
    # Try PDF export basic testing
    pdf_buffer = export_document_to_pdf("Test Title", "Test Content lines\nMore lines.")
    assert pdf_buffer.getvalue().startswith(b'%PDF'), "PDF header verification failed"
    print("SUCCESS: PDF service output format validated.")
    
    print("ALL TESTS PASSED SUCCESSFULLY!")
    sys.exit(0)
    
except Exception as e:
    import traceback
    print("FAILURE: Verification failed with exception:")
    traceback.print_exc()
    sys.exit(1)
