export const serialize = (obj: Record<string, any> | Record<string, any>[]) => {
  return JSON.parse(
    JSON.stringify(obj, (key, value) => (typeof value === "bigint" ? parseInt(value.toString()) : value))
  )
}
