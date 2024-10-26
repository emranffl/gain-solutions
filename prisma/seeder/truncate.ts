import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

export const truncateTables = async () => {
  try {
    // Disable foreign key checks and truncate in correct order
    await prisma.$transaction([
      // Raw SQL to disable foreign key checks temporarily
      prisma.$executeRaw`SET CONSTRAINTS ALL DEFERRED;`,

      // Truncate tables in order (child to parent)
      prisma.$executeRaw`TRUNCATE TABLE "OrderItem" CASCADE;`,
      prisma.$executeRaw`TRUNCATE TABLE "Order" CASCADE;`,
      prisma.$executeRaw`TRUNCATE TABLE "Product" CASCADE;`,
      prisma.$executeRaw`TRUNCATE TABLE "User" CASCADE;`,

      // Reset sequences
      prisma.$executeRaw`ALTER SEQUENCE "OrderItem_id_seq" RESTART WITH 1;`,
      prisma.$executeRaw`ALTER SEQUENCE "Order_id_seq" RESTART WITH 1;`,
      prisma.$executeRaw`ALTER SEQUENCE "Product_id_seq" RESTART WITH 1;`,
      prisma.$executeRaw`ALTER SEQUENCE "User_id_seq" RESTART WITH 1;`,

      // Re-enable foreign key checks
      prisma.$executeRaw`SET CONSTRAINTS ALL IMMEDIATE;`,
    ])

    console.log("All tables truncated successfully")
    return true
  } catch (error) {
    console.error("Error truncating tables:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}
