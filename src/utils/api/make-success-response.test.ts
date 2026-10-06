import { Context } from "hono"

import { makeSuccessResponse } from "./make-success-response"

describe("makeSuccessResponse", () => {
  let context: Context<{ Bindings: CloudflareBindings }>

  beforeEach(() => {
    context = new Context<{ Bindings: CloudflareBindings }>(
      new Request("https://example.com")
    )
  })

  it.each([
    ["an object", { id: "1", properties: { name: "Hotel" } }],
    ["an array", [{ id: "1" }, { id: "2" }]],
    ["an empty array", []],
    ["a string", "Hotel"],
    ["an empty string", ""],
    ["zero", 0],
    ["false", false],
    ["null", null]
  ])("returns %s as JSON with status 200 and no-cache", async (_, data) => {
    const response = makeSuccessResponse(context, data)

    expect(response.status).toBe(200)
    expect(response.headers.get("Content-Type")).toBe("application/json")
    expect(response.headers.get("Cache-Control")).toBe("no-cache")
    await expect(response.json()).resolves.toEqual(data)
  })

  it("overrides an existing status and cache policy while preserving other headers", async () => {
    context.status(201)
    context.header("Cache-Control", "public, max-age=3600")
    context.header("X-Request-ID", "request-1")

    const response = makeSuccessResponse(context, { id: "1" })

    expect(response.status).toBe(200)
    expect(response.headers.get("Cache-Control")).toBe("no-cache")
    expect(response.headers.get("X-Request-ID")).toBe("request-1")
    await expect(response.json()).resolves.toEqual({ id: "1" })
  })
})
