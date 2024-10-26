import { prisma } from "@prisma/prisma-instance"
import { paginationHandler } from "@utils/pagination-handler"
import { responseHandler } from "@utils/response-handler"
import { responsePaginationHandler } from "@utils/response-pagination-handler"
import { parseUserInfo } from "@utils/user-info"
import { NextRequest, NextResponse } from "next/server"

export const getAuthenticatedUser = async (req: NextRequest) => {
  try {
    // Get authenticated user
    const user = await parseUserInfo(req)
    if (user instanceof NextResponse) {
      return user
    }

    const searchParams = req.nextUrl.searchParams
    const { skip, limit, page } = paginationHandler(req)
    const sort = searchParams.get("sort") || "createdAt"
    const order = searchParams.get("order") || "desc"

    // Retrieve orders with pagination
    const orders = await prisma.order.findMany({
      skip,
      take: limit,
      where: {
        userId: user.id,
      },
      orderBy: {
        [sort]: order,
      },
    })

    // Retrieve the total count of orders for pagination
    const totalCount = await prisma.order.count({
      where: {
        userId: user.id,
      },
    })

    const totalPages = Math.ceil(totalCount / limit)

    return responseHandler({
      status: 200,
      results: {
        ...user,
        orders,
        ...responsePaginationHandler({
          page,
          totalPages,
          totalCount,
        }),
      },
    })
  } catch (error) {
    console.error("Error retrieving user: ", error)
    return responseHandler({
      status: 500,
      error: "Internal Server Error",
      message: (error as Error).message,
      stack: (error as Error).stack,
    })
  }
}
