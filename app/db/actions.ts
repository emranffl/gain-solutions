"use server"

import { prisma } from "@prisma/prisma-instance"

export async function testDatabaseConnection() {
  let isConnected = false
  try {
    // Perform a simple query to test the connection
    await prisma.$queryRaw`SELECT 1`
    console.log("Pinged your PostgreSQL deployment. You successfully connected to the database!") // This will output to the terminal, not the browser
    isConnected = true
  } catch (e) {
    console.error("Error connecting to the database:", e)
  } finally {
    await prisma.$disconnect() // Ensure Prisma disconnects after the test
  }
  return isConnected
}
