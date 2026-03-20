"use client";

import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { signOut } from "next-auth/react";
import { MetricCard } from "../common/metric-card";
import { SectionCard } from "../common/section-card";

export function ProfileHubPage({
  sessionUser,
  me,
  profileData,
  uploadingProfilePhoto,
  onChangePhoto,
}) {
  return (
    <Stack spacing={3}>
      <SectionCard
        title="Identity"
        action={
          <Button startIcon={<LogoutRoundedIcon />} variant="outlined" onClick={() => signOut()}>
            Sign out
          </Button>
        }
      >
        <Stack direction={{ xs: "column", md: "row" }} spacing={3} alignItems={{ xs: "flex-start", md: "center" }}>
          <Avatar src={me?.photo_url || me?.avatar_url || sessionUser?.image || undefined} sx={{ width: 92, height: 92 }}>
            {me?.username?.slice(0, 2) || sessionUser?.name?.slice(0, 2) || "GT"}
          </Avatar>
          <Stack spacing={0.75}>
            <Typography variant="h5">{me?.username || sessionUser?.name}</Typography>
            <Typography color="text.secondary">{sessionUser?.email}</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip label={`Google SSO`} color="primary" variant="outlined" />
              {me?.rank ? <Chip label={`Rank #${me.rank}`} variant="outlined" /> : null}
            </Stack>
          </Stack>
          <Box sx={{ ml: { md: "auto" } }}>
            <Button component="label" variant="contained">
              {uploadingProfilePhoto ? "Uploading..." : "Update photo"}
              <input hidden accept="image/*" type="file" onChange={onChangePhoto} />
            </Button>
          </Box>
        </Stack>
      </SectionCard>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard label="Rank" value={me?.rank ? `#${me.rank}` : "-"} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard label="Games" value={me?.total_games || 0} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard label="Wins" value={me?.total_wins || 0} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard label="Score" value={me?.total_score || 0} />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={6}>
          <SectionCard title="By game type">
            <Stack spacing={2}>
              {profileData?.game_types_played?.length ? (
                profileData.game_types_played.map((item) => (
                  <Box key={item.game_type_id} display="flex" justifyContent="space-between" gap={2}>
                    <Stack spacing={0.5}>
                      <Typography fontWeight={700}>{item.game_type_name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.total_games} games · {item.total_wins} wins
                      </Typography>
                    </Stack>
                    <Stack alignItems="flex-end" spacing={0.5}>
                      <Typography fontWeight={700}>{item.total_score} pts</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.total_games > 0 ? Math.round((item.total_wins / item.total_games) * 100) : 0}% win rate
                      </Typography>
                    </Stack>
                  </Box>
                ))
              ) : (
                <Typography color="text.secondary">No game history yet.</Typography>
              )}
            </Stack>
          </SectionCard>
        </Grid>
        <Grid item xs={12} lg={6}>
          <SectionCard title="Recent activity">
            <Stack spacing={2}>
              {profileData?.history?.length ? (
                profileData.history.slice(0, 8).map((item) => (
                  <Box key={item.score_id}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip label={item.game_type_name || "Game"} color="primary" variant="outlined" />
                        <Typography>{item.game_id}</Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography fontWeight={700}>{item.score}</Typography>
                        <Chip
                          label={item.is_winner ? "Won" : "Played"}
                          color={item.is_winner ? "success" : "default"}
                          variant={item.is_winner ? "filled" : "outlined"}
                        />
                      </Stack>
                    </Stack>
                    <Divider sx={{ mt: 2 }} />
                  </Box>
                ))
              ) : (
                <Typography color="text.secondary">No recent activity yet.</Typography>
              )}
            </Stack>
          </SectionCard>
        </Grid>
      </Grid>
    </Stack>
  );
}
