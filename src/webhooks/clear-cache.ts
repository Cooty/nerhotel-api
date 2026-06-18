import { Hono } from "hono/tiny";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.post("/", async (c) => {
  return c.json({ it: "works" });
});

export default app;
