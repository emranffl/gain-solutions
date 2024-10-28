// import { prisma } from "@prisma/prisma-instance"
// import { paginationHandler } from "@utils/pagination-handler"
// import { responseHandler } from "@utils/response-handler"
// import { responsePaginationHandler } from "@utils/response-pagination-handler"
// import { NextRequest } from "next/server"

// export const maxDuration = 50
// export async function GET(request: NextRequest) {
//   const { skip, limit, page } = paginationHandler(request)

//   try {
//     // Query to get total sales per product category, filtering for delivered orders
//     const salesPerCategory = await prisma.orderItem.groupBy({
//       by: ["productId"],
//       _sum: {
//         totalPrice: true,
//       },
//       where: {
//         order: {
//           status: {
//             in: ["SHIPPED", "DELIVERED"],
//           },
//         },
//       },
//     })

//     // Map product IDs to their respective categories and aggregate total sales per category
//     const categorySalesMap = new Map<string, number>()

//     for (const sale of salesPerCategory) {
//       const product = await prisma.product.findUnique({
//         where: { id: sale.productId },
//         select: { category: true },
//       })

//       if (product?.category) {
//         const existingSales = categorySalesMap.get(product.category) || 0
//         categorySalesMap.set(product.category, existingSales + (Number(sale._sum.totalPrice) || 0))
//       }
//     }

//     // Convert the map to an array of category sales
//     const categorySales = Array.from(categorySalesMap, ([category, totalSales]) => ({
//       category,
//       totalSales: totalSales.toFixed(2),
//     }))

//     // Apply pagination to the aggregated results
//     const paginatedCategorySales = categorySales.slice(skip, skip + limit)
//     const totalCount = categorySales.length
//     const totalPages = Math.ceil(totalCount / limit)

//     return responseHandler({
//       status: 200,
//       results: {
//         salesPerCategory: paginatedCategorySales,
//         ...responsePaginationHandler({
//           page,
//           totalPages,
//           totalCount,
//         }),
//       },
//     })
//   } catch (error) {
//     console.error("Error retrieving total sales per category: ", error)
//     return responseHandler({
//       status: 500,
//       message: "Error retrieving total sales per category",
//       error: (error as Error).message,
//       stack: (error as Error).stack,
//     })
//   }
// }

import { prisma } from "@prisma/prisma-instance"
import { paginationHandler } from "@utils/pagination-handler"
import { responseHandler } from "@utils/response-handler"
import { responsePaginationHandler } from "@utils/response-pagination-handler"
import { NextRequest } from "next/server"

export const maxDuration = 50
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const { skip, limit, page } = paginationHandler(request)
  const sort = searchParams.get("sort") || "totalSales" // Default sort by totalSales
  const order = searchParams.get("order") === "asc" ? "asc" : "desc" // Default to DESC

  try {
    // Raw SQL query to aggregate total sales per product category
    const salesPerCategory = (await prisma.$queryRaw`
      SELECT p.category, SUM(oi."totalPrice") AS "totalSales"
      FROM "OrderItem" oi
      JOIN "Product" p ON oi."productId" = p.id
      JOIN "Order" o ON oi."orderId" = o.id
      WHERE o.status IN ('SHIPPED', 'DELIVERED')
      GROUP BY p.category
      OFFSET ${skip}
      LIMIT ${limit}
    `) as any[]

    // Convert the results to match the desired format
    const categorySales = salesPerCategory
      .map((item: any) => ({
        category: item.category,
        totalSales: Number(item.totalSales).toFixed(2),
      }))
      .sort((a, b) => {
        if (sort === "totalSales") {
          return order === "asc"
            ? Number(a.totalSales) - Number(b.totalSales)
            : Number(b.totalSales) - Number(a.totalSales)
        } else {
          return order === "desc"
            ? a.category.localeCompare(b.category)
            : b.category.localeCompare(a.category)
        }
      })

    // Get the total count for pagination
    const totalCountResult: any = await prisma.$queryRaw`
      SELECT COUNT(DISTINCT p.category)
      FROM "OrderItem" oi
      JOIN "Product" p ON oi."productId" = p.id
      JOIN "Order" o ON oi."orderId" = o.id
      WHERE o.status IN ('SHIPPED', 'DELIVERED')
    `
    const totalCount = Number(totalCountResult[0].count || 0)
    const totalPages = Math.ceil(totalCount / limit)

    return responseHandler({
      status: 200,
      results: {
        salesPerCategory: categorySales,
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
