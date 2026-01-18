const readline = require("readline");

const BASE = process.env.BASE_URL || "http://localhost:3000";

function ask(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(question, (answer) => {
      rl.close();
      resolve(String(answer || "").trim());
    })
  );
}

async function req(method, path, options = {}) {
  const headers = { ...(options.headers || {}) };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(BASE + path, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const text = await res.text();
  return { status: res.status, body: text };
}

function expect(label, actual, expected) {
  if (actual !== expected) {
    console.error(`FAILED: ${label} – expected ${expected}, got ${actual}`);
    process.exit(1);
  } else {
    console.log(`OK: ${label}`);
  }
}

function randId() {
  return Math.random().toString(36).slice(2, 10);
}

(async () => {
  console.log(`BASE: ${BASE}`);
  const runId = randId();
  const bundle = `bundle-${runId}`;

  console.log("\n1) Health");
  const health = await req("GET", "/health");
  expect("health", health.status, 200);

  console.log("\n2) Register User A");
  const emailA =
    (await ask("Enter email for User A (default: lucaplessing+a@icloud.com): ")) ||
    "lucaplessing+a@icloud.com";

  const regA = await req("POST", "/register", {
    body: { name: "User A", emailAddress: emailA },
  });
  expect("register A", regA.status, 200);

  const codeAInput = await ask("Paste confirmation URL (or code) for User A: ");
  const codeA = codeAInput.includes("code=")
    ? (() => {
        try {
          return new URL(codeAInput).searchParams.get("code");
        } catch {
          return codeAInput.split("code=")[1];
        }
      })()
    : codeAInput;

  const confA = await req("GET", `/register/confirm?code=${encodeURIComponent(codeA)}`);
  expect("confirm A", confA.status, 201);
  const tokenA = JSON.parse(confA.body).access_token;

  console.log("\n3) Register User B");
  const emailB =
    (await ask("Enter email for User B (default: lucaplessing+b@icloud.com): ")) ||
    "lucaplessing+b@icloud.com";

  const regB = await req("POST", "/register", {
    body: { name: "User B", emailAddress: emailB },
  });
  expect("register B", regB.status, 200);

  const codeBInput = await ask("Paste confirmation URL (or code) for User B: ");
  const codeB = codeBInput.includes("code=")
    ? (() => {
        try {
          return new URL(codeBInput).searchParams.get("code");
        } catch {
          return codeBInput.split("code=")[1];
        }
      })()
    : codeBInput;

  const confB = await req("GET", `/register/confirm?code=${encodeURIComponent(codeB)}`);
  expect("confirm B", confB.status, 201);
  const tokenB = JSON.parse(confB.body).access_token;

  console.log("\n4) User A creates public-read resource");
  const createA = await req("PUT", `/r/${bundle}/fileA`, {
    headers: {
      "Public-Access": "read",
      Authorization: `Bearer ${tokenA}`,
    },
    body: { hello: "from A" },
  });
  expect("A create public-read", createA.status, 201);

  console.log("\n5) PUT without auth on existing bundle must be 403");
  const noAuthPut = await req("PUT", `/r/${bundle}/noAuthWrite`, {
    headers: { "Public-Access": "read" },
    body: { should: "fail" },
  });
  expect("no auth PUT existing bundle", noAuthPut.status, 403);

  console.log("\n6) User B cannot write to existing bundle (403)");
  const bWrite = await req("PUT", `/r/${bundle}/fileB`, {
    headers: {
      "Public-Access": "read",
      Authorization: `Bearer ${tokenB}`,
    },
    body: { should: "fail" },
  });
  expect("B write denied", bWrite.status, 403);

  console.log("\n7) Public-read GET without token must succeed (200)");
  const publicGet = await req("GET", `/r/${bundle}/fileA`);
  expect("public-read GET", publicGet.status, 200);

  console.log("\n8) Create private resource (public-none)");
  const privateCreate = await req("PUT", `/r/${bundle}/filePrivate`, {
    headers: {
      "Public-Access": "none",
      Authorization: `Bearer ${tokenA}`,
    },
    body: { secret: true },
  });
  expect("private create", privateCreate.status, 201);

  console.log("\n9) Private GET without token must be 403");
  const privateGetNoAuth = await req("GET", `/r/${bundle}/filePrivate`);
  expect("private GET no auth", privateGetNoAuth.status, 403);

  console.log("\n10) Private GET as owner must be 200");
  const privateGetOwner = await req("GET", `/r/${bundle}/filePrivate`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  expect("private GET owner", privateGetOwner.status, 200);

  console.log("\n11) Public-write allows anonymous overwrite (201)");
  const pubWCreate = await req("PUT", `/r/${bundle}/filePublicWrite`, {
    headers: {
      "Public-Access": "write",
      Authorization: `Bearer ${tokenA}`,
    },
    body: { v: 1 },
  });
  expect("public-write create", pubWCreate.status, 201);

  const anonOverwrite = await req("PUT", `/r/${bundle}/filePublicWrite`, {
    headers: { "Public-Access": "write" },
    body: { v: 2 },
  });
  expect("public-write anon PUT", anonOverwrite.status, 201);

  console.log("\n12) New bundle creation without token must be 401");
  const noAuthNewBundle = await req("PUT", `/r/newbundle-${runId}/fileA`, {
    headers: { "Public-Access": "write" },
    body: { x: 1 },
  });
  expect("create new bundle no auth", noAuthNewBundle.status, 401);

  console.log("\nALL TESTS PASSED ✅");
})();
