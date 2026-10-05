import { Hono } from "hono/tiny"

import { getCachedPlaces } from "../utils"

const app = new Hono<{ Bindings: CloudflareBindings }>()

app.get("/", async (c) => {
  try {
    const allPlaces = await getCachedPlaces(c)

    return c.json(allPlaces, 200, {
      // Caching will be done on the client's application side
      // and the server-side cache is controlled manually (KV Storage + cache buster webhook)
      // so we need to ensure that this data is not cached in the browser
      "Cache-Control": "no-cache"
    })
  } catch (error) {
    console.error(error)
    const isError = error instanceof Error
    return c.json({ message: isError ? error.message : "Unknown error" }, 500)
  }
})

export default app
