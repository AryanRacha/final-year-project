from fastapi import FastAPI
from src.routes import jobs
import chromadb
from neo4j import GraphDatabase

app = FastAPI(title="AI Service Python Orchestrator")

app.include_router(jobs.router, prefix="/api/v1/jobs")

@app.on_event("startup")
async def startup_event():
    # Initialize ChromaDB and Neo4j connections here
    print("Starting AI Service...")

@app.get("/")
def read_root():
    return {"message": "Hello from ai-service!"}
