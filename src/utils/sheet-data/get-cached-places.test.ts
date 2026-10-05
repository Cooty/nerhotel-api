import type { Context } from "hono"
import { readFileSync } from "node:fs"
import { join } from "node:path"

import { AppConfig } from "../../config/app-config"
import type { Places } from "../../types"
import { fetchSheetDataAsPlaces } from "./fetch-sheet-data-as-places"
import { getCachedPlaces } from "./get-cached-places"

jest.mock("./fetch-sheet-data-as-places")

const mockedFetchSheetDataAsPlaces = jest.mocked(fetchSheetDataAsPlaces)
const samplePlaces: Places = JSON.parse(
  readFileSync(join(__dirname, "fixtures", "sample-places.json"), "utf8")
)

describe("getCachedPlaces", () => {
  let get: jest.Mock<Promise<Places | null>, [string, string]>
  let put: jest.Mock<Promise<void>, [string, string]>
  let waitUntil: jest.Mock<void, [Promise<unknown>]>
  let context: Context<{ Bindings: CloudflareBindings }>

  beforeEach(() => {
    jest.resetAllMocks()
    get = jest.fn().mockResolvedValue(null)
    put = jest.fn().mockResolvedValue(undefined)
    waitUntil = jest.fn()
    context = {
      env: { DATA_CACHE: { get, put } },
      executionCtx: { waitUntil }
    } as unknown as Context<{ Bindings: CloudflareBindings }>
  })

  it.each([
    ["populated", samplePlaces],
    ["empty", [] as Places]
  ])(
    "returns a %s cached dataset without fetching or writing",
    async (_, places) => {
      get.mockResolvedValue(places)

      await expect(getCachedPlaces(context)).resolves.toBe(places)

      expect(get).toHaveBeenCalledTimes(1)
      expect(get).toHaveBeenCalledWith(AppConfig.cacheKeys.allPlaces, "json")
      expect(mockedFetchSheetDataAsPlaces).not.toHaveBeenCalled()
      expect(put).not.toHaveBeenCalled()
      expect(waitUntil).not.toHaveBeenCalled()
    }
  )

  it.each([
    ["populated", samplePlaces],
    ["empty", [] as Places]
  ])("fetches and caches a %s dataset on a cache miss", async (_, places) => {
    mockedFetchSheetDataAsPlaces.mockResolvedValue(places)

    await expect(getCachedPlaces(context)).resolves.toBe(places)

    expect(get).toHaveBeenCalledWith(AppConfig.cacheKeys.allPlaces, "json")
    expect(mockedFetchSheetDataAsPlaces).toHaveBeenCalledTimes(1)
    expect(mockedFetchSheetDataAsPlaces).toHaveBeenCalledWith(AppConfig.csvUrl)
    expect(put).toHaveBeenCalledTimes(1)
    expect(put).toHaveBeenCalledWith(
      AppConfig.cacheKeys.allPlaces,
      JSON.stringify(places)
    )
    expect(waitUntil).toHaveBeenCalledTimes(1)
    expect(waitUntil).toHaveBeenCalledWith(put.mock.results[0].value)
  })

  it("returns fetched places while the cache write is still pending", async () => {
    let completeWrite!: () => void
    const pendingWrite = new Promise<void>((resolve) => {
      completeWrite = resolve
    })
    put.mockReturnValue(pendingWrite)
    mockedFetchSheetDataAsPlaces.mockResolvedValue(samplePlaces)

    try {
      await expect(getCachedPlaces(context)).resolves.toBe(samplePlaces)
      expect(waitUntil).toHaveBeenCalledWith(pendingWrite)
    } finally {
      completeWrite()
    }
  })

  it("propagates cache read errors without fetching or writing", async () => {
    const error = new Error("KV read failed")
    get.mockRejectedValue(error)

    await expect(getCachedPlaces(context)).rejects.toBe(error)

    expect(mockedFetchSheetDataAsPlaces).not.toHaveBeenCalled()
    expect(put).not.toHaveBeenCalled()
    expect(waitUntil).not.toHaveBeenCalled()
  })

  it("propagates sheet fetch errors without caching failed results", async () => {
    const error = new Error("Sheet fetch failed")
    mockedFetchSheetDataAsPlaces.mockRejectedValue(error)

    await expect(getCachedPlaces(context)).rejects.toBe(error)

    expect(put).not.toHaveBeenCalled()
    expect(waitUntil).not.toHaveBeenCalled()
  })
})
