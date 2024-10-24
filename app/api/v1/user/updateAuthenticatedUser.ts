import { prisma } from "@prisma/prisma-instance"
import { responseHandler } from "@utils/response-handler"
import { parseUserInfo } from "@utils/user-info"
import { hash } from "bcrypt"
import { NextRequest, NextResponse } from "next/server"

export const updateAuthenticatedUser = async (req: NextRequest) => {
  try {
    const user = await parseUserInfo(req)

    if (user instanceof NextResponse) {
      return user
    }

    const { name, email, password: pass } = await req.json()

    // Update the user
    const updatedUser = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        name: name || user.name,
        email: email || user.email,
        password: pass ? await hash(pass, 10) : undefined,
      },
    })

    // Return the user without the password
    const { password, ...rest } = updatedUser
    return responseHandler({
      status: 200,
      results: updatedUser || rest,
    })
  } catch (error) {
    console.error("Error updating user: ", error)

    return responseHandler({
      status: 500,
      error: "Internal Server Error",
      message: (error as Error).message,
      stack: (error as Error).stack,
    })
  }
}
