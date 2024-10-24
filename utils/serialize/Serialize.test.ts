import { serialize } from "."

describe("serialize function", () => {
  it("should serialize a simple object", () => {
    const obj = { a: 1, b: 2 }
    const serialized = serialize(obj)
    expect(serialized).toEqual(obj)
  })

  it("should serialize an object with a bigint", () => {
    const obj = { a: 1, b: BigInt("12345678901234567890") }
    const serialized = serialize(obj)
    expect(serialized).toEqual({ a: 1, b: 12345678901234567890 })
  })

  it("should serialize an array of objects", () => {
    const obj = [
      { a: 1, b: 2 },
      { a: 3, b: 4 },
    ]
    const serialized = serialize(obj)
    expect(serialized).toEqual(obj)
  })

  it("should serialize an array of objects with bigints", () => {
    const obj = [
      { a: 1, b: BigInt("12345678901234567890") },
      { a: 3, b: BigInt("98765432109876543210") },
    ]
    const serialized = serialize(obj)
    expect(serialized).toEqual([
      { a: 1, b: 12345678901234567890 },
      { a: 3, b: 98765432109876543210 },
    ])
  })
})
