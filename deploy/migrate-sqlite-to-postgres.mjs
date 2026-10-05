import Database from "better-sqlite3";

const sqlitePath = process.argv[2] || "data/maths_tutor.db";
const tables = [
  "User",
  "Topic",
  "Session",
  "QuestionHistory",
  "Reward",
  "WeeklyInsight",
];
const booleanColumns = new Set(["isCorrect", "unlocked", "claimed", "pendingApproval"]);

const db = new Database(sqlitePath, { readonly: true });

function sqlValue(value, column) {
  if (value === null || value === undefined) return "NULL";
  if (booleanColumns.has(column)) return value ? "TRUE" : "FALSE";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  return `'${String(value).replaceAll("'", "''")}'`;
}

process.stdout.write("BEGIN;\n");

for (const table of tables) {
  const columns = db.prepare(`PRAGMA table_info("${table}")`).all();
  const names = columns.map((column) => column.name);
  const rows = db.prepare(`SELECT * FROM "${table}"`).all();

  for (const row of rows) {
    const values = names.map((name) => sqlValue(row[name], name));
    process.stdout.write(
      `INSERT INTO "${table}" (${names.map((name) => `"${name}"`).join(", ")}) VALUES (${values.join(", ")}) ON CONFLICT DO NOTHING;\n`,
    );
  }
}

process.stdout.write("COMMIT;\n");
db.close();
