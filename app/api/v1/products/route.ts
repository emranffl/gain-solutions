import { prisma } from "@prisma/prisma-instance"
import { paginationHandler } from "@utils/pagination-handler"
import { responseHandler } from "@utils/response-handler"
import { responsePaginationHandler } from "@utils/response-pagination-handler"
import { NextRequest } from "next/server"

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const { skip, limit, page } = paginationHandler(req)
  const sort = searchParams.get("sort") || "createdAt"
  const order = searchParams.get("order") || "desc"
  const query = {
    deletedAt: null, // Exclude soft-deleted products
  }

  try {
    // Retrieve the total count of products for pagination
    const totalCount = await prisma.product.count({
      where: query,
    })

    // Retrieve products with pagination
    const products = await prisma.product.findMany({
      skip,
      take: limit,
      where: query,
      orderBy: {
        [sort]: order,
      },
      // Select all fields except deletedAt to exclude it from the response payload
      select: {
        ...Object.fromEntries(Object.keys(prisma.product.fields).map((field) => [field, true])),
        deletedAt: false,
      },
    })

    const totalPages = Math.ceil(totalCount / limit)

    return responseHandler({
      status: 200,
      results: {
        products,
        ...responsePaginationHandler({
          page,
          totalPages,
          totalCount,
        }),
      },
    })
  } catch (error) {
    console.error("Error retrieving products: ", error)
    return responseHandler({
      status: 500,
      message: "Error retrieving products",
      error: (error as Error).message,
      stack: (error as Error).stack,
    })
  }
}
