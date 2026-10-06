import { Context } from "hono"

import { makeErrorResponse } from "./make-error-response"

describe("makeErrorResponse", () => {
  let context: Context<{ Bindings: CloudflareBindings }>

  beforeEach(() => {
    context = new Context<{ Bindings: CloudflareBindings }>(
      new Request("https://example.com")
    )
  })

  it.each([
    new Error("Failed to fetch places"),
    new TypeError("Invalid data"),
    new Error("")
  ])(
    "returns an Error's message (%j) as JSON with status 500",
    async (error) => {
      const response = makeErrorResponse(context, error)

      expect(response.status).toBe(500)
      expect(response.headers.get("Content-Type")).toBe("application/json")
      await expect(response.json()).resolves.toEqual({ message: error.message })
    }
  )

  it.each([
    ["a string", "Failed to fetch places"],
    ["a number", 500],
    ["a boolean", false],
    ["null", null],
    ["undefined", undefined],
    ["a plain object", {}],
    ["an object with a message", { message: "Not an Error instance" }]
  ])("uses the fallback message for %s", async (_, error) => {
    const response = makeErrorResponse(context, error)

    expect(response.status).toBe(500)
    expect(response.headers.get("Content-Type")).toBe("application/json")
    await expect(response.json()).resolves.toEqual({ message: "Unknown error" })
  })

  it("overrides an existing status while preserving context headers", () => {
    context.status(200)
    context.header("X-Request-ID", "request-1")

    const response = makeErrorResponse(context, new Error("Failed"))

    expect(response.status).toBe(500)
    expect(response.headers.get("X-Request-ID")).toBe("request-1")
  })
})
