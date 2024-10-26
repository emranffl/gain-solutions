const { execSync } = require("child_process")

try {
  console.log("Running the database seeder file...")
  execSync('ts-node --compiler-options \'{"module":"CommonJS"}\' prisma/seed.ts', { stdio: "inherit" })
} catch (error) {
  console.error(error)
  process.exit(1)
}
