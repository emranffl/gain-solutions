// app/api/sales-per-category/route.ts
import { prisma } from "@prisma/prisma-instance"
import { paginationHandler } from "@utils/pagination-handler"
import { responseHandler } from "@utils/response-handler"
import { responsePaginationHandler } from "@utils/response-pagination-handler"
import { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const { skip, limit, page } = paginationHandler(request)

  try {
    // Query to get total sales per product category, filtering for delivered orders
    const salesPerCategory = await prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: {
        totalPrice: true,
      },
      where: {
        order: {
          status: "DELIVERED",
        },
      },
    })

    // Map product IDs to their respective categories and aggregate total sales per category
    const categorySalesMap = new Map<string, number>()

    for (const sale of salesPerCategory) {
      const product = await prisma.product.findUnique({
        where: { id: sale.productId },
        select: { category: true },
      })

      if (product?.category) {
        const existingSales = categorySalesMap.get(product.category) || 0
        categorySalesMap.set(product.category, existingSales + (Number(sale._sum.totalPrice) || 0))
      }
    }

    // Convert the map to an array of category sales
    const categorySales = Array.from(categorySalesMap, ([category, totalSales]) => ({
      category,
      totalSales,
    }))

    // Apply pagination to the aggregated results
    const paginatedCategorySales = categorySales.slice(skip, skip + limit)
    const totalCount = categorySales.length
    const totalPages = Math.ceil(totalCount / limit)

    return responseHandler({
      status: 200,
      results: {
        salesPerCategory: paginatedCategorySales,
        ...responsePaginationHandler({
          page,
          totalPages,
          totalCount,
        }),
      },
    })
  } catch (error) {
    console.error("Error retrieving total sales per category: ", error)
    return responseHandler({
      status: 500,
      message: "Error retrieving total sales per category",
      error: (error as Error).message,
      stack: (error as Error).stack,
    })
  }
}
