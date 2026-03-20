"use client";

import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import SportsEsportsOutlinedIcon from "@mui/icons-material/SportsEsportsOutlined";
import LeaderboardOutlinedIcon from "@mui/icons-material/LeaderboardOutlined";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import {
  Avatar,
  Box,
  Drawer,
  FormControl,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from "@mui/material";

const ICONS = {
  dashboard: DashboardOutlinedIcon,
  games: SportsEsportsOutlinedIcon,
  leaderboard: LeaderboardOutlinedIcon,
  profile: AccountCircleOutlinedIcon,
};

export function AppShell({ navItems, activePage, onChangePage, title, description, children, sessionUser, me }) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top right, rgba(36,87,166,0.10), transparent 24%), radial-gradient(circle at top left, rgba(11,122,117,0.08), transparent 18%), #F5F7FB",
      }}
    >
      <Stack direction={{ xs: "column", md: "row" }} alignItems="stretch">
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            width: 250,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: 250,
              borderRight: "1px solid rgba(15, 23, 42, 0.06)",
              p: 2.25,
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,255,255,0.78))",
              backdropFilter: "blur(14px)",
            },
          }}
        >
          <Stack spacing={2.5} sx={{ height: "100%" }}>
            <Box>
              <Typography variant="h6">
                Game<span style={{ color: "#2457A6" }}>Tracker</span>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Competitive play, beautifully organized
              </Typography>
            </Box>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 4,
                background: "linear-gradient(155deg, rgba(36,87,166,0.10), rgba(11,122,117,0.12))",
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar src={me?.photo_url || me?.avatar_url || sessionUser?.image || undefined}>
                  {me?.username?.slice(0, 2) || sessionUser?.name?.slice(0, 2) || "GT"}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography fontWeight={700} noWrap>
                    {me?.username || sessionUser?.name || "Player"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {sessionUser?.email}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Stack>
          <Stack spacing={1}>
            {navItems.map((item) => {
              const Icon = ICONS[item.id];
              return (
                <Box
                  component="button"
                  key={item.id}
                  onClick={() => onChangePage(item.id)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    width: "100%",
                    border: 0,
                    borderRadius: 3,
                    px: 1.5,
                    py: 1.25,
                    cursor: "pointer",
                    bgcolor: activePage === item.id ? "rgba(36,87,166,0.12)" : "transparent",
                    color: activePage === item.id ? "primary.main" : "text.secondary",
                    textAlign: "left",
                  }}
                >
                  <Icon fontSize="small" />
                  <Typography variant="body2" fontWeight={600}>
                    {item.label}
                  </Typography>
                </Box>
              );
            })}
          </Stack>
          <Box sx={{ mt: "auto", pt: 3 }}>
            <Typography variant="body2" fontWeight={700}>
              Invite-only workspace
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Google SSO protected
            </Typography>
          </Box>
        </Drawer>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1280, mx: "auto" }}>
            <FormControl fullWidth sx={{ display: { xs: "block", md: "none" }, mb: 2 }}>
              <Select value={activePage} onChange={(event) => onChangePage(event.target.value)}>
                {navItems.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Stack spacing={0.5} sx={{ mb: 3 }}>
              <Typography variant="h4">{title}</Typography>
              <Typography color="text.secondary">{description}</Typography>
            </Stack>

            {children}
          </Box>
        </Box>
      </Stack>
    </Box>
  );
}
