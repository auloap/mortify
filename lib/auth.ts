import { NextRequest } from "next/server";

export function getUserId(req: NextRequest | Request): string {
  const id = req.headers.get("x-user-id");
  if (!id) throw new Error("Missing x-user-id header — request did not pass through middleware");
  return id;
}
