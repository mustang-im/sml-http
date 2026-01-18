import { Router, type Response, type Request } from "express";
import { optionalAuth, AuthenticatedRequest } from "../middleware/auth";
import { getResource, upsertResource, listResources, getOwner } from "../db/resources";
import { canRead, canWrite, Visibility } from "../resources/permissions";

const router = Router();

function toSingleString(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return null;
}

router.put("/r/:bundle/:filename", optionalAuth, async (req: Request, res: Response) => {
  const bundle = toSingleString(req.params.bundle);
  const filename = toSingleString(req.params.filename);
  if (!bundle || !filename) {
    return res.status(400).json({ error: "Invalid path parameters" });
  }
  const requesterEmail: string | null = (req as AuthenticatedRequest).user?.emailAddress ?? null;
  const accessHeader = req.header("Public-Access");
  let newVisibility: Visibility | undefined =
    accessHeader === "write"
    ? Visibility.Write
    : accessHeader === "read"
    ? Visibility.Read
    : accessHeader === "none"
    ? Visibility.None
    : undefined;

  const existingOwner = await getOwner(bundle);
  if (existingOwner) {
    let currentVisibility = Visibility.None;
    const resource = await getResource(bundle, filename);
    if (resource) {
      currentVisibility = resource.visibility as Visibility;
      newVisibility ??= currentVisibility;
    }
    if (!canWrite(currentVisibility, existingOwner, requesterEmail)) {
      return res.status(403).json({ error: "Write access denied" });
    }
  } else {
    if (!requesterEmail) {
      return res.status(401).json({ error: "Authentication required to create bundle" });
    }
  }
  const ownerEmail = existingOwner ?? requesterEmail!;

  await upsertResource(bundle, filename, ownerEmail, newVisibility, req.body);

  return res.status(201).json({ status: "created" });
});

router.get("/r/:bundle/:filename", optionalAuth, async (req: Request, res: Response) => {
  const bundle = toSingleString(req.params.bundle);
  const filename = toSingleString(req.params.filename);
  if (!bundle || !filename) {
    return res.status(400).json({ error: "Invalid path parameters" });
  }
  const resource = await getResource(bundle, filename);
  if (!resource) {
    return res.status(404).json({ error: "Resource not found" });
  }
  const requesterEmail: string | null = (req as AuthenticatedRequest).user?.emailAddress ?? null;

  if (!canRead(resource.visibility, resource.owner_email, requesterEmail)) {
    return res.status(403).json({ error: "Read access denied" });
  }

  return res.status(200).json(resource.content);
});

router.get("/r/:bundle", optionalAuth, async (req: Request, res: Response) => {
  const bundle = toSingleString(req.params.bundle);
  if (!bundle) {
    return res.status(400).json({ error: "Invalid path parameters" });
  }
  const requesterEmail: string | null = (req as AuthenticatedRequest).user?.emailAddress ?? null;

  const resources = await listResources(bundle);

  const readable = resources.filter((r) =>
    canRead(r.visibility, r.owner_email, requesterEmail)
  );
  if (!readable.length) {
    return res.status(403).json({ error: "No readable resources" });
  }

  const list = readable.map((r) => ({
    [r.filename]: r.content,
  }));
  return res.status(200).json(list);
});

export default router;
