export function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value || "", 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

export function parseSortOrder(value, fallback = "desc") {
  return value === "asc" ? "asc" : fallback;
}

export function paginateItems(items, page, pageSize) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  const end = start + pageSize;

  return {
    items: items.slice(start, end),
    pagination: {
      page: safePage,
      pageSize,
      total,
      totalPages,
    },
  };
}

export function compareValues(left, right, order = "asc") {
  const direction = order === "asc" ? 1 : -1;
  if (left == null && right == null) return 0;
  if (left == null) return 1 * direction;
  if (right == null) return -1 * direction;

  if (typeof left === "number" && typeof right === "number") {
    return (left - right) * direction;
  }

  return String(left).localeCompare(String(right)) * direction;
}
