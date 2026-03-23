"use client";

import {
  Box,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { PlayerAvatar } from "../common/player-avatar";
import { SectionCard } from "../common/section-card";

export function GamesPage({ data, paletteMap, gameTypeFilter, onChangeGameTypeFilter }) {
  const filteredSessions =
    gameTypeFilter === "all"
      ? data.sessions
      : data.sessions.filter((session) => {
          const gameType = data.gameTypes.find((item) => item.name === gameTypeFilter);
          return session.game_type_id === gameType?.game_type_id;
        });

  return (
    <Stack spacing={2}>
      <ToggleButtonGroup
        exclusive
        value={gameTypeFilter}
        onChange={(_, value) => value && onChangeGameTypeFilter(value)}
        size="small"
      >
        <ToggleButton value="all">All</ToggleButton>
        {data.gameTypes.map((item) => (
          <ToggleButton key={item.game_type_id} value={item.name}>
            {item.name}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <Stack spacing={2}>
        {[...filteredSessions].reverse().map((session) => {
          const gameType = data.gameTypes.find((item) => item.game_type_id === session.game_type_id);
          const sessionScores = data.scores
            .filter((item) => item.game_id === session.game_id)
            .sort((a, b) => b.score - a.score);

          return (
            <SectionCard
              key={session.game_id}
              title={session.game_id}
              action={<Chip label={gameType?.name || ""} color="primary" variant="outlined" />}
            >
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Session results
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {(session.played_at || "").split("T")[0]}
                </Typography>
              </Box>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Player</TableCell>
                    <TableCell>Score</TableCell>
                    <TableCell>Result</TableCell>
                    <TableCell>Rank</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sessionScores.map((score, index) => {
                    const user = data.users.find((item) => item.user_id === score.user_id);
                    return (
                      <TableRow key={score.score_id}>
                        <TableCell>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <PlayerAvatar
                              uid={score.user_id}
                              name={user?.username || score.user_id}
                              photoUrl={user?.photo_url}
                              size={32}
                              paletteMap={paletteMap}
                            />
                            <span>{user?.username || score.user_id}</span>
                          </Stack>
                        </TableCell>
                        <TableCell>{score.score}</TableCell>
                        <TableCell>
                          <Chip
                            label={score.is_winner ? "Winner" : "-"}
                            color={score.is_winner ? "success" : "default"}
                            variant={score.is_winner ? "filled" : "outlined"}
                          />
                        </TableCell>
                        <TableCell>#{index + 1}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </SectionCard>
          );
        })}
      </Stack>
    </Stack>
  );
}
