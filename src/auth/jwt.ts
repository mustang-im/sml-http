import jwt, { SignOptions } from "jsonwebtoken";
// TODO test: import { process } from "node:process";


const confirmSecret = process.env.JWT_CONFIRM_SECRET as string;
const accessSecret = process.env.JWT_ACCESS_SECRET as string;
const confirmTtl = process.env.JWT_CONFIRM_TTL ?? "24h";

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
  return jwt.sign(payload, accessSecret);
}

export function verifyAccessToken(
  token: string
): AccessTokenPayload {
  return jwt.verify(token, accessSecret) as AccessTokenPayload;
}
