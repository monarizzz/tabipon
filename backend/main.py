import os
import psycopg2
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import health, stamp_image

conn = psycopg2.connect(os.environ["DATABASE_URL"])

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
