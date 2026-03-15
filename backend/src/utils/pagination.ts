import { PaginationMeta, PaginationQuery } from '../types/api.types';

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

export const parsePagination = (query: PaginationQuery) => {
  const page = Math.max(1, query.page || DEFAULT_PAGE);
  const limit = Math.min(MAX_LIMIT, Math.max(1, query.limit || DEFAULT_LIMIT));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

export const buildPaginationMeta = (
  page: number,
  limit: number,
  total: number
): PaginationMeta => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});
