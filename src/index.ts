import { Hono } from "hono/tiny"
import { cors } from "hono/cors"
import { rateLimiter } from "hono-rate-limiter"

import getAllPlaces from "./api/get-all-places"
import getPlaceById from "./api/get-place-by-id"
import searchPlaces from "./api/search-places"
import getPlacesByPersonName from "./api/get-places-by-person-name"

import clearCache from "./webhooks/clear-cache"

const api = new Hono<{ Bindings: CloudflareBindings }>()
const webhooks = new Hono<{ Bindings: CloudflareBindings }>()
const app = new Hono<{ Bindings: CloudflareBindings }>()

api.use("/*", async (c, next) => {
  const productionDomain = c.env.PRODUCTION_ROOT_DOMAIN

  const corsMiddleware = cors({
    origin: (origin) => {
      // If there's no origin header (like server-to-server or curl requests), handle gracefully
      if (!origin) return null

      // Allow localhost or 127.0.0.1 with ANY port
      if (
        /^http:\/\/localhost(:\d+)?$/.test(origin) ||
        /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)
      ) {
        return origin
      }

      // Allow the production domain and all it's subdomains
      if (
        origin === `https://${productionDomain}` ||
        origin.endsWith(`.${productionDomain}`)
      ) {
        return origin
      }

      // Block everything else
      return null
    },
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type"]
  })

  return corsMiddleware(c, next)
})

api.use(
  rateLimiter<{ Bindings: CloudflareBindings }>({
    binding: (c) => c.env.NERHOTEL_API_RATE_LIMITER,
    keyGenerator: (c) => c.req.header("cf-connecting-ip") ?? ""
  })
)

api.route("/places/search", searchPlaces)
api.route("/places/:id{[0-9]+}", getPlaceById)
api.route(
  "/places/person/:name{[a-zA-ZáéíóúüűöőñäßÁÉÍÓÚÜŰÑÄÖŐ_\\s-]+}",
  getPlacesByPersonName
)
api.route("/places", getAllPlaces)

app.route("/api", api)

webhooks.route("/clear-cache", clearCache)

app.route("/webhooks", webhooks)

export default app
