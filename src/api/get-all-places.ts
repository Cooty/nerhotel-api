import { Hono } from "hono/tiny"

import {
  getCachedPlaces,
  makeSuccessResponse,
  makeErrorResponse
} from "../utils"

const app = new Hono<{ Bindings: CloudflareBindings }>()

app.get("/", async (c) => {
  try {
    const allPlaces = await getCachedPlaces(c)

    return makeSuccessResponse(c, allPlaces)
  } catch (error) {
    console.error(error)
    return makeErrorResponse(c, error)
  }
})

export default app
