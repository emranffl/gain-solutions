import { NextRequest } from "next/server"
import { deleteProduct } from "./DeleteProduct"
import { upsertProduct } from "./UpsertProduct"

export async function POST(req: NextRequest) {
  return await upsertProduct(req)
}

export async function PUT(req: NextRequest) {}

export async function DELETE(req: NextRequest) {
  return await deleteProduct(req)
}
