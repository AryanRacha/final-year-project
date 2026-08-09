from pathlib import Path
from ai_service.parsing.parser import CodeParser

FIXTURE_DIR = Path(__file__).parent.parent / "fixtures" / "mern_sample"


def test_mern_js_parsing():
    parser = CodeParser()
    service_file = FIXTURE_DIR / "UserService.js"
    result = parser.parse_file(service_file)

    assert result is not None
    assert result.language == "javascript"

    symbol_names = {s.name for s in result.symbols}
    assert "fetchUserData" in symbol_names
    assert "handleGetProfile" in symbol_names

    # Check import (require)
    import_mods = [imp.module_path for imp in result.imports]
    assert "express" in import_mods

    # Check function call inside handleGetProfile
    callees = [c.callee_name for c in result.calls]
    assert "fetchUserData" in callees


def test_mern_jsx_component_parsing():
    parser = CodeParser()
    header_file = FIXTURE_DIR / "Header.jsx"
    result = parser.parse_file(header_file)

    assert result is not None
    assert result.language == "jsx"

    symbols = {s.name: s.kind for s in result.symbols}
    assert "Header" in symbols
    assert symbols["Header"] == "component"
