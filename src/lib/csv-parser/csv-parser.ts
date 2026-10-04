/**
 * @param {string} csvString Must be comma-separated, optionally quoted with double quotes, double quotes escaped
 *        with another double quote (Excel style). First row must contain the headers.
 * @returns {Object<string, string>[]} Array of objects where the keys are the headers, values the cell values.
 * @throws {Error} If the input is empty, is not a string, has malformed quoting, or has inconsistent row lengths.
 */
export function convertCsvToObject(csvString: string) {
  const [headers, ...rows] = csvToArray(csvString)

  return rows.map((row) =>
    row.reduce<Record<string, string>>((result, value, index) => {
      result[headers[index]] = value
      return result
    }, {})
  )
}

/**
 * RFC 4180 compatible CSV parser.
 * @param {string} csvString Must be comma-separated, optionally quoted with double quotes, double quotes escaped
 *        with another double quote (Excel style).
 * @returns {[[string]]} The CSV content as a 2D array of strings
 * @throws {Error} If the input is empty, is not a string, has malformed quoting, or has inconsistent row lengths.
 */
function csvToArray(csvString: string) {
  if (typeof csvString !== "string" || csvString.length === 0) {
    throw new Error("Invalid CSV: expected a non-empty string")
  }

  const rows: string[][] = []
  let row = [""]
  let fieldIndex = 0
  let insideQuotedField = false
  let closedQuotedField = false

  for (let index = 0; index < csvString.length; index++) {
    const character = csvString[index]

    if (insideQuotedField) {
      if (character === '"') {
        if (csvString[index + 1] === '"') {
          row[fieldIndex] += '"'
          index++
        } else {
          insideQuotedField = false
          closedQuotedField = true
        }
      } else {
        row[fieldIndex] += character
      }
      continue
    }

    if (character === ",") {
      row[++fieldIndex] = ""
      closedQuotedField = false
    } else if (character === "\n" || character === "\r") {
      if (character === "\r") {
        if (csvString[index + 1] !== "\n") {
          throw new Error("Invalid CSV: expected LF after CR")
        }
        index++
      }
      rows.push(row)
      row = [""]
      fieldIndex = 0
      closedQuotedField = false
    } else if (closedQuotedField) {
      throw new Error("Invalid CSV: unexpected character after closing quote")
    } else if (character === '"') {
      if (row[fieldIndex].length > 0) {
        throw new Error("Invalid CSV: quote inside an unquoted field")
      }
      insideQuotedField = true
    } else {
      row[fieldIndex] += character
    }
  }

  if (insideQuotedField) {
    throw new Error("Invalid CSV: unterminated quoted field")
  }

  // A final line ending terminates the last record rather than adding an empty one.
  if (!csvString.endsWith("\n")) {
    rows.push(row)
  }

  const columnCount = rows[0].length
  for (const [index, record] of rows.entries()) {
    if (record.length !== columnCount) {
      throw new Error(
        `Invalid CSV: row ${index + 1} has ${record.length} fields; expected ${columnCount}`
      )
    }
  }

  return rows
}
