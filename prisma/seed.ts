import { PrismaClient } from "@prisma/client"
import { main } from "./seeder/main"
import { truncateTables } from "./seeder/truncate"

const prisma = new PrismaClient()

// Function to parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2)
  const options: { count: number; truncate: boolean } = { count: 100_000, truncate: false }

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--count" && args[i + 1]) {
      options.count = parseInt(args[i + 1], 10)
      i++
    } else if (args[i] === "-t") {
      options.truncate = true
    }
  }

  return options
}

async function run() {
  const { count, truncate } = parseArgs()

  try {
    if (truncate) {
      console.log("Truncating tables...")
      await truncateTables()
    }

    console.log(`Seeding with count: ${count}`)
    await main(count)
    console.log("Seeding complete.")
  } catch (e) {
    console.error("Error during seeding process: ", e)
  } finally {
    await prisma.$disconnect()
  }
}

run()
