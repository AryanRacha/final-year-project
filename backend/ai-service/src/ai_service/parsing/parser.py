from pathlib import Path
from typing import Dict, Optional
import tree_sitter_python as tspython
import tree_sitter_javascript as tsjs
import tree_sitter_typescript as tsts
from tree_sitter import Language, Parser

from ai_service.parsing.models import ParseResult, LanguageType
from ai_service.parsing.extractors.base import BaseExtractor
from ai_service.parsing.extractors.python import PythonExtractor
from ai_service.parsing.extractors.mern import MernExtractor


class LanguageRegistry:
    """Manages tree-sitter language grammars and parsers."""

    _languages: Dict[str, Language] = {}
    _extractors: Dict[str, BaseExtractor] = {}

    @classmethod
    def get_language_and_extractor(cls, extension: str) -> Optional[tuple[Language, BaseExtractor, LanguageType]]:
        ext = extension.lower()
        if ext in (".py",):
            if "python" not in cls._languages:
                cls._languages["python"] = Language(tspython.language())
                cls._extractors["python"] = PythonExtractor()
            return cls._languages["python"], cls._extractors["python"], "python"

        elif ext in (".js",):
            if "javascript" not in cls._languages:
                cls._languages["javascript"] = Language(tsjs.language())
                cls._extractors["javascript"] = MernExtractor(language="javascript")
            return cls._languages["javascript"], cls._extractors["javascript"], "javascript"

        elif ext in (".jsx",):
            if "jsx" not in cls._languages:
                cls._languages["jsx"] = Language(tsjs.language())
                cls._extractors["jsx"] = MernExtractor(language="jsx")
            return cls._languages["jsx"], cls._extractors["jsx"], "jsx"

        elif ext in (".ts",):
            if "typescript" not in cls._languages:
                cls._languages["typescript"] = Language(tsts.language_typescript())
                cls._extractors["typescript"] = MernExtractor(language="typescript")
            return cls._languages["typescript"], cls._extractors["typescript"], "typescript"

        elif ext in (".tsx",):
            if "tsx" not in cls._languages:
                cls._languages["tsx"] = Language(tsts.language_tsx())
                cls._extractors["tsx"] = MernExtractor(language="tsx")
            return cls._languages["tsx"], cls._extractors["tsx"], "tsx"

        return None


class CodeParser:
    """High-level code parser interface for parsing files and directories."""

    def __init__(self):
        self._parsers: Dict[str, Parser] = {}

    def _get_parser(self, lang_name: str, language: Language) -> Parser:
        if lang_name not in self._parsers:
            self._parsers[lang_name] = Parser(language)
        return self._parsers[lang_name]

    def parse_file(self, file_path: str | Path) -> Optional[ParseResult]:
        path = Path(file_path)
        if not path.is_file():
            return None

        lang_tuple = LanguageRegistry.get_language_and_extractor(path.suffix)
        if not lang_tuple:
            return None  # Unsupported file extension

        language, extractor, lang_type = lang_tuple
        parser = self._get_parser(lang_type, language)

        try:
            code_bytes = path.read_bytes()
            tree = parser.parse(code_bytes)
            return extractor.extract(tree, code_bytes, str(path).replace("\\", "/"))
        except Exception as e:
            return ParseResult(
                file_path=str(path).replace("\\", "/"),
                language=lang_type,
                errors=[f"Failed to parse file: {str(e)}"],
            )

    def parse_directory(self, dir_path: str | Path, ignore_dirs: Optional[set[str]] = None) -> list[ParseResult]:
        root = Path(dir_path)
        if not root.is_dir():
            return []

        ignore = ignore_dirs or {".git", "node_modules", ".venv", "__pycache__", "build", "dist"}
        results = []

        for p in root.rglob("*"):
            if p.is_file() and not any(part in ignore for part in p.parts):
                res = self.parse_file(p)
                if res and (res.symbols or res.calls or res.imports or res.errors):
                    results.append(res)

        return results
