import type { Context } from "hono"
import type { Places } from "../../types"
import { AppConfig } from "../../config/app-config"
import { fetchSheetDataAsPlaces } from "./fetch-sheet-data-as-places"

export async function getCachedPlaces(
  c: Context<{ Bindings: CloudflareBindings }>
): Promise<Places> {
  const cached = await c.env.DATA_CACHE.get<Places>(
    AppConfig.cacheKeys.allPlaces,
    "json"
  )

  if (cached !== null) {
    return cached
  }

  const places = await fetchSheetDataAsPlaces(AppConfig.csvUrl)

  c.executionCtx.waitUntil(
    c.env.DATA_CACHE.put(AppConfig.cacheKeys.allPlaces, JSON.stringify(places))
  )

  return places
}
