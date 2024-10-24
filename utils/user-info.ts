import { prisma } from "@prisma/prisma-instance"
import { NextRequest } from "next/server"
import { responseHandler } from "./response-handler"

export const USER_INFO_HEADER_KEY_NAME = "x-user-id"

/**
 *  Function to get user info from the header set by `middleware`
 */
export const parseUserInfo = async (request: NextRequest) => {
  const id = request.headers.get(USER_INFO_HEADER_KEY_NAME)
  if (!id) {
    return responseHandler({
      status: 401,
      error: "Unauthorized",
      message: "Invalid or malformed token",
    })
  }

  const user = await prisma.user.findUnique({
    where: {
      id: BigInt(id),
    },
  })

  if (!user) {
    return responseHandler({
      status: 404,
      error: "Not Found",
      message: "User not found",
    })
  }

  const { password, ...rest } = user
  return rest
}
