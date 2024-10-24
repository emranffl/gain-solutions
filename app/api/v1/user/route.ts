import { NextRequest } from "next/server"
import { getAuthenticatedUser } from "./GetAuthenticatedUser"
import { updateAuthenticatedUser } from "./UpdateAuthenticatedUser"

export async function GET(req: NextRequest) {
  return await getAuthenticatedUser(req)
}

export async function POST(req: NextRequest) {
  return await updateAuthenticatedUser(req)
}
