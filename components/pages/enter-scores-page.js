"use client";

import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import {
  Button,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { SectionCard } from "../common/section-card";

export function EnterScoresPage({
  data,
  gameId,
  selectedGameTypeId,
  scoreEntries,
  onChangeGameId,
  onChangeGameType,
  onAddScoreRow,
  onUpdateScoreEntry,
  onRemoveScoreEntry,
  onSubmit,
}) {
  const recentSessions = [...data.sessions].reverse().slice(0, 3);

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} lg={6}>
        <SectionCard title="Session details">
          <Stack spacing={2}>
            <TextField
              label="Game ID"
              value={gameId}
              onChange={(event) => onChangeGameId(event.target.value)}
              placeholder="e.g. G4"
            />
            <TextField
              select
              label="Game type"
              value={selectedGameTypeId}
              onChange={(event) => onChangeGameType(event.target.value)}
            >
              {data.gameTypes.map((item) => (
                <MenuItem key={item.game_type_id} value={item.game_type_id}>
                  {item.name}
                </MenuItem>
              ))}
            </TextField>

            <Typography variant="subtitle2">Participants and scores</Typography>

            {scoreEntries.map((entry, index) => (
              <Grid container spacing={1} key={`${index}-${entry.user_id}`}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    value={entry.user_id}
                    onChange={(event) => onUpdateScoreEntry(index, "user_id", event.target.value)}
                  >
                    {data.users.map((user) => (
                      <MenuItem key={user.user_id} value={user.user_id}>
                        {user.username}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={10} sm={4}>
                  <TextField
                    fullWidth
                    type="number"
                    value={entry.score}
                    onChange={(event) => onUpdateScoreEntry(index, "score", event.target.value)}
                    placeholder="Score"
                  />
                </Grid>
                <Grid item xs={2} sm={2}>
                  <IconButton color="error" onClick={() => onRemoveScoreEntry(index)}>
                    <DeleteOutlineIcon />
                  </IconButton>
                </Grid>
              </Grid>
            ))}

            <Stack direction="row" spacing={1}>
              <Button startIcon={<AddIcon />} variant="outlined" onClick={onAddScoreRow}>
                Add player
              </Button>
              <Button variant="contained" onClick={onSubmit}>
                Submit session
              </Button>
            </Stack>
          </Stack>
        </SectionCard>
      </Grid>

      <Grid item xs={12} lg={6}>
        <SectionCard title="Recent sessions">
          <Stack spacing={2}>
            {recentSessions.map((session) => {
              const gameType = data.gameTypes.find((item) => item.game_type_id === session.game_type_id);
              const topScore = data.scores
                .filter((item) => item.game_id === session.game_id)
                .sort((a, b) => b.score - a.score)[0];
              const winner = topScore
                ? data.users.find((item) => item.user_id === topScore.user_id)
                : null;

              return (
                <Stack key={session.game_id} direction="row" justifyContent="space-between" spacing={2}>
                  <Stack>
                    <Typography fontWeight={700}>
                      {session.game_id} · {gameType?.name || ""}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {(session.played_at || "").split("T")[0]}
                    </Typography>
                  </Stack>
                  {winner ? (
                    <Typography variant="body2" color="text.secondary">
                      Winner: <strong>{winner.username}</strong> ({topScore.score})
                    </Typography>
                  ) : null}
                </Stack>
              );
            })}
          </Stack>
        </SectionCard>
      </Grid>
    </Grid>
  );
}
