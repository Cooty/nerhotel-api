import { Hono } from "hono/tiny"
import {
  getCachedPlaces,
  makeSuccessResponse,
  makeErrorResponse
} from "../utils"

const app = new Hono<{ Bindings: CloudflareBindings }>()

app.get("/", async (c) => {
  try {
    const id = c.req.param("id")
    if (
      !id ||
      Number.parseInt(id, 10) === 0 ||
      !Number.isSafeInteger(Number.parseInt(id, 10))
    ) {
      return c.json({ message: `Invalid ID: ${id}` }, 400)
    }
    const allPlaces = await getCachedPlaces(c)

    const place = allPlaces.find((p) => p.properties.id === id)

    if (place === undefined) {
      return c.json({ message: `ID: ${id} not found` }, 404)
    }

    return makeSuccessResponse(c, place)
  } catch (error) {
    console.error(error)
    return makeErrorResponse(c, error)
  }
})

export default app
