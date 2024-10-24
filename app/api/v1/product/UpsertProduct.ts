import { ProductCategory } from "@prisma/client"
import { prisma } from "@prisma/prisma-instance"
import { responseHandler } from "@utils/response-handler"
import { parseUserInfo } from "@utils/user-info"
import { NextRequest, NextResponse } from "next/server"

export const upsertProduct = async (req: NextRequest) => {
  try {
    // Get authenticated user
    const user = await parseUserInfo(req)
    if (user instanceof NextResponse) {
      return user
    }

    const { id, name, description, price, stock, category } = await req.json()

    // + If no ID is provided, create a new product
    if (!id) {
      const newProduct = await prisma.product.create({
        data: {
          name,
          description,
          price,
          stock,
          category: ProductCategory[category as keyof typeof ProductCategory],
        },
      })

      return responseHandler({
        status: 201, // Created
        results: newProduct,
      })
    }

    // + If ID exists, update the product
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

    const updatedProduct = await prisma.product.update({
      where: {
        id: parseInt(id),
      },
      data: {
        name: name || existingProduct.name,
        description: description || existingProduct.description,
        price: price || existingProduct.price,
        stock: stock || existingProduct.stock,
        category: category || existingProduct.category,
        updatedAt: new Date(),
      },
    })

    return responseHandler({
      status: 200,
      results: updatedProduct,
    })
  } catch (error) {
    console.error("Error handling product: ", error)
    return responseHandler({
      status: 500,
      error: "Internal Server Error",
      message: (error as Error).message,
      stack: (error as Error).stack,
    })
  }
}
