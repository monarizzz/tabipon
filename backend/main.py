from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import health, stamp_image, stamps
from app.core.config import load_env_file

load_env_file()

app = FastAPI(title="Oogishima Stamp API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(stamp_image.router)
app.include_router(stamps.router)
