import { prisma } from "@prisma/prisma-instance"
import { responseHandler } from "@utils/response-handler"
import { compare } from "bcrypt"
import { SignJWT } from "jose"
import { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { email, password: pass } = await req.json()

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email },
    })

    // If the user is not found or the password is incorrect, return an error
    if (!user || !(await compare(pass, user.password))) {
      return responseHandler({
        status: 400,
        error: "Bad Request",
        message: "Invalid email or password",
      })
    }

    // Generate a JWT token using jose
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET)
    const token =
      "Bearer " +
      (await new SignJWT({ id: user.id.toString(), email: user.email })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setIssuer(process.env.NEXT_PUBLIC_SITE_URL!)
        .setExpirationTime("72h")
        .setSubject(String(req.headers.get("host")))
        .setAudience(String(req.headers.get("user-agent")))
        .sign(secret))

    // Return the token and user details
    const { password, ...rest } = user
    return responseHandler({
      status: 200,
      results: { token, user: rest },
    })
  } catch (error) {
    console.error("Error signing in: ", error)

    return responseHandler({
      status: 500,
      error: "Internal Server Error",
      message: (error as Error).message,
      stack: (error as Error).stack,
    })
  }
}
