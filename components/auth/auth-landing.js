"use client";

import GoogleIcon from "@mui/icons-material/Google";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import SportsEsportsRoundedIcon from "@mui/icons-material/SportsEsportsRounded";
import Groups2RoundedIcon from "@mui/icons-material/Groups2Rounded";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Container,
  Divider,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { signIn } from "next-auth/react";

const FEATURES = [
  {
    title: "Personal dashboard",
    body: "See your rank, wins, score, and recent rooms as soon as you sign in.",
    icon: InsightsRoundedIcon,
  },
  {
    title: "Shared game visibility",
    body: "Everyone can view scores and standings while management actions stay controlled.",
    icon: Groups2RoundedIcon,
  },
  {
    title: "Faster room operations",
    body: "Create a game, invite people, and log scores from one polished workspace.",
    icon: SportsEsportsRoundedIcon,
  },
];

export function AuthLanding({ authConfigured }) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(34,85,164,0.26), transparent 28%), radial-gradient(circle at bottom right, rgba(10,122,112,0.18), transparent 22%), linear-gradient(160deg, #081120 0%, #101A2E 42%, #13203A 100%)",
        color: "common.white",
        display: "flex",
        alignItems: "center",
      }}
    >
      <Container maxWidth="xl" sx={{ py: { xs: 4, md: 8 } }}>
        <Grid container spacing={4} alignItems="stretch">
          <Grid item xs={12} md={6}>
            <Stack spacing={3.5} sx={{ height: "100%", justifyContent: "center" }}>
              <Chip
                icon={<LockRoundedIcon />}
                label="Google SSO protected workspace"
                sx={{
                  width: "fit-content",
                  bgcolor: "rgba(255,255,255,0.08)",
                  color: "common.white",
                  borderRadius: 999,
                }}
              />
              <Stack spacing={2}>
                <Typography variant="h2" sx={{ fontSize: { xs: 40, md: 68 }, lineHeight: 0.96 }}>
                  Indoor Olympics, reimagined as a proper product.
                </Typography>
                <Typography sx={{ fontSize: 18, color: "rgba(255,255,255,0.72)", maxWidth: 620 }}>
                  Sign in with Google, pick your username once, and enter a cleaner experience for scores, game rooms, invitations, and rankings.
                </Typography>
              </Stack>

              {!authConfigured ? (
                <Alert severity="error" sx={{ maxWidth: 640 }}>
                  Google auth is not configured yet. Add `AUTH_SECRET`, `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`
                  in Vercel, or use the `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` fallback names.
                </Alert>
              ) : null}

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Button
                  startIcon={<GoogleIcon />}
                  variant="contained"
                  size="large"
                  disabled={!authConfigured}
                  onClick={() => signIn("google")}
                  sx={{ px: 3.5, py: 1.5, borderRadius: 999 }}
                >
                  Continue with Google
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  sx={{
                    px: 3.5,
                    py: 1.5,
                    borderRadius: 999,
                    borderColor: "rgba(255,255,255,0.2)",
                    color: "common.white",
                  }}
                >
                  Invite-only access
                </Button>
              </Stack>
            </Stack>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card
              sx={{
                height: "100%",
                p: { xs: 3, md: 4 },
                bgcolor: "rgba(255,255,255,0.06)",
                backdropFilter: "blur(18px)",
                color: "common.white",
                borderColor: "rgba(255,255,255,0.08)",
              }}
            >
              <Stack spacing={3}>
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: 4,
                    background: "linear-gradient(160deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04))",
                  }}
                >
                  <Stack spacing={1.5}>
                    <Typography variant="overline" sx={{ color: "rgba(255,255,255,0.7)" }}>
                      What changes after login
                    </Typography>
                    <Typography variant="h5">One place for players, rooms, and results</Typography>
                    <Typography sx={{ color: "rgba(255,255,255,0.72)" }}>
                      No more raw admin screens. The new experience is organized around the signed-in player, with cleaner room management and easier score capture.
                    </Typography>
                  </Stack>
                </Box>

                <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

                <Grid container spacing={2}>
                  {FEATURES.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Grid item xs={12} key={item.title}>
                        <Stack direction="row" spacing={2.25} alignItems="flex-start">
                          <Box
                            sx={{
                              width: 52,
                              height: 52,
                              borderRadius: 3,
                              display: "grid",
                              placeItems: "center",
                              bgcolor: "rgba(255,255,255,0.08)",
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
                      </Grid>
                    );
                  })}
                </Grid>
              </Stack>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
