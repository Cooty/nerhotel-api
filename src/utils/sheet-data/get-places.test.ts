import { webcrypto } from "node:crypto"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { ZodError } from "zod"

import { convertCsvToObject } from "../../lib"
import { getPlaces } from "./get-places"

// Reconstructed from three randomly sampled records in all-places.json (seed 42).
const fixtureRows = convertCsvToObject(
  readFileSync(join(__dirname, "fixtures", "sample-places.csv"), "utf8")
)
const expectedPlaces = JSON.parse(
  readFileSync(join(__dirname, "fixtures", "sample-places.json"), "utf8")
)

function makeRow(overrides: Record<string, string> = {}) {
  return { ...fixtureRows[0], ...overrides }
}

describe("getPlaces", () => {
  const cryptoDescriptor = Object.getOwnPropertyDescriptor(globalThis, "crypto")
  let consoleError: jest.SpiedFunction<typeof console.error>

  beforeAll(() => {
    // Workers provide Web Crypto globally; Jest's Node environment may not.
    Object.defineProperty(globalThis, "crypto", {
      configurable: true,
      value: webcrypto
    })
  })

  afterAll(() => {
    if (cryptoDescriptor) {
      Object.defineProperty(globalThis, "crypto", cryptoDescriptor)
    } else {
      Reflect.deleteProperty(globalThis, "crypto")
    }
  })

  beforeEach(() => {
    consoleError = jest.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("returns an empty array for no input rows", () => {
    expect(getPlaces([])).toEqual([])
    expect(consoleError).not.toHaveBeenCalled()
  })

  it("matches the complete API output for the three sampled places", () => {
    expect(getPlaces(fixtureRows)).toEqual(expectedPlaces)
    expect(consoleError).not.toHaveBeenCalled()
  })

  it("maps localized names, links, details, and categories independently", () => {
    const places = getPlaces([
      makeRow({
        name_en: " English name ",
        news_en: " https://example.com/en ",
        details_en: " English details ",
        category: "restaurant",
        name_de: " Deutscher Name ",
        news_de: " https://example.com/de ",
        details_de: " Deutsche Details ",
        category_de: "Restaurant"
      })
    ])

    expect(places).toHaveLength(1)
    expect(places[0].properties).toMatchObject({
      en: {
        name: "English name",
        link: "https://example.com/en",
        details: "English details",
        type: "restaurant"
      },
      de: {
        name: "Deutscher Name",
        link: "https://example.com/de",
        details: "Deutsche Details",
        type: "Restaurant"
      }
    })
  })

  it.each([
    ["Street 1", "1016", "Budapest, Street 1, 1016"],
    ["", "1016", "Budapest, 1016"],
    ["Street 1", "", "Budapest, Street 1"],
    ["", "", "Budapest"]
  ])("builds an address with street %j and zip %j", (street, zip, expected) => {
    const places = getPlaces([makeRow({ loc_address: street, zip })])
    expect(places).toHaveLength(1)
    expect(places[0].properties.address).toBe(expected)
  })

  it.each(["", "   ", " #N/A ", undefined])(
    "normalizes missing optional cells (%j) to null",
    (value) => {
      const row = makeRow()
      const optionalColumns = [
        "company",
        "company_link",
        "news",
        "details",
        "picture",
        "name_en",
        "news_en",
        "details_en",
        "name_de",
        "news_de",
        "details_de",
        "T1_link",
        "IT1_link"
      ]
      for (const column of optionalColumns) {
        if (value === undefined) {
          delete row[column]
        } else {
          row[column] = value
        }
      }

      const places = getPlaces([row])
      expect(places).toHaveLength(1)
      expect(places[0].properties).toMatchObject({
        company: { name: null, link: null },
        link: null,
        details: null,
        picture: null,
        en: { name: null, link: null, details: null },
        de: { name: null, link: null, details: null },
        oligarchs: [{ link: null }],
        ceos: [{ link: null }]
      })
      expect(consoleError).not.toHaveBeenCalled()
    }
  )

  it("trims populated optional cells and preserves supplied person IDs", () => {
    const places = getPlaces([
      makeRow({
        company: " Company ",
        company_link: " https://example.com/company ",
        news: " https://example.com/news ",
        details: " Details ",
        picture: " https://example.com/picture.jpg ",
        T1_ID: " owner-id ",
        T1_link: " https://example.com/owner ",
        IT1_ID: " ceo-id ",
        IT1_link: " https://example.com/ceo "
      })
    ])

    expect(places).toHaveLength(1)
    expect(places[0].properties).toMatchObject({
      company: { name: "Company", link: "https://example.com/company" },
      link: "https://example.com/news",
      details: "Details",
      picture: "https://example.com/picture.jpg",
      oligarchs: [{ id: "owner-id", link: "https://example.com/owner" }],
      ceos: [{ id: "ceo-id", link: "https://example.com/ceo" }]
    })
  })

  it("reads all three owner and five CEO slots, cleans names, and selects primary people", () => {
    const row = makeRow()
    const ownerNames = ["!!! Owner One! ", " Owner Two ", "!!! Owner Three"]
    const ceoNames = [
      "CEO One",
      "!!! CEO Two",
      "CEO Three",
      "CEO Four",
      "!!! CEO Five"
    ]
    for (const [index, name] of ownerNames.entries()) {
      row[`T${index + 1} OL`] = name
      row[`T${index + 1}_ID`] = `owner-${index + 1}`
      row[`T${index + 1}_link`] = `https://example.com/owner-${index + 1}`
    }
    for (const [index, name] of ceoNames.entries()) {
      row[`IT${index + 1}`] = name
      row[`IT${index + 1}_ID`] = `ceo-${index + 1}`
      row[`IT${index + 1}_link`] = `https://example.com/ceo-${index + 1}`
    }

    const places = getPlaces([row])
    expect(places).toHaveLength(1)
    const properties = places[0].properties
    const expectedOwners = ["Owner One", "Owner Two", "Owner Three"].map(
      (name, index) => ({
        name,
        id: `owner-${index + 1}`,
        link: `https://example.com/owner-${index + 1}`
      })
    )
    const expectedCEOs = [
      "CEO One",
      "CEO Two",
      "CEO Three",
      "CEO Four",
      "CEO Five"
    ].map((name, index) => ({
      name,
      id: `ceo-${index + 1}`,
      link: `https://example.com/ceo-${index + 1}`
    }))
    expect(properties.oligarchs).toEqual(expectedOwners)
    expect(properties.ceos).toEqual(expectedCEOs)
    expect(properties.mainOligarch).toEqual([
      expectedOwners[0],
      expectedOwners[2]
    ])
    expect(properties.mainCEO).toEqual([expectedCEOs[1], expectedCEOs[4]])
  })

  it("requires the primary marker at the start of the original name", () => {
    const places = getPlaces([
      makeRow({ "T1 OL": "Owner !!! One", IT1: " !!! CEO" })
    ])
    expect(places).toHaveLength(1)
    expect(places[0].properties).toMatchObject({
      mainOligarch: [],
      mainCEO: [],
      oligarchs: [{ name: "Owner  One" }],
      ceos: [{ name: "CEO" }]
    })
  })

  it("omits people with empty or absent names, even if they have IDs or links", () => {
    const row = makeRow({ "T1 OL": "", T1_ID: "unused", IT1_ID: "unused" })
    delete row.IT1
    const places = getPlaces([row])
    expect(places).toHaveLength(1)
    expect(places[0].properties).toMatchObject({
      mainOligarch: [],
      mainCEO: [],
      oligarchs: [],
      ceos: []
    })
  })

  it.each(["", "   ", "#N/A", undefined])(
    "generates distinct UUIDs for missing person IDs (%j)",
    (value) => {
      const row = makeRow({ IT1: "!!! CEO" })
      for (const column of ["T1_ID", "IT1_ID"]) {
        if (value === undefined) delete row[column]
        else row[column] = value
      }
      const places = getPlaces([row])
      expect(places).toHaveLength(1)
      const properties = places[0].properties
      const uuidPattern =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
      expect(properties.oligarchs[0].id).toMatch(uuidPattern)
      expect(properties.ceos[0].id).toMatch(uuidPattern)
      expect(properties.oligarchs[0].id).not.toBe(properties.ceos[0].id)
      expect(properties.mainOligarch[0].id).toBe(properties.oligarchs[0].id)
      expect(properties.mainCEO[0].id).toBe(properties.ceos[0].id)
    }
  )

  it.each([
    ["-90", "-180", [-90, -180]],
    ["90", "180", [90, 180]],
    ["0", "0", [0, 0]]
  ])("accepts valid coordinate boundaries: %s, %s", (lat, lng, expected) => {
    const places = getPlaces([makeRow({ lat, lng })])
    expect(places).toHaveLength(1)
    expect(places[0].geometry).toEqual({ type: "Point", coordinates: expected })
  })

  it.each([
    ["pl_id", "0"],
    ["pl_id", "-1"],
    ["pl_id", "01"],
    ["pl_id", "abc"],
    ["loc_name", ""],
    ["type", ""],
    ["date", ""],
    ["lat", "not-a-number"],
    ["lng", ""],
    ["lat", "90.1"],
    ["lat", "-90.1"],
    ["lng", "180.1"],
    ["lng", "-180.1"],
    ["news", "not-a-url"],
    ["company_link", "not-a-url"],
    ["picture", "not-a-url"],
    ["news_en", "not-a-url"],
    ["news_de", "not-a-url"],
    ["T1_link", "not-a-url"],
    ["IT1_link", "not-a-url"],
    ["T1 OL", "!!!"],
    ["IT1", "   "]
  ])("skips and logs rows with invalid %s = %j", (column, value) => {
    expect(getPlaces([makeRow({ [column]: value })])).toEqual([])
    expect(consoleError).toHaveBeenCalledTimes(1)
    expect(consoleError).toHaveBeenCalledWith(expect.any(ZodError))
  })

  it("continues after an invalid row and preserves the order of valid rows", () => {
    expect(
      getPlaces([
        fixtureRows[0],
        makeRow({ pl_id: "invalid" }),
        ...fixtureRows.slice(1)
      ])
    ).toEqual(expectedPlaces)
    expect(consoleError).toHaveBeenCalledTimes(1)
  })

  it("rejects incomplete rows without throwing", () => {
    expect(getPlaces([{}])).toEqual([])
    expect(consoleError).toHaveBeenCalledWith(expect.any(ZodError))
  })

  it("does not mutate the input rows", () => {
    const rows = fixtureRows.map((row) => Object.freeze({ ...row }))
    const originalRows = rows.map((row) => ({ ...row }))
    getPlaces(rows)
    expect(rows).toEqual(originalRows)
  })
})
