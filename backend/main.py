import os
from datetime import datetime, timezone
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client

# 1. Load SUPABASE_URL and SUPABASE_SECRET_KEY from your root .env file
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SECRET_KEY = os.getenv("SUPABASE_SECRET_KEY")

if not SUPABASE_URL or not SUPABASE_SECRET_KEY:
    raise RuntimeError("Missing SUPABASE_URL or SUPABASE_SECRET_KEY in .env file")

# 2. Initialize Supabase and FastAPI
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)
app = FastAPI(title="Record Keeper API")

# Allow your Next.js frontend (localhost:3000) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Request model matching your Supabase "records" table
class RecordCreate(BaseModel):
    username: str
    demo_value: str | None = ""

# 4. API Routes connected to your Supabase "records" table
@app.get("/")
def root():
    return {"status": "FastAPI connected to Supabase!"}

@app.get("/records")
def get_all_records():
    response = (
        supabase.table("records")
        .select("*")
        .order("updated_at", desc=True)
        .execute()
    )
    return response.data

@app.get("/records/{username}")
def get_record(username: str):
    response = (
        supabase.table("records")
        .select("*")
        .eq("username", username)
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=404, detail="Record not found")
    return response.data[0]

@app.post("/records")
def create_or_update_record(item: RecordCreate):
    data = {
        "username": item.username.strip(),
        "demo_value": item.demo_value.strip() if item.demo_value else "",
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    response = supabase.table("records").upsert(data).execute()
    return response.data[0]

@app.delete("/records/{username}")
def delete_record(username: str):
    response = (
        supabase.table("records")
        .delete()
        .eq("username", username)
        .execute()
    )
    return {"deleted": username, "data": response.data}

@app.get("/instruments")
def get_instruments():
    return supabase.table("instruments").select("*").execute().data
