import hd from "humanize-duration"
import { performance } from "perf_hooks"

const prettyElapsedTime = (elapsedMs: Parameters<typeof hd>[0]) =>
  hd(elapsedMs, { largest: 2, round: true, units: ["h", "m", "s", "ms"] })

/**
 * Logs the time taken for an operation to complete.
 */
export async function logExecutionTime<T>(name: string, operation: () => Promise<T>): Promise<T> {
  const start = performance.now()
  try {
    const result = await operation()
    const elapsed = performance.now() - start
    console.log(`[${name}] completed in ${prettyElapsedTime(elapsed)}`)
    return result
  } catch (error) {
    const elapsed = performance.now() - start
    console.error(`[${name}] failed after ${prettyElapsedTime(elapsed)}:`, error)
    throw error
  }
}

/**
 * Logs the time taken for multiple operations to complete in parallel.
 */
export async function timeParallelOperations<T>(
  operations: { name: string; operation: () => Promise<T> }[]
): Promise<T[]> {
  const startTime = performance.now()

  const results = await Promise.all(
    operations.map(async ({ name, operation }) => {
      const opStart = performance.now()
      try {
        const result = await operation()
        const opElapsed = performance.now() - opStart
        console.log(`[${name}] completed in ${prettyElapsedTime(opElapsed)}`)
        return result
      } catch (error) {
        const opElapsed = performance.now() - opStart
        console.error(`[${name}] failed after ${prettyElapsedTime(opElapsed)}:`, error)
        throw error
      }
    })
  )

  const totalTime = performance.now() - startTime
  console.log(`All operations completed in ${prettyElapsedTime(totalTime)}`)

  return results
}
