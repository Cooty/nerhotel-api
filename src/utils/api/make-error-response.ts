import type { Context } from "hono"

export function makeErrorResponse(
  c: Context<{ Bindings: CloudflareBindings }>,
  error: unknown
) {
  const isError = error instanceof Error
  return c.json({ message: isError ? error.message : "Unknown error" }, 500)
}
