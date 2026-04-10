import { getRequestContext } from '@cloudflare/next-on-pages';

/**
 * Convert PostgreSQL $1/$2 positional params to SQLite ? placeholders.
 * Handles out-of-order usage (e.g. WHERE id = $2 SET x = $1) by reordering
 * the params array to match the left-to-right occurrence order in the SQL.
 */
function convertPgToSqlite(sql, params) {
  if (!params || params.length === 0) {
    return { sql: sql.replace(/\$\d+/g, '?'), params: [] };
  }

  // Find all $N occurrences with their positions
  const occurrences = [];
  const regex = /\$(\d+)/g;
  let match;
  while ((match = regex.exec(sql)) !== null) {
    occurrences.push({ pos: match.index, paramIndex: parseInt(match[1], 10) - 1 });
  }

  // Sort by position in SQL (left to right)
  occurrences.sort((a, b) => a.pos - b.pos);

  // Build reordered params to match left-to-right ? order
  const reorderedParams = occurrences.map(o => params[o.paramIndex]);

  return { sql: sql.replace(/\$\d+/g, '?'), params: reorderedParams };
}

/**
 * Auto-parse any string column values that are JSON objects or arrays.
 * D1 returns json_object() and json_group_array() results as TEXT strings.
 */
function autoParseJson(rows) {
  return rows.map(row => {
    const out = {};
    for (const [key, value] of Object.entries(row)) {
      if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
        try { out[key] = JSON.parse(value); } catch { out[key] = value; }
      } else {
        out[key] = value;
      }
    }
    return out;
  });
}

export function getDB() {
  const { env } = getRequestContext();
  return env.DB;
}

export async function query(sql, params = []) {
  const db = getDB();
  const { sql: d1Sql, params: d1Params } = convertPgToSqlite(sql, params);

  const isRead = /^\s*(SELECT|WITH)/i.test(sql.trim()) || /\bRETURNING\b/i.test(sql);
  const stmt = d1Params.length > 0
    ? db.prepare(d1Sql).bind(...d1Params)
    : db.prepare(d1Sql);

  if (isRead) {
    const result = await stmt.all();
    const rows = autoParseJson(result.results || []);
    return { rows, rowCount: rows.length };
  } else {
    const result = await stmt.run();
    return { rows: [], rowCount: result.meta?.changes || 0 };
  }
}
