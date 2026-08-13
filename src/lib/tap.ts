const TAP_API_BASE = "https://api.tap.company/v2";

export function isTapConfigured() {
  return Boolean(process.env.TAP_SECRET_KEY);
}

export function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

/** POSTs to Tap's REST API. Tap has no SDK for Node — plain fetch against api.tap.company. */
export async function tapRequest(path: string, body: unknown) {
  const secretKey = process.env.TAP_SECRET_KEY;
  if (!secretKey) {
    throw new Error("TAP_SECRET_KEY is not configured");
  }

  const res = await fetch(`${TAP_API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secretKey}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.errors?.[0]?.description ?? `Tap request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}
