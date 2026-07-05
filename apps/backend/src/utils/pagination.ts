export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function getPaginationParams(queryParams: {
  page?: string;
  limit?: string;
}): PaginationParams {
  const page = Math.max(1, parseInt(queryParams.page || "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(queryParams.limit || "20", 10) || 20));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

export function paginatedResult<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResult<T> {
  return {
    data,
    total,
    page: params.page,
    limit: params.limit,
    totalPages: Math.ceil(total / params.limit),
  };
}
