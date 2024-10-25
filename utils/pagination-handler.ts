import { NextRequest } from "next/server"

const DEFAULT_LIMIT = "50"

export function paginationHandler(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
  const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || DEFAULT_LIMIT, 10)))
  const skip = (page - 1) * limit

  console.log("paginationHandler >>> ", skip, limit, page)

  return { skip, limit, page }
}
