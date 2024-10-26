import { prisma } from "@prisma/prisma-instance"
import { paginationHandler } from "@utils/pagination-handler"
import { responseHandler } from "@utils/response-handler"
import { responsePaginationHandler } from "@utils/response-pagination-handler"
import { NextRequest } from "next/server"

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const { skip, limit, page } = paginationHandler(req)
  const sort = searchParams.get("sort") || "totalOrders"
  const order = (searchParams.get("order") || "desc") as "asc" | "desc"

  try {
    // Query to get top-ranking users by order count and total amount spent
    const topUsers = await prisma.user.findMany({
      skip,
      take: limit,
      where: {
        orders: {
          some: {
            canceledAt: null, // Exclude canceled orders
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        _count: {
          select: { orders: true },
        },
        orders: {
          where: {
            canceledAt: null, // Exclude canceled orders
          },
          select: {
            totalAmount: true,
          },
        },
      },
      // Sort the users by the specified field and order if it exists in the user model
      ...(Object.keys(prisma.user.fields).includes(sort)
        ? {
            orderBy: {
              [sort]: order,
            },
          }
        : {}),
    })

    // Calculate total spent and total orders for each user
    const customSortedTopRankingUsers = topUsers
      .map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        totalOrders: user._count.orders,
        totalSpent: user.orders.reduce((sum, order) => sum + Number(order.totalAmount), 0).toFixed(2),
      }))
      // Sort the users by the specified field and order if the field is not in the user model (totalOrders & totalSpent)
      .sort((a, b) =>
        order === "asc"
          ? Number(a[sort as keyof typeof a] || a.totalOrders) -
            Number(b[sort as keyof typeof b] || b.totalOrders)
          : Number(b[sort as keyof typeof b] || b.totalOrders) -
            Number(a[sort as keyof typeof a] || a.totalOrders)
      )

    // Get the total count of users with at least one non-canceled order
    const totalCount = await prisma.user.count({
      where: {
        orders: {
          some: {
            canceledAt: null,
          },
        },
      },
    })

    const totalPages = Math.ceil(totalCount / limit)

    return responseHandler({
      status: 200,
      results: {
        topRankingUsers: customSortedTopRankingUsers,
        ...responsePaginationHandler({
          page,
          totalPages,
          totalCount,
        }),
      },
    })
  } catch (error) {
    console.error("Error retrieving top-ranking users: ", error)
    return responseHandler({
      status: 500,
      message: "Error retrieving top-ranking users",
      error: (error as Error).message,
      stack: (error as Error).stack,
    })
  }
}
