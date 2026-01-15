import { Router } from "express";
import { signConfirmToken } from "../auth/jwt";
import { sendConfirmMail } from "../mail/mailer";

const router = Router();

router.post("/", async (req, res) => {
  const { emailAddress, name } = req.body ?? {};

  if (typeof emailAddress != "string" || !emailAddress.trim()) {
    return res.status(400).json({ error: "emailAddress missing" });
  }
  if (typeof name != "string" || !name.trim()) {
    return res.status(400).json({ error: "name missing" });
  }

  const token = signConfirmToken({
    emailAddress: emailAddress.trim(),
    name: name.trim(),
  });

  const baseUrl = process.env.PUBLIC_BASE_URL!;
  const confirmUrl = `${baseUrl}/register/confirm?code=${token}`;

  // 👉 HIER der eigentliche Fix: Mail verschicken
  await sendConfirmMail(emailAddress.trim(), confirmUrl);

  return res.status(200).json({
    message: "Registration email sent",
  });
});

export default router;
