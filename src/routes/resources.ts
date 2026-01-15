import { Router, Response } from "express";
import { requireAuth, AuthenticatedRequestWithUser } from "../middleware/auth";
import { getResource, upsertResource, listResources } from "../db/resources";
import { canRead, canWrite } from "../resources/permissions";
import { getOwner } from "../db/resources";

const router = Router();

function toSingleString(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return null;
}

/**
 * PUT /r/:bundle/:filename
 */
router.put("/r/:bundle/:filename", requireAuth, async (req, res: Response) => {
  const authReq = req as AuthenticatedRequestWithUser;

  const rawParams = authReq.params as any;

  const bundle = toSingleString(rawParams.bundle);
  const filename = toSingleString(rawParams.filename);

  if (!bundle || !filename) {
    return res.status(400).json({ error: "Invalid path parameters" });
  }

  const user = authReq.user;

  const visibility =
    authReq.header("Public-Access") == "write"
      ? "public-write"
      : authReq.header("Public-Access") == "read"
      ? "public-read"
      : "public-none";

 const existingOwner = await getOwner(bundle);
  if (!canWrite(visibility, existingOwner, user?.emailAddress)) {
    return res.status(403).json({ error: "Write access denied" });
  }

  await upsertResource(bundle, filename, user.emailAddress, visibility, authReq.body);

  return res.status(201).json({ status: "created" });
});

/**
 * GET /r/:bundle/:filename
 */
router.get("/r/:bundle/:filename", async (req, res: Response) => {
  const authReq = req as AuthenticatedRequestWithUser;

  const rawParams = authReq.params as any;

  const bundle = toSingleString(rawParams.bundle);
  const filename = toSingleString(rawParams.filename);

  if (!bundle || !filename) {
    return res.status(400).json({ error: "Invalid path parameters" });
  }

  const user = authReq.user;

  const resource = await getResource(bundle, filename);

  if (!resource) {
    return res.status(404).json({ error: "Resource not found" });
  }

  if (!canRead(resource.visibility, resource.owner_email, user?.emailAddress)) {
    return res.status(403).json({ error: "Read access denied" });
  }

  return res.status(200).json(resource.content);
});

/**
 * GET /r/:bundle
 */
router.get("/r/:bundle", async (req, res: Response) => {
  const authReq = req as AuthenticatedRequestWithUser;

  const rawParams = authReq.params as any;

  const bundle = toSingleString(rawParams.bundle);

  if (!bundle) {
    return res.status(400).json({ error: "Invalid path parameters" });
  }

  const user = authReq.user;

      const resources = await listResources(bundle);

  const readable = resources.filter((r) =>
    canRead(r.visibility, r.owner_email, user?.emailAddress)
  );

  if (readable.length === 0) {
    return res.status(403).json({ error: "No readable resources" });
  }

  return res.status(200).json(
    readable.map((r) => ({
      [r.filename]: r.content,
    }))
  );
});

export default router;
