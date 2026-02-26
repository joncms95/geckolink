/**
 * Build pagination page numbers with ellipsis, e.g. [1, "…", 4, 5, 6, "…", 20].
 * @param {number} currentPage - 1-based current page
 * @param {number} totalPages - total number of pages
 * @returns {(number|string)[]} - array of page numbers and "…" for gaps
 */
export function paginationItems(currentPage, totalPages) {
  const delta = 1;
  if (totalPages <= 0) return [];
  if (totalPages <= 3)
    return Array.from({ length: totalPages }, (_, i) => i + 1);

  const left = Math.max(2, currentPage - delta);
  const right = Math.min(totalPages - 1, currentPage + delta);
  const items = [1];

  if (left > 2) items.push("…");
  for (let p = left; p <= right; p++) {
    if (!items.includes(p)) items.push(p);
  }
  if (right < totalPages - 1) items.push("…");
  if (totalPages > 1) items.push(totalPages);

  return items;
}

/**
 * Slice an array to the current page (1-based).
 * @param {Array} items - full list
 * @param {number} page - 1-based page
 * @param {number} perPage - items per page
 * @returns {{ pageItems: Array, start: number, end: number, totalPages: number }}
 */
export function slicePage(items, page, perPage) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.max(1, Math.min(page, totalPages));
  const startIndex = (safePage - 1) * perPage;
  const pageItems = items.slice(startIndex, startIndex + perPage);
  const start = total > 0 ? startIndex + 1 : 0;
  const end = total > 0 ? Math.min(startIndex + perPage, total) : 0;
  return { pageItems, start, end, totalPages, currentPage: safePage };
}
