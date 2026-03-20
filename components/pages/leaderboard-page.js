"use client";

import { Chip, Grid, LinearProgress, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { BarChart } from "../common/bar-chart";
import { ListControls } from "../common/list-controls";
import { PlayerAvatar } from "../common/player-avatar";
import { SectionCard } from "../common/section-card";

const SORT_OPTIONS = [
  { label: "Total score", value: "total_score" },
  { label: "Win rate", value: "win_pct" },
  { label: "Wins", value: "total_wins" },
  { label: "Games", value: "total_games" },
  { label: "Username", value: "username" },
];

export function LeaderboardPage({
  items,
  pagination,
  sorting,
  chartItems,
  gameTypes,
  selectedGameTypeId,
  userMap,
  paletteMap,
  onChangeGameTypeId,
  onChangePage,
  onChangePageSize,
  onChangeSortBy,
  onChangeSortOrder,
}) {
  const labels = chartItems.map((item) => item.username);

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} lg={7}>
        <SectionCard title="Overall leaderboard">
          <Stack spacing={2.5}>
            <TextField
              select
              label="Game"
              value={selectedGameTypeId}
              onChange={(event) => onChangeGameTypeId(event.target.value)}
              sx={{ maxWidth: 280 }}
            >
              {gameTypes.map((gameType) => (
                <MenuItem key={gameType.game_type_id} value={gameType.game_type_id}>
                  {gameType.name}
                </MenuItem>
              ))}
            </TextField>
            <ListControls
              page={pagination.page}
              totalPages={pagination.totalPages}
              pageSize={pagination.pageSize}
              sortBy={sorting.sortBy}
              sortOrder={sorting.sortOrder}
              sortOptions={SORT_OPTIONS}
              total={pagination.total}
              onChangePage={onChangePage}
              onChangePageSize={onChangePageSize}
              onChangeSortBy={onChangeSortBy}
              onChangeSortOrder={onChangeSortOrder}
            />

            {items.map((item, index) => {
              const user = userMap[item.user_id];
              return (
                <Stack key={item.user_id} direction="row" spacing={2} alignItems="center">
                  <Typography sx={{ width: 18, color: "text.secondary" }}>
                    {(pagination.page - 1) * pagination.pageSize + index + 1}
                  </Typography>
                  <PlayerAvatar
                    uid={item.user_id}
                    name={item.username}
                    photoUrl={user?.photo_url || user?.avatar_url}
                    paletteMap={paletteMap}
                  />
                  <Stack spacing={0.5} sx={{ flex: 1 }}>
                    <Typography fontWeight={700}>{item.username}</Typography>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(100, item.win_pct)}
                      sx={{ height: 8 }}
                    />
                  </Stack>
                  <Stack alignItems="flex-end">
                    <Typography fontWeight={700}>{item.total_score}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.total_wins} wins
                    </Typography>
                  </Stack>
                  <Chip
                    label={`${item.win_pct}% wins`}
                    color="primary"
                    variant="outlined"
                    sx={{ borderRadius: 2 }}
                  />
                </Stack>
              );
            })}
          </Stack>
        </SectionCard>
      </Grid>
      <Grid item xs={12} lg={5}>
        <SectionCard title="Win rate by player">
          <BarChart
            data={{
              labels,
              datasets: [
                {
                  data: chartItems.map((item) => item.win_pct),
                  backgroundColor: "#2457A6",
                  borderRadius: 8,
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
  );
}
