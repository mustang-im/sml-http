import { Router } from "express";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

router.get("/me", requireAuth, (req: AuthenticatedRequest, res) => {
  return res.json({
    emailAddress: req.user!.emailAddress,
  });
});

export default router;
