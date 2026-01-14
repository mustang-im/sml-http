import jwt, { SignOptions } from "jsonwebtoken";


const confirmSecret = process.env.JWT_CONFIRM_SECRET as string;
const accessSecret = process.env.JWT_ACCESS_SECRET as string;

const confirmTtl = process.env.JWT_CONFIRM_TTL ?? "15m";
const accessTtl = process.env.JWT_ACCESS_TTL ?? "7d";


export interface ConfirmTokenPayload {
  emailAddress: string;
  name: string;
}

export interface AccessTokenPayload {
  emailAddress: string;
}


export function signConfirmToken(
  payload: ConfirmTokenPayload
): string {
  return jwt.sign(payload, confirmSecret, {
    expiresIn: confirmTtl as SignOptions["expiresIn"],
  });
}

export function verifyConfirmToken(
  token: string
): ConfirmTokenPayload {
  return jwt.verify(token, confirmSecret) as ConfirmTokenPayload;
}


export function signAccessToken(
  payload: AccessTokenPayload
): string {
  return jwt.sign(payload, accessSecret, {
    expiresIn: accessTtl as SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(
  token: string
): AccessTokenPayload {
  return jwt.verify(token, accessSecret) as AccessTokenPayload;
}
