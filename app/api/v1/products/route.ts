import { Prisma, ProductCategory } from "@prisma/client"
import { prisma } from "@prisma/prisma-instance"
import { paginationHandler } from "@utils/pagination-handler"
import { responseHandler } from "@utils/response-handler"
import { responsePaginationHandler } from "@utils/response-pagination-handler"
import { NextRequest } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const { skip, limit, page } = paginationHandler(req)
    const sort = searchParams.get("sort") || "createdAt"
    const order = searchParams.get("order") || "desc"
    const searchQuery = searchParams.get("q")
    const minPrice = searchParams.get("minPrice")
    const min = minPrice ? Number(minPrice) : undefined
    const maxPrice = searchParams.get("maxPrice")
    const max = maxPrice ? Number(maxPrice) : undefined
    const price = searchParams.get("price")
    const query: Prisma.ProductWhereInput = {
      deletedAt: null, // Exclude soft-deleted products
      name: {
        contains: searchQuery || undefined, // Filter products by query term
      },
      description: {
        contains: searchQuery || undefined, // Filter products by query term
      },
      category: {
        equals: (searchParams.get("category") as ProductCategory) || undefined,
      },
      price:
        min && max // Filter products by price range
          ? {
              gte: min,
              lte: max,
            }
          : min // Filter products by minimum price
            ? {
                gte: min,
              }
            : max // Filter products by maximum price
              ? {
                  lte: max,
                }
              : price // Filter products by exact price
                ? {
                    equals: Number(price),
                  }
                : undefined,
    }

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

    // Retrieve the total count of products for pagination
    const totalCount = await prisma.product.count({
      where: query,
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
