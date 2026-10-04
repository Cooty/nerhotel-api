import removeAccents from "./remove-accents"

describe("removeAccents", () => {
  it.each([
    ["szálloda", "szalloda"],
    ["étterem", "etterem"],
    ["víz", "viz"],
    ["tó", "to"],
    ["öröm", "orom"],
    ["Lőrinc", "lorinc"],
    ["út", "ut"],
    ["üdülő", "udulo"],
    ["tűz", "tuz"],
    ["árvíztűrő tükörfúrógép", "arvizturo tukorfurogep"],
    ["Mészáros Lőrinc", "meszaros lorinc"],
    ["ÁRVÍZTŰRŐ TÜKÖRFÚRÓGÉP", "arvizturo tukorfurogep"],
    ["ÁÉÍÓÖŐÚÜŰ", "aeiooouuu"]
  ])("normalizes Hungarian accents in %j to %j", (input, expected) => {
    expect(removeAccents(input)).toBe(expected)
  })

  it.each([
    ["Mädchen", "madchen"],
    ["schön", "schon"],
    ["München", "munchen"],
    ["ÄÖÜ", "aou"],
    ["Straße", "straße"]
  ])("normalizes German text %j to %j", (input, expected) => {
    expect(removeAccents(input)).toBe(expected)
  })

  it.each([
    ["a\u0301rvi\u0301ztu\u030bro\u030b", "arvizturo"],
    ["A\u0308O\u0308U\u0308", "aou"]
  ])("removes decomposed combining accents from %j", (input, expected) => {
    expect(removeAccents(input)).toBe(expected)
  })

  it.each([
    ["", ""],
    ["hotel", "hotel"],
    ["BUDAPEST", "budapest"],
    ["  Andrássy út 8., 1061\nMünchen!  ", "  andrassy ut 8., 1061\nmunchen!  "]
  ])("preserves other content while lowercasing %j", (input, expected) => {
    expect(removeAccents(input)).toBe(expected)
  })
})
