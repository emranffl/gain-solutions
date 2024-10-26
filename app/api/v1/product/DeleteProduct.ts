import { prisma } from "@prisma/prisma-instance"
import { responseHandler } from "@utils/response-handler"
import { parseUserInfo } from "@utils/user-info"
import { NextRequest, NextResponse } from "next/server"

export const deleteProduct = async (req: NextRequest) => {
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
        message: "Product ID is required",
      })
    }

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: parseInt(id) },
    })

    if (!existingProduct) {
      return responseHandler({
        status: 404,
        error: "Not Found",
        message: "Product not found",
      })
    }

    // Soft delete by updating deletedAt field
    const deletedProduct = await prisma.product.update({
      where: {
        id: parseInt(id),
      },
      data: {
        deletedAt: new Date(),
      },
    })

    return responseHandler({
      status: 200,
      results: deletedProduct,
      message: "Product deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting product: ", error)
    return responseHandler({
      status: 500,
      error: "Internal Server Error",
      message: (error as Error).message,
      stack: (error as Error).stack,
    })
  }
}
