import { Router, Response } from "express";
import { requireAuth, AuthenticatedRequestWithUser } from "../middleware/auth";
import { getResource, upsertResource, listResourcesByErt } from "../db/resources";
import { canRead } from "../resources/permissions";
import { getOwnerForErt } from "../db/resources";

const router = Router();

function toSingleString(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return null;
}

/**
 * PUT /r/:ert/:zui
 */
router.put("/r/:ert/:zui", requireAuth, async (req, res: Response) => {
  const authReq = req as AuthenticatedRequestWithUser;

  const rawParams = authReq.params as any;

  const ert = toSingleString(rawParams.ert);
  const zui = toSingleString(rawParams.zui);

  if (!ert || !zui) {
    return res.status(400).json({ error: "Invalid path parameters" });
  }

  const user = authReq.user;

  const visibility =
    authReq.header("Public-Access") == "write"
      ? "public-write"
      : authReq.header("Public-Access") == "read"
      ? "public-read"
      : "public-none";

 const existingOwner = await getOwnerForErt(ert);

if (existingOwner && existingOwner !== user.emailAddress) {
  return res.status(403).json({
    error: "ERT belongs to another user",
  });
}


  await upsertResource(ert, zui, user.emailAddress, visibility, authReq.body);

  return res.status(201).json({ status: "created" });
});

/**
 * GET /r/:ert/:zui
 */
router.get("/r/:ert/:zui", requireAuth, async (req, res: Response) => {
  const authReq = req as AuthenticatedRequestWithUser;

  const rawParams = authReq.params as any;

  const ert = toSingleString(rawParams.ert);
  const zui = toSingleString(rawParams.zui);

  if (!ert || !zui) {
    return res.status(400).json({ error: "Invalid path parameters" });
  }

  const user = authReq.user;

  const resource = await getResource(ert, zui);

  if (!resource) {
    return res.status(404).json({ error: "Resource not found" });
  }

  if (!canRead(resource.visibility, resource.owner_email, user.emailAddress)) {
    return res.status(403).json({ error: "Read access denied" });
  }

  return res.status(200).json(resource.content);
});

/**
 * GET /r/:ert
 */
router.get("/r/:ert", requireAuth, async (req, res: Response) => {
  const authReq = req as AuthenticatedRequestWithUser;

  const rawParams = authReq.params as any;

  const ert = toSingleString(rawParams.ert);

  if (!ert) {
    return res.status(400).json({ error: "Invalid path parameters" });
  }

  const user = authReq.user;

  const resources = await listResourcesByErt(ert);

  const readable = resources.filter((r) =>
    canRead(r.visibility, r.owner_email, user.emailAddress)
  );

  if (readable.length === 0) {
    return res.status(403).json({ error: "No readable resources" });
  }

  return res.status(200).json(
    readable.map((r) => ({
      [r.zui]: r.content,
    }))
  );
});

export default router;
