import { Hono } from "hono/tiny"
import {
  getAllPlacesAffiliatedWithPerson,
  getCachedPlaces,
  makeSuccessResponse,
  makeErrorResponse
} from "../utils"

const app = new Hono<{ Bindings: CloudflareBindings }>()

app.get("/", async (c) => {
  try {
    const name = c.req.param("name")
    if (!name) {
      return c.json({ message: `Invalid name: ${name}` }, 400)
    }
    const allPlaces = await getCachedPlaces(c)

    const allAffiliatedPlaces = getAllPlacesAffiliatedWithPerson(
      allPlaces,
      name
    )

    return makeSuccessResponse(c, allAffiliatedPlaces)
  } catch (error) {
    console.error(error)
    return makeErrorResponse(c, error)
  }
})

export default app
