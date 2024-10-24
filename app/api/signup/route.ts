import { prisma } from "@prisma/prisma-instance"
import { responseHandler } from "@utils/response-handler"
import { hash } from "bcrypt"
import { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { name, email, password: pass } = await req.json()

    if (!name || !email || !pass) {
      return responseHandler({
        status: 400,
        error: "Bad Request",
        message: "Missing required fields",
      })
    }

    // Check if the user already exists
    const userExists = await prisma.user.findUnique({
      where: { email },
    })

    if (userExists) {
      return responseHandler({
        status: 400,
        error: "Bad Request",
        message: "User already exists",
      })
    }

    // Hash the password
    const hashedPassword = await hash(pass, 10)

    // Create the user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    })

    // Return the user without the password
    const { password, ...rest } = user
    return responseHandler({
      status: 201,
      results: rest,
    })
  } catch (error) {
    console.error("Error creating user: ", error)

    return responseHandler({
      status: 500,
      error: "Internal Server Error",
      message: (error as Error).message,
      stack: (error as Error).stack,
    })
  }
}
