import { getUniqueElements } from "./get-unique-elements"

describe("getUniqueElements", () => {
  it("returns an empty array for empty input", () => {
    expect(getUniqueElements([])).toEqual([])
  })

  it("removes repeated person names and preserves first-occurrence order", () => {
    expect(
      getUniqueElements([
        "Zsidó László",
        "Csányi Sándor",
        "Zsidó László",
        "Garancsi István",
        "Csányi Sándor"
      ])
    ).toEqual(["Zsidó László", "Csányi Sándor", "Garancsi István"])
  })

  it("returns a new array without mutating an already unique input", () => {
    const input = [3, 1, 2]
    const result = getUniqueElements(input)

    expect(result).toEqual([3, 1, 2])
    expect(result).not.toBe(input)
    expect(input).toEqual([3, 1, 2])
  })

  it("does not mutate input containing duplicates", () => {
    const input = [2, 1, 2, 1]

    expect(getUniqueElements(input)).toEqual([2, 1])
    expect(input).toEqual([2, 1, 2, 1])
  })

  it("keeps names with different case, accents, or whitespace distinct", () => {
    const names = [
      "Zsidó László",
      "zsidó lászló",
      "Zsido Laszlo",
      " Zsidó László"
    ]

    expect(getUniqueElements(names)).toEqual(names)
  })

  it("distinguishes values of different types and deduplicates null and undefined", () => {
    expect(
      getUniqueElements([
        1,
        "1",
        false,
        null,
        undefined,
        1,
        false,
        null,
        undefined
      ])
    ).toEqual([1, "1", false, null, undefined])
  })

  it("deduplicates NaN and treats positive and negative zero as equal", () => {
    expect(getUniqueElements([NaN, 0, NaN, -0, 0])).toEqual([NaN, 0])
  })

  it("deduplicates shared object references while keeping separate objects", () => {
    const person = { name: "Csányi Sándor" }
    const otherPerson = { name: "Csányi Sándor" }
    const result = getUniqueElements([person, otherPerson, person])

    expect(result).toHaveLength(2)
    expect(result[0]).toBe(person)
    expect(result[1]).toBe(otherPerson)
  })
})
