"use client";

import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import SportsEsportsOutlinedIcon from "@mui/icons-material/SportsEsportsOutlined";
import ScoreboardOutlinedIcon from "@mui/icons-material/ScoreboardOutlined";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import {
  Box,
  Drawer,
  FormControl,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";

const ICONS = {
  dashboard: DashboardOutlinedIcon,
  players: GroupOutlinedIcon,
  games: SportsEsportsOutlinedIcon,
  "enter-scores": ScoreboardOutlinedIcon,
  "add-player": PersonAddAltOutlinedIcon,
  profile: AccountCircleOutlinedIcon,
};

export function AppShell({ navItems, activePage, onChangePage, title, description, children }) {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Stack direction={{ xs: "column", md: "row" }} alignItems="stretch">
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            width: 250,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: 250,
              borderRight: "1px solid rgba(15, 23, 42, 0.08)",
              p: 2,
            },
          }}
        >
          <Typography variant="h6" sx={{ mb: 3 }}>
            Game<span style={{ color: "#2457A6" }}>Tracker</span>
          </Typography>
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
                    bgcolor: activePage === item.id ? "primary.main" : "transparent",
                    color: activePage === item.id ? "common.white" : "text.secondary",
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
              Next.js + MUI
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Vercel-ready application structure
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
