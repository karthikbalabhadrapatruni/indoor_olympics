"use client";

import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import FlashOnRoundedIcon from "@mui/icons-material/FlashOnRounded";
import SportsScoreRoundedIcon from "@mui/icons-material/SportsScoreRounded";
import {
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import { MetricCard } from "../common/metric-card";
import { PlayerAvatar } from "../common/player-avatar";
import { SectionCard } from "../common/section-card";

export function HomeDashboardPage({ data, paletteMap, onOpenGames }) {
  const recentSessions = [...data.sessions].reverse().slice(0, 4);
  const myRank = data.rankings.findIndex((entry) => entry.user_id === data.me?.user_id) + 1;

  return (
    <Stack spacing={3.5}>
      <SectionCard title="Personal command center">
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={7}>
            <Stack spacing={2.5}>
              <Chip
                icon={<FlashOnRoundedIcon />}
                label={`Welcome back, ${data.me?.username || "Player"}`}
                color="primary"
                variant="outlined"
                sx={{ width: "fit-content", borderRadius: 2 }}
              />
              <Typography variant="h3" sx={{ fontSize: { xs: 34, md: 46 }, lineHeight: 1.05 }}>
                Your games, your momentum, one polished workspace.
              </Typography>
              <Typography color="text.secondary" sx={{ maxWidth: 620 }}>
                Track the rooms you belong to, invite teammates into active games, and log scores without jumping between disconnected screens.
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <Button
                  variant="contained"
                  endIcon={<ArrowForwardRoundedIcon />}
                  onClick={onOpenGames}
                  sx={{ borderRadius: 2.5, px: 3 }}
                >
                  Open my games
                </Button>
                <Chip
                  icon={<EmojiEventsRoundedIcon />}
                  label={myRank > 0 ? `Currently ranked #${myRank}` : "No rank yet"}
                  sx={{ borderRadius: 2.5, height: 40 }}
                />
              </Stack>
            </Stack>
          </Grid>
          <Grid item xs={12} md={5}>
            <Box
              sx={{
                p: 3,
                borderRadius: 4,
                background:
                  "linear-gradient(160deg, rgba(36,87,166,0.10), rgba(11,122,117,0.10))",
              }}
            >
              <Stack spacing={2}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <PlayerAvatar
                    uid={data.me?.user_id || "me"}
                    name={data.me?.username || "Me"}
                    photoUrl={data.me?.photo_url || data.me?.avatar_url}
                    paletteMap={paletteMap}
                    size={54}
                  />
                  <Box>
                    <Typography variant="h6">{data.me?.username}</Typography>
                    <Typography color="text.secondary">{data.me?.email || "Signed in player"}</Typography>
                  </Box>
                </Stack>
                <Divider />
                <Stack spacing={1.5}>
                  <Typography variant="body2" color="text.secondary">
                    Win rate
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={data.me?.win_pct || 0}
                    sx={{ height: 10 }}
                  />
                  <Typography variant="body2" fontWeight={700}>
                    {data.me?.win_pct || 0}% over {data.me?.total_games || 0} sessions
                  </Typography>
                </Stack>
              </Stack>
            </Box>
          </Grid>
        </Grid>
      </SectionCard>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard label="My rank" value={myRank > 0 ? `#${myRank}` : "-"} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard label="Accessible games" value={data.sessions.length} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard label="Total wins" value={data.me?.total_wins || 0} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard label="Total score" value={data.me?.total_score || 0} />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={7}>
          <SectionCard title="Your recent rooms">
            <Stack spacing={2}>
              {recentSessions.length ? (
                recentSessions.map((session) => {
                  const gameType = data.gameTypes.find((entry) => entry.game_type_id === session.game_type_id);
                  return (
                    <Box
                      key={session.game_id}
                      sx={{
                        p: 2.25,
                        borderRadius: 3,
                        bgcolor: "grey.50",
                        border: "1px solid rgba(15,23,42,0.06)",
                      }}
                    >
                      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2}>
                        <Stack spacing={0.75}>
                          <Typography variant="h6">{session.title}</Typography>
                          <Typography color="text.secondary">
                            {gameType?.name || "Game"} · {(session.played_at || "").split("T")[0]}
                          </Typography>
                        </Stack>
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          {session.members.slice(0, 4).map((member) => (
                            <Chip
                              key={member.access_id}
                              label={member.username}
                              variant="outlined"
                              sx={{ borderRadius: 2 }}
                            />
                          ))}
                        </Stack>
                      </Stack>
                    </Box>
                  );
                })
              ) : (
                <Typography color="text.secondary">No rooms yet. Create your first game to get started.</Typography>
              )}
            </Stack>
          </SectionCard>
        </Grid>
        <Grid item xs={12} lg={5}>
          <SectionCard title="Leaderboard snapshot">
            <Stack spacing={2}>
              {data.rankings.slice(0, 5).map((item, index) => {
                const user = data.users.find((entry) => entry.user_id === item.user_id);
                return (
                  <Stack key={item.user_id} direction="row" spacing={1.5} alignItems="center">
                    <Typography sx={{ width: 18, color: "text.secondary" }}>{index + 1}</Typography>
                    <PlayerAvatar
                      uid={item.user_id}
                      name={item.username}
                      photoUrl={user?.photo_url || user?.avatar_url}
                      paletteMap={paletteMap}
                      size={36}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography fontWeight={700}>{item.username}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.win_pct}% wins
                      </Typography>
                    </Box>
                    <Chip
                      icon={<SportsScoreRoundedIcon />}
                      label={item.total_score}
                      color={item.user_id === data.me?.user_id ? "primary" : "default"}
                      variant={item.user_id === data.me?.user_id ? "filled" : "outlined"}
                      sx={{ borderRadius: 2 }}
                    />
                  </Stack>
                );
              })}
            </Stack>
          </SectionCard>
        </Grid>
      </Grid>
    </Stack>
  );
}
