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
                symbol_name = code_bytes[name_node.start_byte:name_node.end_byte].decode("utf-8", errors="ignore")
                is_class = node.type == "class_declaration"
                # Check if PascalCase for React component heuristic
                is_component = not is_class and symbol_name[0].isupper() and symbol_name[0].isalpha()
                kind: SymbolKind = "class" if is_class else ("component" if is_component else ("method" if parent_scope else "function"))

                scope_path = ".".join(parent_scope + [symbol_name]) if parent_scope else symbol_name
                qualified_name = f"{file_path}::{scope_path}"

                sig_text = code_bytes[node.start_byte:name_node.end_byte].decode("utf-8", errors="ignore")
                params_node = node.child_by_field_name("parameters")
                if params_node:
                    sig_text += code_bytes[params_node.start_byte:params_node.end_byte].decode("utf-8", errors="ignore")

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
                        symbol_name = code_bytes[name_node.start_byte:name_node.end_byte].decode("utf-8", errors="ignore")
                        is_component = symbol_name[0].isupper() and symbol_name[0].isalpha()
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

        # 3. Function/method calls: foo(), app.get('/route', ...)
        elif node.type == "call_expression":
            func_node = node.child_by_field_name("function")
            if func_node:
                callee_name = code_bytes[func_node.start_byte:func_node.end_byte].decode("utf-8", errors="ignore")
                caller_symbol = f"{file_path}::{'.'.join(parent_scope)}" if parent_scope else f"{file_path}::<module>"

                # Check if call is require('module')
                if callee_name == "require":
                    args_node = node.child_by_field_name("arguments")
                    if args_node and args_node.child_count > 1:
                        mod_arg = args_node.child(1)
                        if mod_arg:
                            mod_path = code_bytes[mod_arg.start_byte:mod_arg.end_byte].decode("utf-8", errors="ignore").strip("\"'")
                            result.imports.append(
                                ImportEdge(
                                    importer_file=file_path,
                                    imported_symbol=mod_path,
                                    module_path=mod_path,
                                    line=node.start_point[0] + 1,
                                )
                            )
                else:
                    call_edge = CallEdge(
                        caller_symbol=caller_symbol,
                        callee_name=callee_name,
                        file_path=file_path,
                        line=node.start_point[0] + 1,
                    )
                    result.calls.append(call_edge)

        # 4. ES6 Import statements: import React from 'react'
        elif node.type == "import_statement":
            source_node = node.child_by_field_name("source")
            mod_path = ""
            if source_node:
                mod_path = code_bytes[source_node.start_byte:source_node.end_byte].decode("utf-8", errors="ignore").strip("\"'")

            for child in node.children:
                if child.type in ("import_clause", "named_imports", "identifier"):
                    sym_name = code_bytes[child.start_byte:child.end_byte].decode("utf-8", errors="ignore")
                    result.imports.append(
                        ImportEdge(
                            importer_file=file_path,
                            imported_symbol=sym_name,
                            module_path=mod_path,
                            line=node.start_point[0] + 1,
                        )
                    )

        # Walk remaining children
        for child in node.children:
            self._traverse_node(child, code_bytes, file_path, result, parent_scope)
