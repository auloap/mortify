import { createHmac } from "crypto";

export type TelegramUser = {
  id: number;
  first_name?: string;
  username?: string;
};

export function verifyTelegramInitData(initData: string, botToken: string): TelegramUser | null {
  if (!initData) return null;

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return null;
  params.delete("hash");

  const dataCheckString = Array.from(params.keys())
    .sort()
    .map(key => `${key}=${params.get(key)}`)
    .join("\n");

  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const computedHash = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
  if (computedHash !== hash) return null;

  const userStr = params.get("user");
  if (!userStr) return null;
  try {
    return JSON.parse(userStr) as TelegramUser;
  } catch {
    return null;
  }
}
