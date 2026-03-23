"use client";

import {
  FormControl,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Stack,
  Typography,
} from "@mui/material";

export function ListControls({
  page,
  totalPages,
  pageSize,
  pageSizeOptions = [5, 10, 20],
  sortBy,
  sortOrder,
  sortOptions,
  onChangePage,
  onChangePageSize,
  onChangeSortBy,
  onChangeSortOrder,
  total,
}) {
  return (
    <Stack
      direction={{ xs: "column", md: "row" }}
      spacing={1.5}
      justifyContent="space-between"
      alignItems={{ xs: "stretch", md: "center" }}
    >
      <Typography variant="body2" color="text.secondary">
        Showing page {page} of {Math.max(totalPages, 1)} · {total} total items
      </Typography>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel id="sort-by-label">Sort by</InputLabel>
          <Select
            labelId="sort-by-label"
            value={sortBy}
            label="Sort by"
            onChange={(event) => onChangeSortBy(event.target.value)}
          >
            {sortOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel id="sort-order-label">Order</InputLabel>
          <Select
            labelId="sort-order-label"
            value={sortOrder}
            label="Order"
            onChange={(event) => onChangeSortOrder(event.target.value)}
          >
            <MenuItem value="desc">Descending</MenuItem>
            <MenuItem value="asc">Ascending</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 110 }}>
          <InputLabel id="page-size-label">Rows</InputLabel>
          <Select
            labelId="page-size-label"
            value={String(pageSize)}
            label="Rows"
            onChange={(event) => onChangePageSize(Number(event.target.value))}
          >
            {pageSizeOptions.map((option) => (
              <MenuItem key={option} value={String(option)}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Pagination
          page={page}
          count={Math.max(totalPages, 1)}
          color="primary"
          shape="rounded"
          onChange={(_, value) => onChangePage(value)}
        />
      </Stack>
    </Stack>
  );
}
