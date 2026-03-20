"use client";

import { Box, Chip, LinearProgress, Stack, Typography } from "@mui/material";
import Grid from "@mui/material/Grid2";
import { BarChart } from "../common/bar-chart";
import { MetricCard } from "../common/metric-card";
import { PlayerAvatar } from "../common/player-avatar";
import { SectionCard } from "../common/section-card";

export function DashboardPage({ data, paletteMap }) {
  const rummy = data.gameTypes.find((item) => item.name === "Rummy");
  const carroms = data.gameTypes.find((item) => item.name === "Carroms");
  const labels = data.rankings.map((item) => item.username);

  return (
    <Stack spacing={3}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard label="Players" value={data.users.length} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard label="Sessions" value={data.sessions.length} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard label="Game Types" value={data.gameTypes.length} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard label="Scores Logged" value={data.scores.length} />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <SectionCard title="Overall rankings">
            <Stack spacing={2}>
              {data.rankings.map((item, index) => {
                const user = data.users.find((entry) => entry.user_id === item.user_id);
                return (
                  <Stack key={item.user_id} direction="row" spacing={2} alignItems="center">
                    <Typography variant="h6" color="text.secondary" sx={{ width: 24 }}>
                      {index + 1}
                    </Typography>
                    <PlayerAvatar
                      uid={item.user_id}
                      name={item.username}
                      photoUrl={user?.photo_url}
                      paletteMap={paletteMap}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography fontWeight={700}>{item.username}</Typography>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(100, (item.total_score / 300) * 100)}
                        sx={{ mt: 1, height: 6, borderRadius: 999 }}
                      />
                    </Box>
                    <Box sx={{ textAlign: "right" }}>
                      <Typography fontWeight={700}>{item.total_score}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.win_pct}% wins
                      </Typography>
                    </Box>
                  </Stack>
                );
              })}
            </Stack>
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <SectionCard title="Win percentage">
            <BarChart
              data={{
                labels,
                datasets: [
                  {
                    data: data.rankings.map((item) => item.win_pct),
                    backgroundColor: "#2457A6",
                    borderRadius: 6,
                  },
                ],
              }}
              options={{
                scales: {
                  y: {
                    min: 0,
                    max: 100,
                    ticks: { callback: (value) => `${value}%` },
                  },
                  x: { grid: { display: false } },
                },
              }}
            />
          </SectionCard>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <SectionCard title="Score by game type">
            <Stack spacing={2}>
              <Stack direction="row" spacing={1}>
                <Chip label="Rummy" color="primary" variant="outlined" />
                <Chip label="Carroms" color="success" variant="outlined" />
              </Stack>
              <BarChart
                data={{
                  labels,
                  datasets: [
                    {
                      label: "Rummy",
                      data: data.rankings.map(
                        (item) =>
                          item.game_types_played.find((entry) => entry.game_type_id === rummy?.game_type_id)
                            ?.total_score || 0
                      ),
                      backgroundColor: "#2457A6",
                      borderRadius: 6,
                    },
                    {
                      label: "Carroms",
                      data: data.rankings.map(
                        (item) =>
                          item.game_types_played.find((entry) => entry.game_type_id === carroms?.game_type_id)
                            ?.total_score || 0
                      ),
                      backgroundColor: "#178A5B",
                      borderRadius: 6,
                    },
                  ],
                }}
                options={{
                  scales: {
                    x: { grid: { display: false } },
                  },
                }}
              />
            </Stack>
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <SectionCard title="All-rounder analysis">
            <Stack spacing={2}>
              {data.allrounders.map((item) => {
                const user = data.users.find((entry) => entry.user_id === item.user_id);
                return (
                  <Stack key={item.user_id} direction="row" spacing={2} alignItems="center">
                    <PlayerAvatar
                      uid={item.user_id}
                      name={item.username}
                      photoUrl={user?.photo_url}
                      paletteMap={paletteMap}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography fontWeight={700}>{item.username}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.game_types_played.length} type(s) · {item.total_games} sessions
                      </Typography>
                    </Box>
                    <Chip
                      label={item.is_allrounder ? "All-rounder" : "Specialist"}
                      color={item.is_allrounder ? "warning" : "default"}
                      variant={item.is_allrounder ? "filled" : "outlined"}
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
