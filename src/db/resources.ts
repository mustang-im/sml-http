import { pool } from "./pool";

export async function getResource(bundle: string, filename: string) {
  const [rows] = await pool.query(
    "SELECT * FROM resources WHERE bundle = ? AND filename = ?",
    [bundle, filename]
  );
  return (rows as any[])[0] ?? null;
}

export async function upsertResource(
  bundle: string,
  filename: string,
  ownerEmail: string,
  visibility: string,
  content: unknown
) {
  await pool.query(
    `
    INSERT INTO resources (bundle, filename, owner_email, visibility, content)
    VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      content = VALUES(content),
      visibility = VALUES(visibility)
    `,
    [bundle, filename, ownerEmail, visibility, JSON.stringify(content)]
  );
}

export async function listResources(bundle: string) {
  const [rows] = await pool.query(
    "SELECT filename, content, visibility, owner_email FROM resources WHERE bundle = ?",
    [bundle]
  );
  return rows as any[];
}

export async function getOwner(bundle: string): Promise<string | null> {
  const [rows] = await pool.query(
    "SELECT owner_email FROM resources WHERE bundle = ? LIMIT 1",
    [bundle]
  );

  const result = rows as any[];
  return result[0]?.owner_email ?? null;
}
