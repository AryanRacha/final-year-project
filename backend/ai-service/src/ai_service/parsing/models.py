from dataclasses import dataclass, field
from typing import Literal

SymbolKind = Literal["function", "class", "component", "method", "module"]
LanguageType = Literal["python", "javascript", "typescript", "tsx"]


@dataclass
class SymbolNode:
    """Represents a code symbol (function, class, component, method, etc.)."""
    name: str
    kind: SymbolKind
    file_path: str
    language: LanguageType
    start_line: int
    end_line: int
    signature: str = ""
    docstring: str = ""
    code_body: str = ""
    qualified_name: str = ""

    def __post_init__(self):
        if not self.qualified_name:
            self.qualified_name = f"{self.file_path}::{self.name}"


@dataclass
class CallEdge:
    """Represents a invocation edge: caller -> callee."""
    caller_symbol: str  # qualified name of caller
    callee_name: str    # target function/method name being invoked
    file_path: str
    line: int


@dataclass
class ImportEdge:
    """Represents an import relationship."""
    importer_file: str
    imported_symbol: str
    module_path: str
    line: int


@dataclass
class ParseResult:
    """Combined output of parsing a single file."""
    file_path: str
    language: LanguageType
    symbols: list[SymbolNode] = field(default_factory=list)
    calls: list[CallEdge] = field(default_factory=list)
    imports: list[ImportEdge] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)
