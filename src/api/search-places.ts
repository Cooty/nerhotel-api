import { Hono } from "hono/tiny"

import {
  getCachedPlaces,
  findProperty,
  makeSuccessResponse,
  makeErrorResponse
} from "../utils"

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

    return makeSuccessResponse(c, found)
  } catch (error) {
    console.error(error)
    return makeErrorResponse(c, error)
  }
})

export default app
