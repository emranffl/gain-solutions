import { responseHandler } from "@utils/response-handler"
import { USER_INFO_HEADER_KEY_NAME } from "@utils/user-info"
import { jwtVerify } from "jose"
import { NextRequest, NextResponse } from "next/server"

export async function middleware(req: NextRequest) {
  const token = req.headers.get("authorization")?.split(" ")[1]

  if (!token) {
    return responseHandler({
      status: 403,
      error: "Forbidden",
      message: "Invalid or missing token",
    })
  }

  try {
    // Verify the JWT using the `jose` library
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET)
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
      issuer: process.env.NEXT_PUBLIC_SITE_URL,
      subject: String(req.headers.get("host")),
      audience: String(req.headers.get("user-agent")),
    })

    // If verification is successful, continue to the next middleware or the route handler
    return NextResponse.next({ headers: { [USER_INFO_HEADER_KEY_NAME]: payload.id as string } })
  } catch (error) {
    console.error("Error verifying token: ", error)

    return responseHandler({
      status: 401,
      error: "Unauthorized",
      message: (error as Error).message,
      stack: (error as Error).stack,
    })
  }
}

// Apply the middleware to protected API routes
export const config = {
  matcher: "/api/v1/:path*",
}
