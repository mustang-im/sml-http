import { Router } from "express";
import {
  verifyConfirmToken,
  signAccessToken,
} from "../auth/jwt";
import { createUserIfNotExists } from "../db/users";

const router = Router();

router.get("/", async (req, res) => {
  const code = req.query.code;

  if (typeof code !== "string") {
    return res.status(400).json({
      error: "Missing or invalid code",
    });
  }

  try {
    const payload = verifyConfirmToken(code);

    await createUserIfNotExists(
      payload.name,
      payload.emailAddress
    );

    const accessToken = signAccessToken({
      emailAddress: payload.emailAddress,
    });

    return res.status(201).json({
      access_token: accessToken,
      token_type: "Bearer",
      scope: "read write",
    });
  } catch (err) {
    return res.status(401).json({
      error: "Invalid or expired token",
    });
  }
});

export default router;
