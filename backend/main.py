import os
from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from database import init_db
from seed_data import seed
from routers.auth_routes import router as auth_router
from routers.cad_routes import router as cad_router
from routers.quote_routes import router as quote_router
from routers.order_routes import router as order_router
from routers.admin_routes import router as admin_router
from routers.user_routes import router as user_router
from routers.forge_routes import router as forge_router
from services.gcs_sync import start_persistence_sync, stop_persistence_sync

app = FastAPI(
    title="TitanForge 3D - Metal Additive Manufacturing & Quoting Platform",
    description="Enterprise CAD geometry analysis, instant quoting, machining services, and order processing for 3D metal printing.",
    version="1.0.0"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure folders exist
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(BASE_DIR)
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
SAMPLE_DIR = os.path.join(BASE_DIR, "sample_models")
FRONTEND_DIST = os.path.join(ROOT_DIR, "frontend", "dist")

os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(SAMPLE_DIR, exist_ok=True)

# Mount static folders
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")
app.mount("/sample_models", StaticFiles(directory=SAMPLE_DIR), name="sample_models")

# Register routers
app.include_router(auth_router)
app.include_router(user_router)
app.include_router(cad_router)
app.include_router(quote_router)
app.include_router(order_router)
app.include_router(admin_router)
app.include_router(forge_router)

@app.on_event("startup")
def on_startup():
    start_persistence_sync()
    init_db()
    seed()

@app.on_event("shutdown")
def on_shutdown():
    stop_persistence_sync()

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "TitanForge 3D Additive Quoting Engine",
        "supported_formats": ["SolidWorks (.sldprt)", "STEP (.step, .stp)", "STL (.stl)", "OBJ (.obj)", "3MF (.3mf)"]
    }

# Mount frontend build if available
if os.path.exists(FRONTEND_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        if full_path.startswith("api/") or full_path.startswith("uploads/") or full_path.startswith("sample_models/"):
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Endpoint not found")
        file_path = os.path.join(FRONTEND_DIST, full_path)
        if full_path and os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
