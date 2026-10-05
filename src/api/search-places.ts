import { Hono } from "hono/tiny"

import { getCachedPlaces, findProperty } from "../utils"

const app = new Hono<{ Bindings: CloudflareBindings }>()

app.get("/", async (c) => {
  try {
    const allPlaces = await getCachedPlaces(c)
    const query = c.req.query("q")

    if (!query) {
      return c.json([], 400, {
        // Caching will be done on the client's application side
        // and the server-side cache is controlled manually (KV Storage + cache buster webhook)
        // so we need to ensure that this data is not cached in the browser
        "Cache-Control": "no-cache"
      })
    }

    const found = allPlaces.filter((place) =>
      findProperty(place.properties, query.toLowerCase())
    )

    if (found.length === 0) {
      return c.json([], 404, {
        // Caching will be done on the client's application side
        // and the server-side cache is controlled manually (KV Storage + cache buster webhook)
        // so we need to ensure that this data is not cached in the browser
        "Cache-Control": "no-cache"
      })
    }

    return c.json(found, 200, {
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
