export function canRead(
  visibility: string,
  ownerEmail: string,
  requesterEmail: string
): boolean {
  if (visibility === "public-read" || visibility === "public-write") {
    return true;
  }

  const isOwner = ownerEmail === requesterEmail;
  return isOwner;
}

export function canWrite(
  visibility: string,
  ownerEmail: string | null,
  requesterEmail: string
): boolean {
  if (visibility === "public-write") {
    return true;
  }
  if (!ownerEmail && !requesterEmail) {
    // Anonymous user tries to create a new ert -> not allowed
    return false;
  }

  const isOwner = ownerEmail === requesterEmail;
  return isOwner;
}
