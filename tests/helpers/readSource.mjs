import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const srcRoot = fileURLToPath(new URL("../../src/", import.meta.url));
const parse = (source, file) =>
  ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );
const shouldInline = (file) =>
  /\.styles\.ts$/.test(file) || /\/(hooks|fixtures|constants)\//.test(file);
async function resolveInternal(specifier, from) {
  const base = specifier.startsWith("@/")
    ? path.join(srcRoot, specifier.slice(2))
    : specifier.startsWith(".")
      ? path.resolve(path.dirname(from), specifier)
      : null;
  if (!base) return null;
  for (const file of [base, base + ".ts", base + ".tsx", base + ".json"]) {
    try {
      return { file, source: await readFile(file, "utf8") };
    } catch (error) {
      if (error.code !== "ENOENT" && error.code !== "EISDIR") throw error;
    }
  }
  throw new Error(`Unresolved test source import ${specifier} from ${from}`);
}

/** Keep the existing RN stubs while exercising the real extracted hooks and styles. */
export async function readSource(relativeFile) {
  const visited = new Set(),
    body = [],
    imports = new Map();
  async function visit(file, source = undefined) {
    if (visited.has(file)) return;
    visited.add(file);
    source ??= await readFile(file, "utf8");
    const ast = parse(source, file);
    for (const statement of ast.statements) {
      if (!ts.isImportDeclaration(statement)) {
        body.push(statement.getFullText(ast));
        continue;
      }
      const original = statement.moduleSpecifier.text;
      const resolved = await resolveInternal(original, file);
      if (resolved && shouldInline(resolved.file)) {
        await visit(resolved.file, resolved.source);
        continue;
      }
      const specifier = resolved
        ? resolved.file.endsWith(".json")
          ? "@app/config"
          : "@/" +
            path
              .relative(srcRoot, resolved.file)
              .replace(/\.tsx?$/, "")
              .replaceAll(path.sep, "/")
        : original;
      const clause = statement.importClause;
      if (!clause)
        throw new Error(
          `Side-effect import requires an explicit harness: ${original}`
        );
      let entry = imports.get(specifier);
      if (!entry)
        imports.set(
          specifier,
          (entry = {
            default: null,
            named: new Map(),
            namespace: null,
            typeOnly: true,
          })
        );
      entry.typeOnly &&= clause.isTypeOnly;
      if (clause.name) entry.default = clause.name.text;
      if (clause.namedBindings) {
        if (ts.isNamedImports(clause.namedBindings))
          for (const element of clause.namedBindings.elements) {
            const typeOnly = clause.isTypeOnly || element.isTypeOnly;
            const existing = entry.named.get(element.name.text);
            if (!existing || (existing.typeOnly && !typeOnly)) {
              entry.named.set(element.name.text, {
                text: element.getText(ast).replace(/^type\s+/, ""),
                typeOnly,
              });
            }
          }
        else entry.namespace = clause.namedBindings.name.text;
      }
    }
  }
  await visit(path.resolve(srcRoot, relativeFile));
  const header = [...imports]
    .map(([specifier, entry]) => {
      const bindings = [
        entry.default,
        entry.namespace
          ? `* as ${entry.namespace}`
          : entry.named.size
            ? `{ ${[...entry.named.values()].map((item) => (item.typeOnly && !entry.typeOnly ? "type " : "") + item.text).join(", ")} }`
            : null,
      ]
        .filter(Boolean)
        .join(", ");
      return `import ${entry.typeOnly ? "type " : ""}${bindings} from '${specifier}';`;
    })
    .join("\n");
  return header + "\n" + body.join("\n");
}
