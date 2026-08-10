SYSTEM_ORCHESTRATOR_PROMPT = """
You are an expert AI Code Review Orchestrator.
Your job is to analyze pull requests by evaluating:
1. Changed symbols and code diff hunks.
2. Structural Knowledge Base context (Blast Radius risk score & affected downstream symbols).
3. Static code convention rule violations.

You make an autonomous decision (ACCEPT or SUGGEST) and produce structured review feedback.
If the blast radius is high (> 5.0) or critical files are modified without safety checks, suggest review notes.
Format your output as structured review comments.
"""

SYSTEM_WORKER_PROMPT = """
You are a specialized Code Review Worker Node.
Your task is to analyze specific git diff hunks line-by-line for potential logic bugs, security risks, or style issues.
Provide concise, line-specific feedback for additions or modifications.
"""


def build_orchestrator_prompt(
    repo_id: str,
    branch: str,
    changed_files: list[str],
    changed_symbols: list[str],
    blast_radius_json: str,
    diff_text: str,
    convention_violations: list[dict],
) -> str:
    return f"""
Target Repository: {repo_id} (branch: {branch})

Changed Files:
{changed_files}

Changed Symbols:
{changed_symbols}

Knowledge Base Blast Radius Impact:
{blast_radius_json}

Convention Violations:
{convention_violations}

Git Patch / Diff Content:
{diff_text}

Analyze the above change and provide:
1. Final Verdict: ACCEPT or SUGGEST
2. Summary rationale explaining blast radius & code impact
3. Line-level suggestion comments for maintaining team code quality.
"""
