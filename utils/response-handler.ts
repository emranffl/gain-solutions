import { NextResponse } from "next/server"
import { serialize } from "./serialize"

export const responseHandler = async ({
  status = 200,
  results = undefined,
  message = undefined,
  error = undefined,
  stack = undefined,
  headers = undefined,
  revalidate = undefined,
}: {
  status?: number
  results?: Record<string, any> | Record<string, any>[]
  message?: string
  error?: string
  stack?: string
  headers?: Headers
  revalidate?: number
}) => {
  const cacheControl = `public, max-age=${revalidate ?? 0}, stale-while-revalidate=${revalidate ?? 0}`

  return NextResponse.json(
    {
      status,
      ...(results ? { results: serialize(results) } : {}),
      ...(message ? { message } : {}),
      ...(error ? { error } : {}),
      ...(stack ? { stack } : {}),
      ...(headers ? { headers } : {}),
    },
    {
      status,
      headers: {
        "Cache-Control": cacheControl,
      },
    }
  )
}
