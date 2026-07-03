import os
import psycopg2
from fastapi import FastAPI

app = FastAPI()

conn = psycopg2.connect(os.environ["DATABASE_URL"])


@app.get("/health")
def health():
    return {"status": "ok"}
