import { Router } from "express";
import { signConfirmToken } from "../auth/jwt";
import { sendConfirmMail } from "../mail/mailer";

const router = Router();

router.post("/", async (req, res) => {
  const { name, emailAddress } = req.body ?? {};

  if (
    typeof name !== "string" ||
    typeof emailAddress !== "string" ||
    name.trim() === "" ||
    emailAddress.trim() === ""
  ) {
    return res.status(400).json({
      error: "Invalid request body",
    });
  }

  const token = signConfirmToken({
    name: name.trim(),
    emailAddress: emailAddress.trim(),
  });

  const baseUrl = process.env.PUBLIC_BASE_URL!;
  const confirmUrl = `${baseUrl}/register/confirm?code=${token}`;

  // 👉 HIER der eigentliche Fix: Mail verschicken
  await sendConfirmMail(emailAddress.trim(), confirmUrl);

  return res.status(200).json({
    message: "Registration initiated",
  });
});

export default router;
