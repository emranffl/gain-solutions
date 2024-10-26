const { execSync } = require("child_process")

try {
  console.log("Running the database seeder file...")
  execSync("pnpm run db-seed", { stdio: "inherit" })
} catch (error) {
  console.error(error)
  process.exit(1)
}
