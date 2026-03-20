"use client";

import { Card, CardContent, Stack, Typography } from "@mui/material";

export function MetricCard({ label, value }) {
  return (
    <Card sx={{ bgcolor: "grey.50" }}>
      <CardContent>
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
