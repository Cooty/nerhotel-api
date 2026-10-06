import type { Context } from "hono"

export function makeSuccessResponse<T>(
  c: Context<{ Bindings: CloudflareBindings }>,
  data: T
) {
  return c.json(data, 200, {
    // Caching will be done on the client's application side
    // and the server-side cache is controlled manually (KV Storage + cache buster webhook)
    // so we need to ensure that this data is not cached in the browser
    "Cache-Control": "no-cache"
  })
}
