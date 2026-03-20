"use client";

import GoogleIcon from "@mui/icons-material/Google";
import { Alert, Box, Button, Card, Stack, Typography } from "@mui/material";
import { signIn } from "next-auth/react";

export function AuthLanding({ authConfigured }) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        background:
          "radial-gradient(circle at top, rgba(34,85,164,0.18), transparent 30%), linear-gradient(180deg, #0B1220 0%, #111C31 100%)",
      }}
    >
      <Card
        sx={{
          width: "100%",
          maxWidth: 460,
          p: { xs: 3, md: 4 },
          borderRadius: 6,
          textAlign: "center",
        }}
      >
        <Stack spacing={3} alignItems="center">
          <Stack spacing={1}>
            <Typography variant="h4">Sign in to GameTracker</Typography>
            <Typography color="text.secondary">
              Continue with Google to access your workspace.
            </Typography>
          </Stack>

          {!authConfigured ? (
            <Alert severity="error" sx={{ width: "100%", textAlign: "left" }}>
              Google auth is not configured yet.
            </Alert>
          ) : null}

          <Button
            startIcon={<GoogleIcon />}
            variant="contained"
            size="large"
            disabled={!authConfigured}
            onClick={() => signIn("google")}
            sx={{ px: 3, py: 1.4, borderRadius: 999 }}
          >
            Continue with Google
          </Button>
        </Stack>
      </Card>
    </Box>
  );
}
