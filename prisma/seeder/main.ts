import { faker } from "@faker-js/faker"
import { OrderStatus, PrismaClient, ProductCategory } from "@prisma/client"
import { hash } from "bcrypt"
import { prettyElapsedTime } from "../../utils/time-log"
import { prisma } from "../prisma-instance"

interface BatchProgress {
  total: number
  current: number
  operation: string
}

export class BatchSeeder {
  // Configuration
  private DEFAULT_COUNT = 1000
  private BATCH_SIZE
  private PARALLEL_BATCHES
  private prisma: PrismaClient
  private progress: BatchProgress = { total: 0, current: 0, operation: "" }

  constructor({ parallelBatches, batchSize }: { parallelBatches: number; batchSize: number }) {
    this.prisma = prisma
    this.BATCH_SIZE = batchSize
    this.PARALLEL_BATCHES = parallelBatches
  }

  private updateProgress(increment: number) {
    this.progress.current += increment
    const percentage = ((this.progress.current / this.progress.total) * 100).toFixed(2)
    process.stdout.write(
      `\r${this.progress.operation}: ${percentage}% (${this.progress.current}/${this.progress.total})`
    )
  }

  private async generateUserBatch(size: number, isFirstBatch: boolean = false) {
    const staticUser = isFirstBatch
      ? [
          {
            name: "Alice",
            email: "alice@gmail.com",
            password: await hash("alice1234", 10),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]
      : []

    const passwords = await Promise.all(
      Array(size)
        .fill(0)
        .map(() => hash(faker.internet.password(), 10))
    )

    const users = Array(size)
      .fill(0)
      .map((_, i) => {
        const recentDate = faker.date.recent()
        return {
          name: faker.person.fullName(),
          email: faker.internet.email().toLocaleLowerCase(),
          password: passwords[i],
          createdAt: recentDate,
          updatedAt: recentDate,
        }
      })

    return [...staticUser, ...users]
  }

  private generateProductBatch(size: number) {
    return Array(size)
      .fill(0)
      .map(() => ({
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        price: parseFloat(faker.commerce.price({ dec: 2, min: 100, max: 1_00_000 })),
        stock: faker.number.int({ min: 1, max: 100 }),
        category: faker.helpers.arrayElement(Object.values(ProductCategory)),
      }))
  }

  private async processBatch(batchIndex: number, batchSize: number, totalRecords: number) {
    const isFirstBatch = batchIndex === 0
    const currentBatchSize = Math.min(batchSize, totalRecords - batchIndex * batchSize)

    try {
      // Generate and insert users
      const users = await this.generateUserBatch(currentBatchSize - 1, isFirstBatch)
      await this.prisma.user.createMany({
        data: users,
        skipDuplicates: true,
      })
      this.updateProgress(users.length)

      // Get user ID range for this batch
      const batchUsers = await this.prisma.user.findMany({
        orderBy: { id: "desc" },
        take: currentBatchSize,
      })
      const userIds = batchUsers.map((u) => u.id)

      // Generate and insert products
      const products = this.generateProductBatch(currentBatchSize)
      await this.prisma.product.createMany({
        data: products,
        skipDuplicates: true,
      })

      // Get product IDs for this batch
      const batchProducts = await this.prisma.product.findMany({
        orderBy: { id: "desc" },
        take: currentBatchSize,
      })

      // Generate orders and order items
      const orders = Array(currentBatchSize)
        .fill(0)
        .map(() => {
          const status = faker.helpers.arrayElement(Object.values(OrderStatus))
          const recentDate = faker.date.recent()
          return {
            userId: faker.helpers.arrayElement(userIds),
            totalAmount: 0,
            status,
            createdAt: recentDate,
            updatedAt: recentDate,
            canceledAt:
              status === OrderStatus.CANCELED
                ? new Date(recentDate.getTime() + faker.number.int({ min: 1, max: 24 }) * 60 * 60 * 1000)
                : null,
          }
        })

      const createdOrders = await this.prisma.order.createMany({
        data: orders,
        skipDuplicates: true,
      })

      // Get order IDs for this batch
      const batchOrders = await this.prisma.order.findMany({
        orderBy: { id: "desc" },
        take: currentBatchSize,
      })

      // Generate and insert order items
      const orderItems = []
      const stockUpdates = new Map()

      for (const order of batchOrders) {
        const numberOfItems = faker.number.int({ min: 1, max: 3 })
        let orderTotal = 0

        for (let i = 0; i < numberOfItems; i++) {
          const product = faker.helpers.arrayElement(batchProducts)
          const currentStock = stockUpdates.get(product.id) ?? product.stock

          if (currentStock === 0) continue

          const quantity = faker.number.int({ min: 1, max: Math.min(currentStock, 10) })
          const unitPrice = parseFloat(product.price.toString())
          const totalPrice = unitPrice * quantity

          orderItems.push({
            orderId: order.id,
            productId: product.id,
            quantity,
            unitPrice,
            totalPrice,
          })

          orderTotal += totalPrice
          stockUpdates.set(product.id, currentStock - quantity)
        }

        // Update order total
        if (order.status !== OrderStatus.CANCELED && orderTotal > 0) {
          await this.prisma.order.update({
            where: { id: order.id },
            data: { totalAmount: orderTotal },
          })
        }
      }

      // Batch insert order items
      if (orderItems.length > 0) {
        await this.prisma.$transaction([
          this.prisma.orderItem.createMany({ data: orderItems, skipDuplicates: true }),
        ])
      }

      // Update product stock in batch
      await Promise.all(
        Array.from(stockUpdates.entries()).map(([productId, newStock]) =>
          this.prisma.product.update({
            where: { id: productId },
            data: { stock: newStock },
          })
        )
      )
    } catch (error) {
      console.error(`Error in batch ${batchIndex}:`, error)
      throw error
    }
  }

  async seed(totalRecords: number = this.DEFAULT_COUNT) {
    console.log(`🚀 Starting database seed for ${totalRecords} records...`)

    const startTime = Date.now()
    const totalBatches = Math.ceil(totalRecords / this.BATCH_SIZE)

    this.progress = {
      total: totalRecords,
      current: 0,
      operation: "Seeding database",
    }

    try {
      // Process batches with limited parallelism
      for (let i = 0; i < totalBatches; i += this.PARALLEL_BATCHES) {
        const batchPromises = Array(Math.min(this.PARALLEL_BATCHES, totalBatches - i))
          .fill(0)
          .map((_, index) => this.processBatch(i + index, this.BATCH_SIZE, totalRecords))

        await Promise.all(batchPromises)
      }

      const duration = Date.now() - startTime
      console.log(`\n✅ Seeding completed in ${prettyElapsedTime(duration)}`)
    } catch (error) {
      console.error("❌ Seeding failed:", error)
      throw error
    } finally {
      await this.prisma.$disconnect()
    }
  }
}

export const main = async (count: number) => {
  const seeder = new BatchSeeder({
    batchSize: 100,
    parallelBatches: 7,
  })
  await seeder.seed(count)
}
