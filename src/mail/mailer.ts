import nodemailer from "nodemailer";

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_SECURE,
  MAIL_FROM,
  SMTP_DEBUG,
  SMTP_LOGGER,
} = process.env;

if (!SMTP_HOST || !SMTP_PORT || !MAIL_FROM) {
  throw new Error("SMTP env vars missing");
}

const secure = SMTP_SECURE === "true" || Number(SMTP_PORT) === 465;

export const mailer = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT),
  secure,
  auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,

  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 20_000,

  debug: SMTP_DEBUG === "true",
  logger: SMTP_LOGGER === "true",
});

export async function verifySmtpConnection(): Promise<void> {
  console.log(
    `[smtp] verify start host=${SMTP_HOST} port=${SMTP_PORT} secure=${secure} auth=${Boolean(
      SMTP_USER && SMTP_PASS
    )}`
  );

  await mailer.verify();

  console.log("[smtp] verify ok");
}

export async function sendConfirmMail(to: string, confirmUrl: string) {
  console.log(
    `[smtp] send start to=${to} host=${SMTP_HOST} port=${SMTP_PORT} secure=${secure}`
  );

  const attachmentJson = {
    "@type": "EMailRegisterAction",
    "@context": "https://sml.mustang.im",
    "object": {
      "@type": "Account",
      "emailAddress": to,
    },
    "target": confirmUrl,
  };

  try {
    const info = await mailer.sendMail({
      from: MAIL_FROM,
      to,
      subject: "Registration confirmation",

      text: `Please finish registration and confirm your email address by opening this link:\n\n${confirmUrl}\n`,

      attachments: [
        {
          filename: "register.json",
          contentType: "application/ld+json",
          content: JSON.stringify(attachmentJson, null, 2),
          contentDisposition: "inline",
        },
      ],

      /* better use `multipart/alternative` for full representation:
      alternatives: [
        {
          contentType: "application/ld+json",
          content: JSON.stringify(attachmentJson, null, 2),
        },
      ],*/
    });

    console.log(`[smtp] send ok messageId=${info.messageId ?? "n/a"}`);
  } catch (err: any) {
    console.error("[smtp] send failed:", err?.message ?? err);
    throw err;
  }
}
