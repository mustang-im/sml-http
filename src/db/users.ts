import { pool } from "./pool";

export async function createUserIfNotExists(
  name: string,
  emailAddress: string
) {
  await pool.query(
    `
    INSERT INTO users (name, email)
    VALUES (?, ?)
    ON DUPLICATE KEY UPDATE name = VALUES(name)
    `,
    [name, emailAddress]
  );
}
