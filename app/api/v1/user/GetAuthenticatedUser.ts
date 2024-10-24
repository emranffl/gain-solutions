import { responseHandler } from "@utils/response-handler"
import { parseUserInfo } from "@utils/user-info"
import { NextRequest, NextResponse } from "next/server"

export const getAuthenticatedUser = async (req: NextRequest) => {
  try {
    const user = await parseUserInfo(req)

    if (user instanceof NextResponse) {
      return user
    }

    return responseHandler({
      results: user,
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
