import { readFileSync } from "node:fs"
import { join } from "node:path"

import { convertCsvToObject } from "./csv-parser"

describe("convertCsvToObject", () => {
  it("uses the first row as headers and preserves values as strings", () => {
    expect(
      convertCsvToObject(
        "name,id,city\nHotel Moments,1,Budapest\nHotel Alice,2,Budapest"
      )
    ).toEqual([
      { name: "Hotel Moments", id: "1", city: "Budapest" },
      { name: "Hotel Alice", id: "2", city: "Budapest" }
    ])
  })

  it("returns no records for a header-only CSV", () => {
    expect(convertCsvToObject("name,id")).toEqual([])
    expect(convertCsvToObject("name,id\r\n")).toEqual([])
  })

  it("supports a single column and preserves whitespace", () => {
    expect(convertCsvToObject("name\n Hotel Moments \nHotel Alice")).toEqual([
      { name: " Hotel Moments " },
      { name: "Hotel Alice" }
    ])
  })

  it("supports quoted headers, commas, and Excel-style escaped quotes", () => {
    expect(
      convertCsvToObject(
        '"place,name",details\n"Hotel, Budapest","He said ""hello""."'
      )
    ).toEqual([
      { "place,name": "Hotel, Budapest", details: 'He said "hello".' }
    ])
  })

  it("preserves line breaks inside quoted fields", () => {
    expect(
      convertCsvToObject(
        'name,details\r\nMoments,"First line\r\nSecond line\nThird line"'
      )
    ).toEqual([
      { name: "Moments", details: "First line\r\nSecond line\nThird line" }
    ])
  })

  it("handles empty quoted and unquoted fields, including the final field", () => {
    expect(
      convertCsvToObject('name,details,link\nMoments,"",\n,details,""')
    ).toEqual([
      { name: "Moments", details: "", link: "" },
      { name: "", details: "details", link: "" }
    ])
  })

  it.each(["\n", "\r\n"])(
    "supports %j record separators and a final line ending",
    (lineEnding) => {
      const csv = ["name,id", "Moments,1", "Alice,2"].join(lineEnding)
      const expected = [
        { name: "Moments", id: "1" },
        { name: "Alice", id: "2" }
      ]
      expect(convertCsvToObject(csv)).toEqual(expected)
      expect(convertCsvToObject(csv + lineEnding)).toEqual(expected)
    }
  )

  it("parses the header and first two places from the supplied Google Sheet export", () => {
    const csv = readFileSync(join(__dirname, "fixtures", "places.csv"), "utf8")
    const places = convertCsvToObject(csv)

    expect(places).toHaveLength(2)
    expect(places.map((place) => Object.keys(place).length)).toEqual([56, 56])
    expect(places).toMatchObject([
      {
        loc_name: "Hotel Moments",
        pl_id: "1",
        loc_address: "Andrássy út 8.",
        "T1 OL": "!!! Csányi Sándor",
        IT1_ID: "#N/A",
        T2_CO: "",
        date: "2026-03-12",
        "lat1.1": "47,501047",
        "lng1.1": "19,05665"
      },
      {
        loc_name: "Hotel Alice",
        pl_id: "2",
        loc_address: "Andrássy út 116.",
        "T1 OL": "!!! Paár Attila",
        date: "2024.11.24",
        "lat1.1": "47,512832",
        "lng1.1": "19,074034"
      }
    ])
    expect(places[0].details_en).toBe(
      "A shared project between 3 of the most important government-friendly businessmen, Sándor Csányi of OTP, Zsolt Hernádi of MOL and István Garancsi, a close friend of Orbán. The buildings were owned by the local government before being purchased by Garancsi's interests."
    )
  })

  it.each(["", undefined, null, 42, {}, []])(
    "rejects empty or non-string input: %j",
    (input) => {
      expect(() => convertCsvToObject(input as unknown as string)).toThrow(
        "Invalid CSV: expected a non-empty string"
      )
    }
  )

  it.each([
    ['name\n"Moments', "unterminated quoted field"],
    ['name\n"Moments""', "unterminated quoted field"],
    ['name\nMo"ments', "quote inside an unquoted field"],
    ['name\n"Moments"extra', "unexpected character after closing quote"],
    ["name\rMoments", "expected LF after CR"],
    ["name,id\nMoments", "row 2 has 1 fields; expected 2"],
    ["name,id\nMoments,1,extra", "row 2 has 3 fields; expected 2"]
  ])("rejects malformed CSV: %j", (csv, message) => {
    expect(() => convertCsvToObject(csv)).toThrow(`Invalid CSV: ${message}`)
  })
})
