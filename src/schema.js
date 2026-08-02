import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import DOCS from "./docs.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_CACHE_PATH = join(__dirname, "..", "schema.json");
const HERDR_BIN = "herdr";

export function loadSchema() {
  return JSON.parse(readFileSync(DEFAULT_CACHE_PATH, "utf8"));
}

// Export the current API schema from the running herdr server and cache it
// next to the MCP. Falls back to a previously cached copy if the export fails.
export function fetchSchema() {
  try {
    execFileSync(HERDR_BIN, ["api", "schema", "--output", DEFAULT_CACHE_PATH], {
      stdio: ["ignore", "ignore", "pipe"],
    });
    return {
      schema: JSON.parse(readFileSync(DEFAULT_CACHE_PATH, "utf8")),
      source: `${DEFAULT_CACHE_PATH} (exported by ${HERDR_BIN})`,
    };
  } catch (err) {
    try {
      return {
        schema: JSON.parse(readFileSync(DEFAULT_CACHE_PATH, "utf8")),
        source: `${DEFAULT_CACHE_PATH} (cached fallback)`,
      };
    } catch {
      throw new Error(
        `herdr-mcp: failed to export API schema (${err.message}) and no cached copy at ${DEFAULT_CACHE_PATH}`
      );
    }
  }
}

const PRIMITIVE_TYPES = new Set(["string", "number", "integer", "boolean", "object", "array", "null"]);

// Resolve a JSON Schema node against a $defs map, inlining $refs. Recursive
// references are replaced with a permissive schema (with a note) so the
// emitted tool input schema stays finite.
export function resolveSchema(node, defs, seen = new Set(), depth = 0) {
  if (node === null || node === undefined) return {};
  if (typeof node === "boolean") return node;

  if (typeof node.$ref === "string") {
    const ref = node.$ref;
    if (!ref.startsWith("#/schemas/request/$defs/")) {
      // Unknown scope: fall back to anything.
      return {};
    }
    const name = ref.split("/").pop();
    const def = defs[name];
    if (!def) return {};
    if (seen.has(name)) {
      return {
        description: `recursive reference to ${name}`,
      };
    }
    const next = new Set(seen);
    next.add(name);
    return resolveSchema(def, defs, next, depth + 1);
  }

  const out = {};

  if (node.description) out.description = node.description;

  if (Array.isArray(node.type)) {
    const sub = node.type.filter((t) => PRIMITIVE_TYPES.has(t));
    if (sub.length === 1) {
      out.type = sub[0];
    } else if (sub.length > 1) {
      out.type = sub;
    }
  } else if (node.type) {
    out.type = node.type;
  }

  if (node.enum) out.enum = node.enum;
  if (node.const !== undefined) out.const = node.const;
  if (node.minimum !== undefined) out.minimum = node.minimum;
  if (node.maximum !== undefined) out.maximum = node.maximum;
  if (node.pattern) out.pattern = node.pattern;
  if (node.maxProperties !== undefined) out.maxProperties = node.maxProperties;

  if (node.properties) {
    out.type = out.type || "object";
    out.properties = {};
    for (const [key, val] of Object.entries(node.properties)) {
      out.properties[key] = resolveSchema(val, defs, seen, depth + 1);
    }
  }
  if (node.required) out.required = [...node.required];
  if (node.additionalProperties !== undefined) {
    out.additionalProperties =
      node.additionalProperties === true || typeof node.additionalProperties === "boolean"
        ? node.additionalProperties
        : resolveSchema(node.additionalProperties, defs, seen, depth + 1);
  }

  if (node.items !== undefined) {
    out.items = Array.isArray(node.items)
      ? node.items.map((it) => resolveSchema(it, defs, seen, depth + 1))
      : resolveSchema(node.items, defs, seen, depth + 1);
  }

  for (const key of ["oneOf", "anyOf", "allOf"]) {
    if (Array.isArray(node[key])) {
      out[key] = node[key].map((it) => resolveSchema(it, defs, seen, depth + 1));
    }
  }

  return out;
}

export function buildTools(schema) {
  const request = schema.schemas.request;
  const defs = request.$defs || {};
  const variants = request.oneOf || [];

  const tools = [];
  for (const variant of variants) {
    const method = variant.properties?.method?.const;
    if (!method) continue;

    const paramsRef = variant.properties?.params?.$ref;
    let inputSchema = { type: "object", properties: {} };
    if (paramsRef) {
      const name = paramsRef.split("/").pop();
      const def = defs[name];
      if (def) {
        inputSchema = resolveSchema(def, defs);
      }
      if (!inputSchema.type && !inputSchema.oneOf && !inputSchema.anyOf) {
        inputSchema.type = "object";
        inputSchema.properties = inputSchema.properties || {};
      }
    }

    const required = Array.isArray(inputSchema.required) ? inputSchema.required : [];
    const doc = DOCS[method];
    let description = doc?.description ?? `Herdr API method \`${method}\`.`;
    if (required.length) description += ` Required args: ${required.join(", ")}.`;
    if (doc?.warning) description = `WARNING: ${doc.warning} ${description}`;

    if (doc?.fields && inputSchema.properties) {
      for (const [field, fieldDoc] of Object.entries(doc.fields)) {
        const prop = inputSchema.properties[field];
        if (prop && typeof prop === "object" && !Array.isArray(prop) && !prop.description) {
          prop.description = typeof fieldDoc === "string" ? fieldDoc : fieldDoc.description;
        }
      }
    }

    tools.push({
      method,
      toolName: "herdr_" + method.replace(/\./g, "_"),
      description,
      inputSchema,
    });
  }
  return tools;
}
