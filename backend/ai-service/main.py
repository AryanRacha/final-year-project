from src.ai_service.web.app import app
from src.routes import jobs

# Include the control plane webhooks router
app.include_router(jobs.router, prefix="/api/v1/jobs")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
