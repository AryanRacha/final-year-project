import asyncio
import json
import dataclasses
from pathlib import Path
import click

from ai_service.graph.client import Neo4jClient
from ai_service.jobs.init_job import run_init_job
from ai_service.jobs.pr_eval_job import run_pr_eval_job


@click.group()
def main():
    """AI Service CLI for Repository Analysis & PR Evaluation."""
    pass


@main.command()
@click.option("--repo-id", required=True, help="Unique identifier for the target repository.")
@click.option("--branch", default="main", help="Target branch name.")
@click.option("--repo-dir", required=True, type=click.Path(exists=True), help="Path to cloned repository.")
def init(repo_id: str, branch: str, repo_dir: str):
    """Run repository initialization indexing job."""
    async def _run():
        client = Neo4jClient()
        await client.connect()
        try:
            res = await run_init_job(repo_id=repo_id, branch=branch, repo_dir=Path(repo_dir), client=client)
            click.echo(json.dumps(dataclasses.asdict(res), indent=2))
        finally:
            await client.close()

    asyncio.run(_run())


@main.command()
@click.option("--repo-id", required=True, help="Unique identifier for the target repository.")
@click.option("--branch", default="main", help="Target branch name.")
@click.option("--repo-dir", required=True, type=click.Path(exists=True), help="Path to repository.")
@click.option("--base-ref", required=True, help="Base commit hash or branch.")
@click.option("--head-ref", required=True, help="Head commit hash or branch.")
def eval_pr(repo_id: str, branch: str, repo_dir: str, base_ref: str, head_ref: str):
    """Run PR evaluation job."""
    async def _run():
        client = Neo4jClient()
        await client.connect()
        try:
            res = await run_pr_eval_job(
                repo_id=repo_id,
                branch=branch,
                repo_dir=Path(repo_dir),
                base_ref=base_ref,
                head_ref=head_ref,
                client=client,
            )
            click.echo(json.dumps(dataclasses.asdict(res), indent=2))
        finally:
            await client.close()

    asyncio.run(_run())


if __name__ == "__main__":
    main()
