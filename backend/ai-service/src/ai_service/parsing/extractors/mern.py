from tree_sitter import Tree, Node
from ai_service.parsing.extractors.base import BaseExtractor
from ai_service.parsing.models import (
    ParseResult,
    SymbolNode,
    CallEdge,
    ImportEdge,
    SymbolKind,
    LanguageType,
)


class MernExtractor(BaseExtractor):
    """AST symbol, call, and import extractor for JS/TS/JSX/TSX (MERN stack) code."""

    def __init__(self, language: LanguageType = "typescript"):
        super().__init__(language=language)

    def extract(self, tree: Tree, code_bytes: bytes, file_path: str) -> ParseResult:
        result = ParseResult(file_path=file_path, language=self.language)
        if not tree.root_node:
            return result

        self._traverse_node(
            node=tree.root_node,
            code_bytes=code_bytes,
            file_path=file_path,
            result=result,
            parent_scope=[],
        )
        return result

    def _get_text(self, node: Node, code_bytes: bytes) -> str:
        return code_bytes[node.start_byte:node.end_byte].decode("utf-8", errors="ignore")

    def _traverse_node(
        self,
        node: Node,
        code_bytes: bytes,
        file_path: str,
        result: ParseResult,
        parent_scope: list[str],
    ) -> None:
        """Recursively walk tree nodes for JS/TS constructs."""

        # 1. Function declarations & Class declarations
        if node.type in ("function_declaration", "class_declaration", "method_definition"):
            name_node = node.child_by_field_name("name")
            if name_node:
                symbol_name = self._get_text(name_node, code_bytes)
                is_class = node.type == "class_declaration"
                is_component = not is_class and symbol_name[:1].isupper()
                kind: SymbolKind = "class" if is_class else ("component" if is_component else ("method" if parent_scope else "function"))

                scope_path = ".".join(parent_scope + [symbol_name]) if parent_scope else symbol_name
                qualified_name = f"{file_path}::{scope_path}"

                sig_text = self._get_text(name_node, code_bytes)
                params_node = node.child_by_field_name("parameters")
                if params_node:
                    sig_text += self._get_text(params_node, code_bytes)

                symbol = SymbolNode(
                    name=symbol_name,
                    kind=kind,
                    file_path=file_path,
                    language=self.language,
                    start_line=node.start_point[0] + 1,
                    end_line=node.end_point[0] + 1,
                    signature=sig_text.strip(),
                    qualified_name=qualified_name,
                )
                result.symbols.append(symbol)

                new_scope = parent_scope + [symbol_name]
                for child in node.children:
                    self._traverse_node(child, code_bytes, file_path, result, new_scope)
                return

        # 2. Variable declarations assigned to arrow functions: const foo = () => {}
        elif node.type in ("lexical_declaration", "variable_declaration"):
            for declarator in node.children:
                if declarator.type == "variable_declarator":
                    name_node = declarator.child_by_field_name("name")
                    value_node = declarator.child_by_field_name("value")

                    if name_node and value_node and value_node.type in ("arrow_function", "function_expression"):
                        symbol_name = self._get_text(name_node, code_bytes)
                        is_component = symbol_name[:1].isupper()
                        kind: SymbolKind = "component" if is_component else "function"

                        scope_path = ".".join(parent_scope + [symbol_name]) if parent_scope else symbol_name
                        qualified_name = f"{file_path}::{scope_path}"

                        symbol = SymbolNode(
                            name=symbol_name,
                            kind=kind,
                            file_path=file_path,
                            language=self.language,
                            start_line=declarator.start_point[0] + 1,
                            end_line=declarator.end_point[0] + 1,
                            signature=f"const {symbol_name} = ...",
                            qualified_name=qualified_name,
                        )
                        result.symbols.append(symbol)

                        new_scope = parent_scope + [symbol_name]
                        for child in value_node.children:
                            self._traverse_node(child, code_bytes, file_path, result, new_scope)

        # 3. Function/method calls
        elif node.type == "call_expression":
            func_node = node.child_by_field_name("function")
            if func_node:
                raw_callee = self._get_text(func_node, code_bytes)
                caller_symbol = f"{file_path}::{'.'.join(parent_scope)}" if parent_scope else f"{file_path}::<module>"

                # require('module') -> treat as import, not a call
                if raw_callee == "require":
                    args_node = node.child_by_field_name("arguments")
                    if args_node and args_node.child_count > 1:
                        mod_arg = args_node.child(1)
                        if mod_arg:
                            mod_path = self._get_text(mod_arg, code_bytes).strip("\"'")
                            result.imports.append(
                                ImportEdge(
                                    importer_file=file_path,
                                    imported_symbol=mod_path,
                                    module_path=mod_path,
                                    line=node.start_point[0] + 1,
                                )
                            )
                else:
                    # For member expressions like res.json(), extract just the method name
                    if func_node.type == "member_expression":
                        prop = func_node.child_by_field_name("property")
                        obj = func_node.child_by_field_name("object")
                        if prop:
                            callee_name = self._get_text(prop, code_bytes)
                        else:
                            callee_name = raw_callee
                    else:
                        callee_name = raw_callee

                    call_edge = CallEdge(
                        caller_symbol=caller_symbol,
                        callee_name=callee_name,
                        file_path=file_path,
                        line=node.start_point[0] + 1,
                    )
                    result.calls.append(call_edge)

        # 4. ES6 Import statements — properly extract individual symbols
        elif node.type == "import_statement":
            self._extract_es6_imports(node, code_bytes, file_path, result)

        # Walk remaining children
        for child in node.children:
            self._traverse_node(child, code_bytes, file_path, result, parent_scope)

    def _extract_es6_imports(self, node: Node, code_bytes: bytes, file_path: str, result: ParseResult) -> None:
        """Properly parse ES6 import statements into individual ImportEdge entries."""
        source_node = node.child_by_field_name("source")
        mod_path = ""
        if source_node:
            mod_path = self._get_text(source_node, code_bytes).strip("\"'")

        line = node.start_point[0] + 1

        for child in node.children:
            if child.type == "import_clause":
                # Walk inside the import_clause to find individual identifiers
                self._extract_import_clause_symbols(child, code_bytes, file_path, mod_path, line, result)
            elif child.type == "identifier":
                # Side-effect imports with a default: import foo from 'bar'
                sym_name = self._get_text(child, code_bytes)
                result.imports.append(ImportEdge(importer_file=file_path, imported_symbol=sym_name, module_path=mod_path, line=line))

    def _extract_import_clause_symbols(self, clause_node: Node, code_bytes: bytes, file_path: str, mod_path: str, line: int, result: ParseResult) -> None:
        """Recursively walk an import_clause to find individual symbol names."""
        for child in clause_node.children:
            if child.type == "identifier":
                sym_name = self._get_text(child, code_bytes)
                result.imports.append(ImportEdge(importer_file=file_path, imported_symbol=sym_name, module_path=mod_path, line=line))
            elif child.type == "named_imports":
                # { useState, useEffect } — walk inside to find import_specifier nodes
                for spec in child.children:
                    if spec.type == "import_specifier":
                        name_node = spec.child_by_field_name("name")
                        if name_node:
                            sym_name = self._get_text(name_node, code_bytes)
                            result.imports.append(ImportEdge(importer_file=file_path, imported_symbol=sym_name, module_path=mod_path, line=line))
                    elif spec.type == "identifier":
                        sym_name = self._get_text(spec, code_bytes)
                        result.imports.append(ImportEdge(importer_file=file_path, imported_symbol=sym_name, module_path=mod_path, line=line))
            elif child.type == "namespace_import":
                # import * as foo
                for sub in child.children:
                    if sub.type == "identifier":
                        sym_name = self._get_text(sub, code_bytes)
                        result.imports.append(ImportEdge(importer_file=file_path, imported_symbol=f"* as {sym_name}", module_path=mod_path, line=line))
