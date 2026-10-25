import arcjet, { detectBot, shield, tokenBucket } from "@arcjet/next";

const key = process.env.ARCJET_KEY;

if (!key) {
  throw new Error("ARCJET_KEY is not set.");
}

export const aj = arcjet({
  key,
  characteristics: ["userId"],
  rules: [
    shield({ mode: "LIVE" }),
    detectBot({
      mode: "LIVE",
      allow: [],
    }),
  ],
});

export const publicAj = aj.withRule(
  tokenBucket({
    mode: "LIVE",
    interval: "1m",
    refillRate: 20,
    capacity: 40,
  })
);

export const userAj = aj.withRule(
  tokenBucket({
    mode: "LIVE",
    interval: "1m",
    refillRate: 8,
    capacity: 20,
  })
);

export function arcjetResponse(decision: { isDenied(): boolean; reason?: { isBot?: () => boolean; isRateLimit?: () => boolean } }) {
  if (!decision?.isDenied()) {
    return null;
  }

  if (decision.reason?.isBot?.()) {
    return {
      status: 403,
      body: { error: "Bot traffic is not allowed.", code: "BOT_DETECTED" },
    };
  }

  if (decision.reason?.isRateLimit?.()) {
    return {
      status: 429,
      body: { error: "Too many requests. Please try again later.", code: "RATE_LIMITED" },
    };
  }

  return {
    status: 403,
    body: { error: "Request blocked by security policy.", code: "ACCESS_DENIED" },
  };
}

export async function protectPublicRequest(req: Request) {
  const decision = await publicAj.protect(req, { userId: "public", requested: 1 });
  return arcjetResponse(decision);
}

export async function protectUserRequest(req: Request, userId: string) {
  const decision = await userAj.protect(req, { userId, requested: 1 });
  return arcjetResponse(decision);
}