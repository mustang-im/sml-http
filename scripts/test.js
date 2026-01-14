/**
 * Manual end-to-end test for sml-http
 *
 * Usage:
 * 1) Start the server (docker compose up -d --build)
 * 2) Run: node test.js
 * 3) When prompted, paste the confirmation URL (or just the code) from the server logs.
 */

const BASE = "http://localhost:3000";

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, text };
}

async function get(path, headers = {}) {
  const res = await fetch(`${BASE}${path}`, { headers });
  const text = await res.text();
  return { status: res.status, text };
}

async function put(path, token, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, text };
}

function extractCodeFromUrl(input) {
  if (!input) return null;
  const trimmed = input.trim();

  if (trimmed.includes("code=")) {
    try {
      const u = new URL(trimmed);
      return u.searchParams.get("code");
    } catch {
      return trimmed.split("code=")[1] ?? null;
    }
  }

  return trimmed;
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function readLine() {
  return new Promise((resolve) => {
    process.stdin.resume();
    process.stdin.setEncoding("utf8");
    process.stdin.once("data", (data) => resolve(String(data).trim()));
  });
}

async function prompt(label, defaultValue) {
  const suffix = defaultValue ? ` (default: ${defaultValue})` : "";
  process.stdout.write(`${label}${suffix}: `);
  const input = await readLine();
  return input.trim() === "" ? defaultValue : input.trim();
}

async function main() {
  console.log("STEP 0: Health");
  console.log(await get("/health"));

  const emailA = await prompt("Enter email for User A", "userA@example.com");
  const emailB = await prompt("Enter email for User B", "userB@example.com");

  console.log("\nSTEP 1: Register User A");
  console.log(await post("/register", { name: "User A", emailAddress: emailA }));

  console.log("\nPaste the confirmation URL (or code) for User A from logs, then press Enter:");
  const confirmUrlA = await readLine();
  const codeA = extractCodeFromUrl(confirmUrlA);
  if (!codeA) throw new Error("Could not extract confirmation code for User A");

  console.log("\nSTEP 2: Confirm User A (get access token)");
  const confirmA = await get(`/register/confirm?code=${encodeURIComponent(codeA)}`);
  console.log(confirmA);

  const tokenA = safeJson(confirmA.text)?.access_token;
  if (!tokenA) throw new Error("No access_token returned for User A");

  console.log("\nSTEP 3: User A PUT /r/permtest/a (expected: 201)");
  console.log(await put("/r/permtest/a", tokenA, { hello: "from A" }));

  console.log("\nSTEP 4: Register User B");
  console.log(await post("/register", { name: "User B", emailAddress: emailB }));

  console.log("\nPaste the confirmation URL (or code) for User B from logs, then press Enter:");
  const confirmUrlB = await readLine();
  const codeB = extractCodeFromUrl(confirmUrlB);
  if (!codeB) throw new Error("Could not extract confirmation code for User B");

  console.log("\nSTEP 5: Confirm User B (get access token)");
  const confirmB = await get(`/register/confirm?code=${encodeURIComponent(codeB)}`);
  console.log(confirmB);

  const tokenB = safeJson(confirmB.text)?.access_token;
  if (!tokenB) throw new Error("No access_token returned for User B");

  console.log("\nSTEP 6: Permission check - User B tries to WRITE under existing ERT (expected: 403)");
  console.log(await put("/r/permtest/b", tokenB, { fail: true }));

  console.log("\nSTEP 7: Permission check - User A reads own resource (expected: 200)");
  console.log(await get("/r/permtest/a", { Authorization: `Bearer ${tokenA}` }));

  console.log("\nSTEP 8: Permission check - User B reads due to public-read visibility (expected: 200)");
  console.log(await get("/r/permtest/a", { Authorization: `Bearer ${tokenB}` }));

  console.log("\nDONE. If the status codes match the expectations, the test passed.");
}

main().catch((e) => {
  console.error("\nTEST FAILED");
  console.error(e);
  process.exit(1);
});
