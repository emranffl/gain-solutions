export function responsePaginationHandler({
  page,
  totalPages,
  totalCount,
}: {
  page: number
  totalPages: number
  totalCount: number
}) {
  const pagination = {
    currentPage: page,
    totalPages,
    totalCount,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  }

  return { pagination }
}
