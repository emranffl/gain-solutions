import { faker } from "@faker-js/faker"
import { OrderStatus, PrismaClient, ProductCategory } from "@prisma/client"
import { hash } from "bcrypt"

const prisma = new PrismaClient()

export const main = async (count = 10) => {
  console.log("Start seeding...")
  const hashedPassword = await hash("alice1234", 10)
  const staticUserData = [
    {
      name: "Alice",
      email: "alice@gmail.com",
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]

  // + Seed Users
  let userData = [
    ...staticUserData,
    ...(await Promise.all(
      Array.from({ length: count }).map(async () => {
        const recentDate = faker.date.recent()
        return {
          name: faker.person.fullName(),
          email: faker.internet.email(),
          password: await hash(faker.internet.password(), 10),
          createdAt: recentDate,
          updatedAt: recentDate,
        }
      })
    )),
  ]

  await prisma.user.createMany({ data: userData })
  console.log(`Seeded ${userData.length} users.`)

  // Get the user ID range
  const users = await prisma.user.findMany()
  const userIds = users.map((user) => user.id).sort()
  const { min: minUserId, max: maxUserId } = {
    min: userIds[0],
    max: userIds[userIds.length - 1],
  }

  // + Seed Products
  const productData = Array.from({ length: count }).map(() => ({
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    price: parseFloat(
      faker.commerce.price({
        dec: 2,
        min: 100,
        max: 1_00_000,
      })
    ),
    stock: faker.number.int({ min: 1, max: 100 }),
    category: faker.helpers.arrayElement(Object.values(ProductCategory)),
  }))

  await prisma.product.createMany({ data: productData })
  console.log(`Seeded ${productData.length} products.`)

  // + Seed Orders with random items
  const orderData = Array.from({ length: count }).map(() => {
    const status = faker.helpers.arrayElement(Object.values(OrderStatus))
    const recentDate = faker.date.recent()
    return {
      userId: faker.number.int({ min: Number(minUserId), max: Number(maxUserId) }), // Use the seeded user ID range
      totalAmount: 0, // Will be calculated based on OrderItems
      status,
      createdAt: recentDate,
      updatedAt: recentDate,
      canceledAt:
        status === OrderStatus.CANCELED
          ? // Add random hours to the recent date
            new Date(recentDate.getTime() + faker.number.int({ min: 1, max: 24 }) * 60 * 60 * 1000)
          : null,
    }
  })

  const createdOrders = await prisma.order.createMany({ data: orderData })
  console.log(`Seeded ${createdOrders.count} orders.`)

  // Get the product ID range
  const products = await prisma.product.findMany()
  const productIds = products.map((product) => product.id).sort()
  const { minId, maxId } = { minId: productIds[0], maxId: productIds[productIds.length - 1] }
  // Get the orders
  const orders = await prisma.order.findMany()

  // + Seed OrderItems with stock validation
  const orderItemsData = []
  for (let i = 1; i <= count; i++) {
    // Generate random number of items per order
    const numberOfItems = faker.number.int({ min: 1, max: 7 })
    let orderTotalAmount = 0

    for (let j = 0; j < numberOfItems; j++) {
      const productId = faker.number.int({ min: Number(minId), max: Number(maxId) })
      const product = products.find((product) => Number(product.id) === productId)

      if (!product) continue // Skip if product doesn't exist
      if (product.stock === 0) continue // Skip if product is out of stock

      const maxOrderQuantity = Math.min(product.stock, 10)
      const quantity = faker.number.int({ min: 1, max: maxOrderQuantity })

      // Validate that the order quantity does not exceed the stock
      if (quantity > product.stock) {
        console.log(`Skipping product ${productId} due to insufficient stock`)
        continue
      }

      const unitPrice = parseFloat(product.price.toString())
      const totalPrice = unitPrice * quantity
      orderTotalAmount += totalPrice

      orderItemsData.push({
        orderId: i,
        productId,
        quantity,
        unitPrice,
        totalPrice,
      })
    }

    const order = orders.find((order) => Number(order.id) === i)

    // Update the total amount for the order
    await prisma.order.update({
      where: { id: i },
      data: { totalAmount: order?.status === OrderStatus.CANCELED ? 0 : orderTotalAmount },
    })
  }

  // + Batch update products stock
  const stockUpdates = orderItemsData.map(({ productId, quantity }) => ({
    id: productId,
    newStock: products.find((p) => Number(p.id) === productId)!.stock - quantity,
  }))

  await Promise.all(
    stockUpdates.map(({ id, newStock }) =>
      prisma.product.update({
        where: { id },
        data: { stock: newStock },
      })
    )
  )

  await prisma.orderItem.createMany({ data: orderItemsData })
  console.log(`Seeded ${orderItemsData.length} order items.`)
}
