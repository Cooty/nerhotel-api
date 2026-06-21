import { Hono } from "hono/tiny";
import { rateLimiter } from "hono-rate-limiter";

import getAllPlaces from "./api/get-all-places";
import getPlaceById from "./api/get-place-by-id";
import searchPlaces from "./api/search-places";
import getPlacesByPersonName from "./api/get-places-by-person-name";

import clearCache from "./webhooks/clear-cache";

const api = new Hono();
const webhooks = new Hono();
const app = new Hono<{ Bindings: CloudflareBindings }>();

app.use(
  rateLimiter<{ Bindings: CloudflareBindings }>({
    binding: (c) => c.env.NERHOTEL_API_RATE_LIMITER,
    keyGenerator: (c) => c.req.header("cf-connecting-ip") ?? "",
  }),
);

api.route("/places/search", searchPlaces);
api.route("/places/:id{[0-9]+}", getPlaceById);
api.route(
  "/places/person/:name{[a-zA-ZáéíóúüűöőñäßÁÉÍÓÚÜŰÑÄÖŐ_\\s-]+}",
  getPlacesByPersonName,
);
api.route("/places", getAllPlaces);

app.route("/api", api);

webhooks.route("/clear-cache", clearCache);

app.route("/webhooks", webhooks);

export default app;
