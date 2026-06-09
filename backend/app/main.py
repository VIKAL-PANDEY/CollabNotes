import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.db import engine, Base
from app.routers import auth, documents, shares, websocket_router

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("collabnotes.main")

# Auto-create tables (SQLite fallback setup)
logger.info("Initializing database and tables...")
Base.metadata.create_all(bind=engine)
logger.info("Database initialized successfully.")

app = FastAPI(
    title="CollabNotes API",
    description="Real-Time Collaborative Note-Taking API similar to Google Docs",
    version="1.0.0"
)

# CORS Middleware Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production development, specify actual domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(shares.router)
app.include_router(websocket_router.router)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "CollabNotes API",
        "database": str(engine.url.drivername)
    }
