/**
 * Pagination Utility
 *
 * Provides helpers for implementing pagination in Supabase queries
 * to prevent loading large datasets and reduce API abuse.
 *
 * Security Benefits:
 * - Prevents DoS via large query responses
 * - Reduces server load
 * - Improves performance
 * - Rate limits data access
 */

/**
 * Default page size for queries
 */
export const DEFAULT_PAGE_SIZE = 20;

/**
 * Maximum page size to prevent abuse
 */
export const MAX_PAGE_SIZE = 100;

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  pageSize?: number;
}

/**
 * Pagination result metadata
 */
export interface PaginationMeta {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Paginated query result
 */
export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Calculate range for Supabase query
 *
 * @param page - Current page number (0-indexed)
 * @param pageSize - Number of items per page
 * @returns Range tuple for Supabase .range() method
 *
 * Usage:
 * ```typescript
 * const [from, to] = getPaginationRange(0, 20);
 * const { data } = await supabase
 *   .from('goals')
 *   .select('*')
 *   .range(from, to);
 * ```
 */
export function getPaginationRange(
  page: number,
  pageSize: number = DEFAULT_PAGE_SIZE
): [number, number] {
  // Validate page size
  const validatedPageSize = Math.min(Math.max(pageSize, 1), MAX_PAGE_SIZE);

  // Calculate range
  const from = page * validatedPageSize;
  const to = from + validatedPageSize - 1;

  return [from, to];
}

/**
 * Calculate pagination metadata
 *
 * @param page - Current page number (0-indexed)
 * @param pageSize - Number of items per page
 * @param totalCount - Total number of items
 * @returns Pagination metadata
 */
export function getPaginationMeta(
  page: number,
  pageSize: number,
  totalCount: number
): PaginationMeta {
  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    currentPage: page,
    pageSize,
    totalItems: totalCount,
    totalPages,
    hasNextPage: page < totalPages - 1,
    hasPreviousPage: page > 0,
  };
}

/**
 * Create paginated query helper for Supabase
 *
 * @param params - Pagination parameters
 * @returns Helper object with range and meta calculator
 *
 * Usage:
 * ```typescript
 * const pagination = createPagination({ page: 0, pageSize: 20 });
 *
 * const { data, error, count } = await supabase
 *   .from('goals')
 *   .select('*', { count: 'exact' })
 *   .range(...pagination.range);
 *
 * const result = {
 *   data,
 *   meta: pagination.getMeta(count || 0)
 * };
 * ```
 */
export function createPagination(params: PaginationParams) {
  const pageSize = params.pageSize || DEFAULT_PAGE_SIZE;
  const page = Math.max(params.page, 0); // Ensure page is non-negative

  return {
    range: getPaginationRange(page, pageSize),
    getMeta: (totalCount: number) => getPaginationMeta(page, pageSize, totalCount),
  };
}

/**
 * React hook for pagination state management
 *
 * @param initialPageSize - Initial page size (default: 20)
 * @returns Pagination state and controls
 *
 * Usage:
 * ```typescript
 * const {
 *   page,
 *   pageSize,
 *   range,
 *   nextPage,
 *   previousPage,
 *   setPage,
 *   getMeta
 * } = usePagination();
 *
 * const { data, count } = await supabase
 *   .from('goals')
 *   .select('*', { count: 'exact' })
 *   .range(...range);
 *
 * const meta = getMeta(count || 0);
 * ```
 */
export function usePagination(initialPageSize: number = DEFAULT_PAGE_SIZE) {
  const [page, setPage] = React.useState(0);
  const [pageSize] = React.useState(
    Math.min(Math.max(initialPageSize, 1), MAX_PAGE_SIZE)
  );

  const range = getPaginationRange(page, pageSize);

  const nextPage = () => setPage((p) => p + 1);
  const previousPage = () => setPage((p) => Math.max(p - 1, 0));
  const getMeta = (totalCount: number) => getPaginationMeta(page, pageSize, totalCount);

  return {
    page,
    pageSize,
    range,
    nextPage,
    previousPage,
    setPage,
    getMeta,
  };
}

// Import React at the top for the hook
import React from 'react';

/**
 * Pagination component props
 */
export interface PaginationControlsProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  className?: string;
}

/**
 * Calculate page numbers to display
 * Shows first, last, current, and nearby pages with ellipsis
 *
 * @param currentPage - Current page (0-indexed)
 * @param totalPages - Total number of pages
 * @param maxVisible - Maximum number of page buttons to show (default: 7)
 * @returns Array of page numbers or 'ellipsis'
 */
export function getPageNumbers(
  currentPage: number,
  totalPages: number,
  maxVisible: number = 7
): (number | 'ellipsis')[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  const pages: (number | 'ellipsis')[] = [];
  const halfVisible = Math.floor(maxVisible / 2);

  // Always show first page
  pages.push(0);

  // Calculate start and end of middle section
  let start = Math.max(1, currentPage - halfVisible);
  let end = Math.min(totalPages - 2, currentPage + halfVisible);

  // Adjust if near start or end
  if (currentPage < halfVisible) {
    end = Math.min(totalPages - 2, maxVisible - 2);
  }
  if (currentPage > totalPages - halfVisible - 1) {
    start = Math.max(1, totalPages - maxVisible + 1);
  }

  // Add ellipsis before middle section if needed
  if (start > 1) {
    pages.push('ellipsis');
  }

  // Add middle pages
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  // Add ellipsis after middle section if needed
  if (end < totalPages - 2) {
    pages.push('ellipsis');
  }

  // Always show last page
  if (totalPages > 1) {
    pages.push(totalPages - 1);
  }

  return pages;
}

/**
 * Format pagination info text
 *
 * @param meta - Pagination metadata
 * @returns Formatted string (e.g., "Showing 1-20 of 150 items")
 */
export function formatPaginationInfo(meta: PaginationMeta): string {
  if (meta.totalItems === 0) {
    return 'No items found';
  }

  const start = meta.currentPage * meta.pageSize + 1;
  const end = Math.min((meta.currentPage + 1) * meta.pageSize, meta.totalItems);

  return `Showing ${start}-${end} of ${meta.totalItems} items`;
}
