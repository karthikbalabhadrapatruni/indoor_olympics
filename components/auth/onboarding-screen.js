"use client";

import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import {
  Avatar,
  Box,
  Button,
  Card,
  Container,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";

export function OnboardingScreen({ sessionUser, username, loading, error, onChangeUsername, onSubmit }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        background: isDark
          ? "linear-gradient(180deg, rgba(139,184,255,0.10), transparent 24%), radial-gradient(circle at right top, rgba(111,215,203,0.10), transparent 30%), #0D1320"
          : "linear-gradient(180deg, rgba(36,87,166,0.10), transparent 25%), radial-gradient(circle at right top, rgba(11,122,117,0.10), transparent 30%), #F4F7FC",
      }}
    >
      <Container maxWidth="sm">
        <Card sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}>
          <Stack spacing={3} alignItems="center" textAlign="center">
            <Avatar src={sessionUser?.image || undefined} sx={{ width: 88, height: 88 }}>
              {sessionUser?.name?.slice(0, 2) || "GT"}
            </Avatar>
            <Stack spacing={1}>
              <Typography variant="h4">Choose your GameTracker name</Typography>
              <Typography color="text.secondary">
                You are signed in as {sessionUser?.email}. Pick the username everyone will see in rooms, scores, and leaderboards.
              </Typography>
            </Stack>
            <TextField
              fullWidth
              label="Username"
              value={username}
              onChange={(event) => onChangeUsername(event.target.value)}
              placeholder="e.g. karthik"
              helperText={error || "You only need to do this once."}
              error={Boolean(error)}
            />
            <Button
              startIcon={<AutoAwesomeRoundedIcon />}
              variant="contained"
              size="large"
              onClick={onSubmit}
              disabled={loading}
              sx={{ borderRadius: 2.5, px: 3 }}
            >
              {loading ? "Setting up..." : "Enter workspace"}
            </Button>
          </Stack>
        </Card>
      </Container>
    </Box>
  );
}
