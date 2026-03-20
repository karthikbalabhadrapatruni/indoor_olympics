"use client";

import {
  Avatar,
  Box,
  Button,
  Chip,
  Grid,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { MetricCard } from "../common/metric-card";
import { SectionCard } from "../common/section-card";

export function ProfilePage({
  users,
  rankings,
  currentProfile,
  profileData,
  profileLoading,
  uploadingProfilePhoto,
  onChangeProfile,
  onChangePhoto,
}) {
  const rank = rankings.findIndex((item) => item.user_id === currentProfile) + 1;
  const currentUser = users.find((item) => item.user_id === currentProfile);

  return (
    <Stack spacing={3}>
      <ToggleButtonGroup
        exclusive
        value={currentProfile}
        onChange={(_, value) => value && onChangeProfile(value)}
        size="small"
      >
        {users.map((user) => (
          <ToggleButton key={user.user_id} value={user.user_id}>
            {user.username}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {profileLoading || !profileData ? (
        <SectionCard title="Profile">
          <Typography color="text.secondary">Loading profile...</Typography>
        </SectionCard>
      ) : (
        <>
          <SectionCard title="Player profile">
            <Stack direction={{ xs: "column", sm: "row" }} spacing={3} alignItems={{ xs: "flex-start", sm: "center" }}>
              <Avatar src={currentUser?.photo_url || undefined} sx={{ width: 88, height: 88 }}>
                {(profileData.username || "?").slice(0, 2).toUpperCase()}
              </Avatar>
              <Stack spacing={0.5}>
                <Typography variant="h5">{profileData.username}</Typography>
                <Typography color="text.secondary">
                  Rank #{rank} overall · {profileData.total_games} sessions
                </Typography>
                <Button component="label" variant="outlined" sx={{ width: "fit-content" }}>
                  Change photo
                  <input hidden accept="image/*" type="file" onChange={onChangePhoto} />
                </Button>
                {uploadingProfilePhoto ? (
                  <Typography variant="caption" color="primary">
                    Uploading photo...
                  </Typography>
                ) : null}
              </Stack>
            </Stack>
          </SectionCard>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard label="Rank" value={`#${rank}`} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard label="Total score" value={profileData.total_score} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard label="Win rate" value={`${profileData.win_pct}%`} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard label="Wins" value={profileData.total_wins} />
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} lg={6}>
              <SectionCard title="By game type">
                <Stack spacing={2}>
                  {profileData.game_types_played?.map((item) => (
                    <Box key={item.game_type_id} display="flex" justifyContent="space-between" gap={2}>
                      <Stack>
                        <Typography fontWeight={700}>{item.game_type_name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.total_games} games · {item.total_wins} wins
                        </Typography>
                      </Stack>
                      <Stack alignItems="flex-end">
                        <Typography fontWeight={700}>{item.total_score} pts</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.total_games > 0 ? Math.round((item.total_wins / item.total_games) * 100) : 0}% win rate
                        </Typography>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </SectionCard>
            </Grid>

            <Grid item xs={12} lg={6}>
              <SectionCard title="Game history">
                <Stack spacing={2}>
                  {profileData.history?.map((item) => (
                    <Box key={item.score_id} display="flex" justifyContent="space-between" gap={2}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip label={item.game_type_name || ""} color="primary" variant="outlined" />
                        <Typography>{item.game_id}</Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography fontWeight={700}>{item.score} pts</Typography>
                        <Chip
                          label={item.is_winner ? "Won" : "Lost"}
                          color={item.is_winner ? "success" : "default"}
                          variant={item.is_winner ? "filled" : "outlined"}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {(item.played_at || "").split("T")[0]}
                        </Typography>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </SectionCard>
            </Grid>
          </Grid>
        </>
      )}
    </Stack>
  );
}
