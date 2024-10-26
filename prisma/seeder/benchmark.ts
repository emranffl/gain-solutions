import { PrismaClient } from "@prisma/client"
import { prettyElapsedTime } from "../../utils/time-log"
import { prisma } from "../prisma-instance"
import { BatchSeeder } from "./main"

interface BenchmarkConfig {
  recordCounts: number[]
  parallelBatchCounts: number[]
  batchSizes: number[]
  runsPerConfig: number
}

interface BenchmarkResult {
  recordCount: number
  parallelBatches: number
  batchSize: number
  durationMs: number
  recordsPerSecond: number
  peakMemoryMB: number
  errors: string[]
}

class SeedingBenchmark {
  private results: BenchmarkResult[] = []
  private prisma: PrismaClient

  constructor() {
    this.prisma = prisma
  }

  private async cleanDatabase() {
    // Clear existing data
    await this.prisma.orderItem.deleteMany({})
    await this.prisma.order.deleteMany({})
    await this.prisma.product.deleteMany({})
    await this.prisma.user.deleteMany({})
  }

  private getMemoryUsage(): number {
    const used = process.memoryUsage()
    return Math.round(used.heapUsed / 1024 / 1024) // Convert to MB
  }

  async runBenchmark(config: BenchmarkConfig) {
    console.log("Starting benchmark with configurations:", config)

    for (const recordCount of config.recordCounts) {
      for (const parallelBatches of config.parallelBatchCounts) {
        for (const batchSize of config.batchSizes) {
          const result: BenchmarkResult = {
            recordCount,
            parallelBatches,
            batchSize,
            durationMs: 0,
            recordsPerSecond: 0,
            peakMemoryMB: 0,
            errors: [],
          }

          console.log(`\nTesting configuration:`)
          console.log(
            `Records: ${recordCount}, Parallel Batches: ${parallelBatches}, Batch Size: ${batchSize}`
          )

          // Run multiple times for each configuration
          const durations: number[] = []
          const memoryPeaks: number[] = []

          for (let run = 1; run <= config.runsPerConfig; run++) {
            try {
              // Clean database before each run
              await this.cleanDatabase()

              const startMemory = this.getMemoryUsage()
              let peakMemory = startMemory

              // Create seeder instance with current configuration
              const seeder = new BatchSeeder({ parallelBatches, batchSize })
              const startTime = Date.now()

              // Monitor memory during seeding
              const memoryMonitor = setInterval(() => {
                const currentMemory = this.getMemoryUsage()
                if (currentMemory > peakMemory) {
                  peakMemory = currentMemory
                }
              }, 100)

              // Run seeding
              await seeder.seed(recordCount)

              clearInterval(memoryMonitor)

              const duration = Date.now() - startTime
              durations.push(duration)
              memoryPeaks.push(peakMemory)

              console.log(
                `  Run ${run}/${config.runsPerConfig}: ${prettyElapsedTime(duration)} (${Math.round(recordCount / (duration / 1000))} records/sec)`
              )
            } catch (error) {
              result.errors.push(`Run ${run}: ${(error as Error).message}`)
              console.error(`  Run ${run} failed:`, error)
            }
          }

          // Calculate averages if we have successful runs
          if (durations.length > 0) {
            // Remove outliers (optional)
            const sortedDurations = [...durations].sort((a, b) => a - b)
            const validDurations = sortedDurations.slice(1, -1) // Remove fastest and slowest

            result.durationMs = Math.round(validDurations.reduce((a, b) => a + b, 0) / validDurations.length)
            result.recordsPerSecond = Math.round(recordCount / (result.durationMs / 1000))
            result.peakMemoryMB = Math.round(memoryPeaks.reduce((a, b) => Math.max(a, b), 0))
          }

          this.results.push(result)
          this.printResult(result)
        }
      }
    }

    this.summarizeResults()
  }

  private printResult(result: BenchmarkResult) {
    console.log("\nResults for configuration:")
    console.log(`Records: ${result.recordCount}`)
    console.log(`Parallel Batches: ${result.parallelBatches}`)
    console.log(`Batch Size: ${result.batchSize}`)
    console.log(`Average Duration: ${prettyElapsedTime(result.durationMs)}`)
    console.log(`Records/second: ${result.recordsPerSecond}`)
    console.log(`Peak Memory Usage: ${result.peakMemoryMB}MB`)
    if (result.errors.length > 0) {
      console.log("Errors encountered:", result.errors)
    }
  }

  private summarizeResults() {
    console.log("\n=== BENCHMARK SUMMARY ===")

    // Sort results by records/second
    const sortedResults = [...this.results].sort((a, b) => b.recordsPerSecond - a.recordsPerSecond)
    const len = 3
    console.log(`\nTop ${len} Fastest Configurations:`)
    sortedResults.slice(0, len).forEach((result, index) => {
      console.log(`\n${index + 1}. Performance Metrics:`)
      console.log(`   📊 Records/second: ${result.recordsPerSecond}`)
      console.log(`   Configuration:`)
      console.log(`   - Parallel Batches: ${result.parallelBatches}`)
      console.log(`   - Batch Size: ${result.batchSize}`)
      console.log(`   - Memory Usage: ${result.peakMemoryMB}MB`)
    })

    // Sort by memory usage
    const memoryResults = [...this.results].sort((a, b) => a.peakMemoryMB - b.peakMemoryMB)

    console.log("\nMost Memory Efficient Configurations:")
    memoryResults.slice(0, len).forEach((result, index) => {
      console.log(`\n${index + 1}. Memory Usage: ${result.peakMemoryMB}MB`)
      console.log(`   Configuration:`)
      console.log(`   - Parallel Batches: ${result.parallelBatches}`)
      console.log(`   - Batch Size: ${result.batchSize}`)
      console.log(`   - 📊 Records/second: ${result.recordsPerSecond}`)
    })

    // Suggest the best configuration based on the results
    const bestResult = sortedResults[0]
    console.log("\nSuggested Best Configuration:")
    console.log(`\nRecords/second: ${bestResult.recordsPerSecond}`)
    console.log(`Configuration:`)
    console.log(`- Records: ${bestResult.recordCount}`)
    console.log(`- Parallel Batches: ${bestResult.parallelBatches}`)
    console.log(`- Batch Size: ${bestResult.batchSize}`)
    console.log(`- Memory Usage: ${bestResult.peakMemoryMB}MB`)

    console.log("\n=== END OF SUMMARY ===")
  }
}

export const main = async () => {
  console.log("Starting benchmark...")

  const benchmark = new SeedingBenchmark()
  await benchmark.runBenchmark({
    recordCounts: [100], // Start with a smaller number for testing
    parallelBatchCounts: [3, 5, 7], // Test different parallel batch counts
    batchSizes: [5, 10, 100], // Test different batch sizes
    runsPerConfig: 3, // Number of runs per configuration to get average
  })
}

if (require.main === module) {
  main().catch(console.error)
}
