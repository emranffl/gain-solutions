import { PrismaClient } from "@prisma/client"
import { main } from "./seeder/main"
import { truncateTables } from "./seeder/truncate"

const prisma = new PrismaClient()

truncateTables()
  .then(() => main(10).catch((e) => console.error("Error seeding: ", e)))
  .then(() => console.log("Seeding complete."))
  .catch((e) => console.error("Error truncating tables: ", e))
  .finally(async () => {
    await prisma.$disconnect()
  })
