import { pool } from "./pool";

export async function getResource(ert: string, zui: string) {
  const [rows] = await pool.query(
    "SELECT * FROM resources WHERE ert = ? AND zui = ?",
    [ert, zui]
  );
  return (rows as any[])[0] ?? null;
}

export async function upsertResource(
  ert: string,
  zui: string,
  ownerEmail: string,
  visibility: string,
  content: unknown
) {
  await pool.query(
    `
    INSERT INTO resources (ert, zui, owner_email, visibility, content)
    VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      visibility = VALUES(visibility),
      content = VALUES(content),
      owner_email = VALUES(owner_email)
    `,
    [ert, zui, ownerEmail, visibility, JSON.stringify(content)]
  );
}

export async function listResourcesByErt(ert: string) {
  const [rows] = await pool.query(
    "SELECT zui, content, visibility, owner_email FROM resources WHERE ert = ?",
    [ert]
  );
  return rows as any[];
}


export async function getOwnerForErt(ert: string): Promise<string | null> {
  const [rows] = await pool.query(
    "SELECT owner_email FROM resources WHERE ert = ? LIMIT 1",
    [ert]
  );

  const result = rows as any[];
  return result[0]?.owner_email ?? null;
}
