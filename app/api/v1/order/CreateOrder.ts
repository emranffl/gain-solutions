import { OrderStatus } from "@prisma/client"
import { prisma } from "@prisma/prisma-instance"
import { responseHandler } from "@utils/response-handler"
import { parseUserInfo } from "@utils/user-info"
import { NextRequest, NextResponse } from "next/server"

export const createOrder = async (req: NextRequest) => {
  try {
    // Get authenticated user
    const user = await parseUserInfo(req)
    if (user instanceof NextResponse) {
      return user
    }

    const { items } = await req.json()

    if (!items?.length) {
      return responseHandler({
        status: 400,
        error: "Bad Request",
        message: "Order must contain at least one item",
      })
    }

    // Start a transaction to ensure data consistency
    const order = await prisma.$transaction(async (tx) => {
      // Verify all products exist and have sufficient stock
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: {
            id: Number(item.productId),
            deletedAt: null,
          },
        })

        if (!product) {
          throw new Error(`Product with ID ${item.productId} not found`)
        }

        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for product ${product.name}`)
        }
      }

      // Calculate total amount and create order items
      const orderItems = await Promise.all(
        items.map(async (item: { productId: number | bigint; quantity: number | bigint }) => {
          const product = await tx.product.findUnique({
            where: { id: Number(item.productId) },
          })

          const unitPrice = product!.price
          const totalPrice = Number(unitPrice) * Number(item.quantity)

          // Update product stock
          await tx.product.update({
            where: { id: Number(item.productId) },
            data: {
              stock: { decrement: Number(item.quantity) },
              updatedAt: new Date(),
            },
          })

          return {
            productId: Number(item.productId),
            quantity: item.quantity,
            unitPrice,
            totalPrice,
          }
        })
      )

      const totalAmount = orderItems.reduce((sum, item) => sum + item.totalPrice, Number(0))

      // Create the order with its items
      return await tx.order.create({
        data: {
          userId: user.id,
          status: OrderStatus.PENDING,
          totalAmount,
          items: {
            create: orderItems,
          },
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
      status: 201,
      results: order,
      message: "Order created successfully",
    })
  } catch (error) {
    console.error("Error creating order: ", error)

    return responseHandler({
      status: 500,
      error: "Internal Server Error",
      message: (error as Error).message,
      stack: (error as Error).stack,
    })
  }
}
