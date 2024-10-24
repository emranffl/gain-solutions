import { OrderStatus } from "@prisma/client"
import { prisma } from "@prisma/prisma-instance"
import { responseHandler } from "@utils/response-handler"
import { parseUserInfo } from "@utils/user-info"
import { NextRequest, NextResponse } from "next/server"

export const cancelOrder = async (req: NextRequest) => {
  try {
    // Get authenticated user
    const user = await parseUserInfo(req)
    if (user instanceof NextResponse) {
      return user
    }

    const { id } = await req.json()

    if (!id) {
      return responseHandler({
        status: 400,
        error: "Bad Request",
        message: "Order ID is required",
      })
    }

    // Start a transaction
    const canceledOrder = await prisma.$transaction(async (tx) => {
      // Find the order and verify it belongs to the user
      const existingOrder = await tx.order.findUnique({
        where: {
          id: Number(id),
          userId: user.id,
        },
        include: {
          items: true,
        },
      })

      if (!existingOrder) {
        throw new Error("Order not found")
      }

      if (existingOrder.status === OrderStatus.CANCELED) {
        throw new Error("Order is already cancelled")
      }

      // @ts-expect-error
      if ([OrderStatus.SHIPPED, OrderStatus.DELIVERED].includes(existingOrder.status)) {
        throw new Error("Cannot cancel order that has been shipped or delivered")
      }

      // Restore product stock for each item
      await Promise.all(
        existingOrder.items.map((item) =>
          tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { increment: item.quantity },
              updatedAt: new Date(),
            },
          })
        )
      )

      // Update order status
      return await tx.order.update({
        where: { id: Number(id) },
        data: {
          status: OrderStatus.CANCELED,
          canceledAt: new Date(),
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      })
    })

    return responseHandler({
      status: 200,
      results: canceledOrder,
      message: "Order cancelled successfully",
    })
  } catch (error) {
    console.error("Error cancelling order: ", error)
    return responseHandler({
      status: 500,
      error: "Internal Server Error",
      message: (error as Error).message,
      stack: (error as Error).stack,
    })
  }
}
