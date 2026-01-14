import nodemailer from "nodemailer";

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_SECURE,
  MAIL_FROM,
} = process.env;

if (!SMTP_HOST || !SMTP_PORT || !MAIL_FROM) {
  throw new Error("SMTP env vars missing");
}

const secure =
  SMTP_SECURE === "true" || Number(SMTP_PORT) === 465;

export const mailer = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT),
  secure,
  auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
});

export async function sendConfirmMail(to: string, confirmUrl: string) {
  await mailer.sendMail({
    from: MAIL_FROM,
    to,
    subject: "Confirm your email",
    text: `Please confirm your email by opening this link:\n\n${confirmUrl}\n`,
  });
}
