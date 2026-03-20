"use client";

import GoogleIcon from "@mui/icons-material/Google";
import SportsEsportsRoundedIcon from "@mui/icons-material/SportsEsportsRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import {
  Box,
  Button,
  Card,
  Chip,
  Container,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { signIn } from "next-auth/react";

const HIGHLIGHTS = [
  {
    title: "Personalized command center",
    body: "Land directly in your own performance, ranking, streaks, and recent activity.",
    icon: TrendingUpRoundedIcon,
  },
  {
    title: "Game rooms with access control",
    body: "Create games, invite players, and manage only the rooms you can access.",
    icon: GroupsRoundedIcon,
  },
  {
    title: "Faster score logging",
    body: "Capture results inside each game with clean flows instead of scattered admin forms.",
    icon: SportsEsportsRoundedIcon,
  },
];

export function AuthLanding() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(36,87,166,0.22), transparent 28%), linear-gradient(160deg, #081120 0%, #0D1628 48%, #111A30 100%)",
        color: "common.white",
        display: "flex",
        alignItems: "center",
      }}
    >
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={6}>
            <Stack spacing={3}>
              <Chip
                label="GameTracker 3.0"
                sx={{
                  width: "fit-content",
                  bgcolor: "rgba(255,255,255,0.08)",
                  color: "common.white",
                  borderRadius: 999,
                }}
              />
              <Typography variant="h2" sx={{ fontSize: { xs: 42, md: 64 }, fontWeight: 800, lineHeight: 1 }}>
                Competitive tracking that finally feels premium.
              </Typography>
              <Typography sx={{ maxWidth: 560, color: "rgba(255,255,255,0.72)", fontSize: 18 }}>
                Sign in with Google, claim your username once, then manage your games, invite players, and track every session from a polished personal workspace.
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Button
                  startIcon={<GoogleIcon />}
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={() => signIn("google")}
                  sx={{ px: 3, py: 1.4, borderRadius: 999 }}
                >
                  Continue with Google
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  sx={{
                    px: 3,
                    py: 1.4,
                    borderRadius: 999,
                    borderColor: "rgba(255,255,255,0.18)",
                    color: "common.white",
                  }}
                >
                  Invite-only workspace
                </Button>
              </Stack>
            </Stack>
          </Grid>
          <Grid item xs={12} md={6}>
            <Grid container spacing={2}>
              {HIGHLIGHTS.map((item) => {
                const Icon = item.icon;
                return (
                  <Grid item xs={12} key={item.title}>
                    <Card
                      sx={{
                        p: 3,
                        bgcolor: "rgba(255,255,255,0.06)",
                        backdropFilter: "blur(10px)",
                        color: "common.white",
                        borderColor: "rgba(255,255,255,0.08)",
                      }}
                    >
                      <Stack direction="row" spacing={2}>
                        <Box
                          sx={{
                            width: 52,
                            height: 52,
                            borderRadius: 3,
                            bgcolor: "rgba(255,255,255,0.08)",
                            display: "grid",
                            placeItems: "center",
                            flexShrink: 0,
                          }}
                        >
                          <Icon />
                        </Box>
                        <Stack spacing={0.5}>
                          <Typography variant="h6">{item.title}</Typography>
                          <Typography sx={{ color: "rgba(255,255,255,0.72)" }}>{item.body}</Typography>
                        </Stack>
                      </Stack>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
