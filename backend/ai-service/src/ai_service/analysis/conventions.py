from dataclasses import dataclass
from typing import List, Literal
from ai_service.parsing.models import SymbolNode

Severity = Literal["warning", "error"]


@dataclass
class ConventionViolation:
    rule_id: str
    symbol_name: str
    file_path: str
    line: int
    message: str
    severity: Severity


def check_conventions(
    symbols: List[SymbolNode], max_function_length: int = 50, max_parameters: int = 5
) -> List[ConventionViolation]:
    """Evaluate static convention rules on extracted symbols."""
    violations: List[ConventionViolation] = []

    for sym in symbols:
        # Rule 1: Function length check
        length = sym.end_line - sym.start_line + 1
        if sym.kind in ("function", "method") and length > max_function_length:
            violations.append(
                ConventionViolation(
                    rule_id="RULE-001",
                    symbol_name=sym.name,
                    file_path=sym.file_path,
                    line=sym.start_line,
                    message=f"Function '{sym.name}' exceeds recommended length ({length} lines > {max_function_length}).",
                    severity="warning",
                )
            )

        # Rule 2: Missing docstrings on public Python symbols
        if sym.language == "python" and not sym.name.startswith("_"):
            if sym.kind in ("function", "class") and not sym.docstring:
                violations.append(
                    ConventionViolation(
                        rule_id="RULE-002",
                        symbol_name=sym.name,
                        file_path=sym.file_path,
                        line=sym.start_line,
                        message=f"Public {sym.kind} '{sym.name}' is missing a docstring.",
                        severity="warning",
                    )
                )

        # Rule 3: Naming convention check for classes and components
        if sym.kind in ("class", "component"):
            if not sym.name[0].isupper():
                violations.append(
                    ConventionViolation(
                        rule_id="RULE-003",
                        symbol_name=sym.name,
                        file_path=sym.file_path,
                        line=sym.start_line,
                        message=f"{sym.kind.capitalize()} '{sym.name}' should use PascalCase.",
                        severity="error",
                    )
                )

    return violations
