from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel

router = APIRouter()

class InitJobRequest(BaseModel):
    repoId: str
    cloneUrl: str
    token: str

class PrEvalJobRequest(BaseModel):
    repoId: str
    prId: str
    diff: str
    token: str

@router.post("/init")
async def init_job(req: InitJobRequest, background_tasks: BackgroundTasks):
    # Enqueue background task to fetch from GitHub and build KB
    return {"status": "accepted", "job_type": "init", "repoId": req.repoId}

@router.post("/pr_eval")
async def pr_eval_job(req: PrEvalJobRequest, background_tasks: BackgroundTasks):
    # Enqueue background task to evaluate PR diff and return suggestion
    return {"status": "accepted", "job_type": "pr_eval", "repoId": req.repoId, "prId": req.prId}

@router.post("/dismissal")
async def dismissal_job(req: dict, background_tasks: BackgroundTasks):
    return {"status": "accepted"}
