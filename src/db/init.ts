import { pool } from "./pool";

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS resources (
      id INT AUTO_INCREMENT PRIMARY KEY,
      owner_email VARCHAR(255) NOT NULL,
      bundle VARCHAR(255) NOT NULL,
      filename VARCHAR(255) NOT NULL,
      visibility ENUM('public-read', 'public-write', 'public-none') NOT NULL DEFAULT 'public-read',
      content JSON NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_resource (bundle, filename)
    )
  `);
}
