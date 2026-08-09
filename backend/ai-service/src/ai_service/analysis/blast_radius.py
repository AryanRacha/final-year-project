from dataclasses import dataclass, field
from typing import List
from ai_service.graph.client import Neo4jClient
from ai_service.graph.reader import get_dependents


@dataclass
class AffectedSymbol:
    qualified_name: str
    file_path: str
    depth: int
    fan_in: int = 1


@dataclass
class BlastRadiusResult:
    changed_symbols: List[str]
    affected_symbols: List[AffectedSymbol] = field(default_factory=list)
    risk_score: float = 0.0

    @property
    def total_affected(self) -> int:
        return len(self.affected_symbols)


async def compute_blast_radius(
    client: Neo4jClient, repo_id: str, branch: str, changed_symbols: List[str], max_depth: int = 3
) -> BlastRadiusResult:
    """Traverse graph per repo_id to find all transitive dependents of changed_symbols and compute risk score."""
    result = BlastRadiusResult(changed_symbols=changed_symbols)
    if not changed_symbols:
        return result

    seen_symbols = {}

    for sym_qname in changed_symbols:
        # Extract simple function/symbol name for Graph traversal
        sym_name = sym_qname.split("::")[-1].split(".")[-1]
        dependents = await get_dependents(client, repo_id, branch, callee_name=sym_name, max_depth=max_depth)

        for dep in dependents:
            qname = dep.get("qualified_name")
            if not qname or qname in changed_symbols:
                continue

            depth = dep.get("depth", 1)
            file_path = dep.get("file_path", "")

            if qname not in seen_symbols:
                seen_symbols[qname] = AffectedSymbol(qualified_name=qname, file_path=file_path, depth=depth, fan_in=1)
            else:
                seen_symbols[qname].fan_in += 1
                seen_symbols[qname].depth = min(seen_symbols[qname].depth, depth)

    affected_list = list(seen_symbols.values())
    result.affected_symbols = affected_list

    # Risk score calculation: weighted sum of affected count divided by depth + fan_in boost
    score = 0.0
    for aff in affected_list:
        score += (1.0 / aff.depth) * (1.0 + 0.5 * (aff.fan_in - 1))
    result.risk_score = round(score, 2)

    return result
