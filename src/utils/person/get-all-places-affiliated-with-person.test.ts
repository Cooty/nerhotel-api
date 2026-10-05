import { readFileSync } from "node:fs"
import { join } from "node:path"

import type { Places } from "../../types"
import { getAllPlacesAffiliatedWithPerson } from "./get-all-places-affiliated-with-person"

// Unchanged records 1, 2, 6, 7, 47, and 409 from sheet-data/fixtures/all-places.json.
// Includes multiple people per role, shared affiliations, and empty person lists.
const fixturePlaces: Places = JSON.parse(
  readFileSync(join(__dirname, "fixtures", "affiliated-places.json"), "utf8")
)

describe("getAllPlacesAffiliatedWithPerson", () => {
  it("returns an empty array when there are no places", () => {
    expect(getAllPlacesAffiliatedWithPerson([], "Csányi Sándor")).toEqual([])
  })

  it.each([
    ["CEO", "Zsidó László", ["6", "7"]],
    ["oligarch", "Simon István", ["6", "7"]],
    ["oligarch", "Csányi Sándor", ["1", "47"]],
    ["CEO after the first entry", "Mészáros Mónika Krisztina", ["1"]],
    ["oligarch after the first entry", "Garancsi István", ["1"]],
    ["CEO after the first entry", "Pápai Csaba", ["2"]],
    ["CEO in the last slot", "Csányi Gabriella", ["47"]],
    ["person in both roles", "Csányi Erika", ["47"]]
  ])("returns complete matching places for a %s (%s)", (_, name, ids) => {
    const expected = ids.map((id) =>
      fixturePlaces.find((place) => place.properties.id === id)
    )

    expect(getAllPlacesAffiliatedWithPerson(fixturePlaces, name)).toEqual(
      expected
    )
  })

  it.each([
    "Unknown Person",
    "",
    "Zsidó",
    "zsidó lászló",
    "Zsido Laszlo",
    " Zsidó László",
    "Zsidó László ",
    "Arcus kávézó"
  ])("returns no matches for a non-exact person name (%j)", (name) => {
    expect(getAllPlacesAffiliatedWithPerson(fixturePlaces, name)).toEqual([])
  })

  it("handles a place with empty CEO and oligarch lists", () => {
    const marriott = fixturePlaces[5]
    expect(marriott.properties.ceos).toEqual([])
    expect(marriott.properties.oligarchs).toEqual([])

    expect(
      getAllPlacesAffiliatedWithPerson([marriott], "Csányi Sándor")
    ).toEqual([])
  })

  it("preserves input order and the original matching place objects", () => {
    const places = [...fixturePlaces].reverse()
    const result = getAllPlacesAffiliatedWithPerson(places, "Zsidó László")

    expect(result).toHaveLength(2)
    expect(result[0]).toBe(fixturePlaces[3])
    expect(result[1]).toBe(fixturePlaces[2])
    expect(result).not.toBe(places)
  })

  it("does not mutate the places or their affiliation lists", () => {
    const places: Places = JSON.parse(JSON.stringify(fixturePlaces))

    getAllPlacesAffiliatedWithPerson(places, "Csányi Erika")

    expect(places).toEqual(fixturePlaces)
  })
})
