"use client";

import {
  Chip,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import { PlayerAvatar } from "../common/player-avatar";
import { SectionCard } from "../common/section-card";

export function PlayersPage({ data, paletteMap }) {
  return (
    <SectionCard title="Players">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Player</TableCell>
            <TableCell>Games</TableCell>
            <TableCell>Total score</TableCell>
            <TableCell>Win rate</TableCell>
            <TableCell>Wins</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.rankings.map((item) => {
            const user = data.users.find((entry) => entry.user_id === item.user_id);
            return (
              <TableRow key={item.user_id}>
                <TableCell>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <PlayerAvatar
                      uid={item.user_id}
                      name={item.username}
                      photoUrl={user?.photo_url}
                      paletteMap={paletteMap}
                    />
                    <span>{item.username}</span>
                  </Stack>
                </TableCell>
                <TableCell>{item.total_games}</TableCell>
                <TableCell>{item.total_score}</TableCell>
                <TableCell sx={{ minWidth: 150 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <LinearProgress
                      variant="determinate"
                      value={item.win_pct}
                      sx={{ flex: 1, height: 6, borderRadius: 999 }}
                    />
                    <span>{item.win_pct}%</span>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Chip label={`${item.total_wins} W`} color="success" variant="outlined" />
                </TableCell>
                <TableCell>
                  <Chip
                    label={item.game_types_played.length >= 2 ? "All-rounder" : "Specialist"}
                    color={item.game_types_played.length >= 2 ? "warning" : "default"}
                    variant={item.game_types_played.length >= 2 ? "filled" : "outlined"}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </SectionCard>
  );
}
