"use client";

import { Card, CardContent, Stack, Typography } from "@mui/material";

export function MetricCard({ label, value }) {
  return (
    <Card sx={{ bgcolor: "grey.50", borderRadius: 3 }}>
      <CardContent sx={{ p: 2.25, "&:last-child": { pb: 2.25 } }}>
        <Stack spacing={0.5}>
          <Typography variant="overline" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="h4">{value}</Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
