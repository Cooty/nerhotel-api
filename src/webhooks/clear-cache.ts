import { Hono } from "hono/tiny";

import { AppConfig } from "../config/app-config";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.post("/", async (c) => {
  const secret = c.req.header("X-Webhook-Secret");
  if (!secret || secret !== c.env.WEBHOOK_SECRET) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  try {
    const contentType = c.req.header("content-type") || "";
    const contentLength = Number(c.req.header("content-length") || "0");

    let key: string | undefined;

    if (contentType.includes("application/json") && contentLength > 0) {
      const body = await c.req.json<{ key?: string }>();
      key = body?.key;
    }
    const resolvedKey =
      key && typeof key === "string" ? key : AppConfig.cacheKeys.allPlaces;

    c.executionCtx.waitUntil(c.env.DATA_CACHE.delete(resolvedKey));

    const message = `${resolvedKey} was deleted from the cache`;
    console.log(message);

    return c.json({ message });
  } catch (error) {
    console.error(error);
    const isError = error instanceof Error;
    return c.json({ message: isError ? error.message : "Unknown error" }, 500);
  }
});

export default app;
