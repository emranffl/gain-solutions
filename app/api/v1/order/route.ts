import { NextRequest } from "next/server"
import { createOrder } from "./CreateOrder"
import { cancelOrder } from "./DeleteOrder"

export async function POST(req: NextRequest) {
  return await createOrder(req)
}

export async function PUT(req: NextRequest) {}

export async function DELETE(req: NextRequest) {
  return await cancelOrder(req)
}
