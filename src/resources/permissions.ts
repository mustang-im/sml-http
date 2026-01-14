export function canRead(
  visibility: string,
  ownerEmail: string,
  requesterEmail: string
): boolean {
  const isOwner = ownerEmail === requesterEmail;

  if (visibility === "public-read" || visibility === "public-write") {
    return true;
  }

  return isOwner;
}

export function canWrite(
  visibility: string,
  ownerEmail: string,
  requesterEmail: string
): boolean {
  const isOwner = ownerEmail === requesterEmail;

  if (visibility === "public-write") {
    return true;
  }

  return isOwner;
}
