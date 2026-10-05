import { readFileSync } from "node:fs"
import { join } from "node:path"

import { fetchCSV } from "./fetch-csv"

const csvFixture = readFileSync(
  join(__dirname, "fixtures", "sample-places.csv"),
  "utf8"
)
const url = "https://docs.google.com/spreadsheets/d/example/export?format=csv"

describe("fetchCSV", () => {
  let fetchMock: jest.SpiedFunction<typeof fetch>

  beforeEach(() => {
    fetchMock = jest.spyOn(globalThis, "fetch")
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("fetches the supplied URL and returns the CSV text unchanged", async () => {
    fetchMock.mockResolvedValue(new Response(csvFixture))

    await expect(fetchCSV(url)).resolves.toBe(csvFixture)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(url)
  })

  it("returns an empty string for a successful response with no content", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))

    await expect(fetchCSV(url)).resolves.toBe("")
  })

  it.each([404, 500])(
    "rejects HTTP %s responses with the source URL without reading the body",
    async (status) => {
      const response = new Response("Error page", { status })
      const textMock = jest.spyOn(response, "text")
      fetchMock.mockResolvedValue(response)

      await expect(fetchCSV(url)).rejects.toThrow(
        `[error] Can't fetch CSV data from: ${url}`
      )
      expect(textMock).not.toHaveBeenCalled()
    }
  )

  it("propagates network failures", async () => {
    const error = new TypeError("Failed to fetch")
    fetchMock.mockRejectedValue(error)

    await expect(fetchCSV(url)).rejects.toBe(error)
  })

  it("propagates failures while reading the response body", async () => {
    const error = new Error("Response stream interrupted")
    const response = new Response(csvFixture)
    jest.spyOn(response, "text").mockRejectedValue(error)
    fetchMock.mockResolvedValue(response)

    await expect(fetchCSV(url)).rejects.toBe(error)
  })
})
