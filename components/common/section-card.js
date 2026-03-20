"use client";

import { Card, CardContent, Stack, Typography } from "@mui/material";

export function SectionCard({ title, children, action }) {
  return (
    <Card sx={{ borderRadius: 4 }}>
      <CardContent sx={{ p: { xs: 2, md: 2.5 }, "&:last-child": { pb: { xs: 2, md: 2.5 } } }}>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", sm: "center" }}
            spacing={2}
          >
            <Typography variant="overline" color="text.secondary">
              {title}
            </Typography>
            {action}
          </Stack>
          {children}
        </Stack>
      </CardContent>
    </Card>
  );
}
