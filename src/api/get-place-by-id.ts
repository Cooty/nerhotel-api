import { Hono } from "hono/tiny";
import { AppConfig } from "../config/app-config";
import { fetchSheetDataAsPlaces } from "../utils";
import { Places } from "../types";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.get("/", async (c) => {
  try {
    const id = c.req.param("id");
    if (
      !id ||
      Number.parseInt(id, 10) === 0 ||
      !Number.isSafeInteger(Number.parseInt(id, 10))
    ) {
      return c.json({ message: `Invalid ID: ${id}` }, 400);
    }
    let allPlaces = (await c.env.DATA_CACHE.get(
      AppConfig.cacheKeys.allPlaces,
      "json",
    )) as Places;
    if (!allPlaces) {
      allPlaces = await fetchSheetDataAsPlaces(AppConfig.csvUrl);
      c.executionCtx.waitUntil(
        c.env.DATA_CACHE.put(
          AppConfig.cacheKeys.allPlaces,
          JSON.stringify(allPlaces),
        ),
      );
    }

    const place = allPlaces.find((p) => p.properties.id === id);

    if (place === undefined) {
      return c.json({ message: `ID: ${id} not found` }, 404);
    }

    return c.json(place, 200, {
      // Caching will be done on the client's application side
      // and the server-side cache is controlled manually (KV Storage + cache buster webhook)
      // so we need to ensure that this data is not cached in the browser
      "Cache-Control": "no-cache",
    });
  } catch (error) {
    console.error(error);
    const isError = error instanceof Error;
    return c.json({ message: isError ? error.message : "Unknown error" }, 500);
  }
});

export default app;
