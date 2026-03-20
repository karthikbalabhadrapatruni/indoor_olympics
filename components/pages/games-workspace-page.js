"use client";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import GroupAddRoundedIcon from "@mui/icons-material/GroupAddRounded";
import ScoreboardRoundedIcon from "@mui/icons-material/ScoreboardRounded";
import {
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { ListControls } from "../common/list-controls";
import { PlayerAvatar } from "../common/player-avatar";
import { SectionCard } from "../common/section-card";

const SORT_OPTIONS = [
  { label: "Most recent", value: "played_at" },
  { label: "Title", value: "title" },
  { label: "Game ID", value: "game_id" },
];

export function GamesWorkspacePage({
  data,
  paletteMap,
  gameTypeFilter,
  onChangeGameTypeFilter,
  createGameForm,
  onChangeCreateGameForm,
  onCreateGame,
  addPlayersState,
  onOpenAddPlayers,
  onCloseAddPlayers,
  onChangeUsersToAdd,
  onSubmitAddPlayers,
  scoreDialogState,
  onOpenScoreDialog,
  onCloseScoreDialog,
  onChangeScoreEntry,
  onSubmitScores,
  sessions,
  sessionsPagination,
  sessionsSorting,
  onChangeSessionsPage,
  onChangeSessionsPageSize,
  onChangeSessionsSortBy,
  onChangeSessionsSortOrder,
}) {
  const addPlayersOptions = addPlayersState.game
    ? data.users.filter(
        (user) => !addPlayersState.game.members.some((member) => member.user_id === user.user_id)
      )
    : [];

  function groupScoresByRound(scores) {
    const grouped = new Map();
    for (const score of scores) {
      const roundNumber = score.round_number || 1;
      if (!grouped.has(roundNumber)) {
        grouped.set(roundNumber, []);
      }
      grouped.get(roundNumber).push(score);
    }

    return [...grouped.entries()]
      .sort((left, right) => right[0] - left[0])
      .map(([roundNumber, items]) => ({
        roundNumber,
        items: [...items].sort((left, right) => right.score - left.score),
      }));
  }

  return (
    <>
      <Stack spacing={3}>
        <Grid container spacing={2}>
          <Grid item xs={12} lg={4}>
            <Card
              sx={{
                p: 3,
                height: "100%",
                background: "linear-gradient(160deg, rgba(36,87,166,0.08), rgba(11,122,117,0.12))",
              }}
            >
              <Stack spacing={2}>
                <Typography variant="overline" color="text.secondary">
                  Create a room
                </Typography>
                <Typography variant="h5">Spin up a new game in seconds</Typography>
                <TextField
                  label="Game title"
                  value={createGameForm.title}
                  onChange={(event) => onChangeCreateGameForm("title", event.target.value)}
                  placeholder="Friday Rummy Night"
                />
                <TextField
                  select
                  label="Game type"
                  value={createGameForm.gameTypeId}
                  onChange={(event) => onChangeCreateGameForm("gameTypeId", event.target.value)}
                >
                  {data.gameTypes.map((item) => (
                    <MenuItem key={item.game_type_id} value={item.game_type_id}>
                      {item.name} · {item.scoring_mode === "lowest" ? "Lowest score wins" : "Highest score wins"}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="Visibility"
                  value={createGameForm.visibility}
                  onChange={(event) => onChangeCreateGameForm("visibility", event.target.value)}
                >
                  <MenuItem value="public">Public</MenuItem>
                  <MenuItem value="private">Private</MenuItem>
                </TextField>
                <Button startIcon={<AddRoundedIcon />} variant="contained" onClick={onCreateGame}>
                  Create game
                </Button>
              </Stack>
            </Card>
          </Grid>
          <Grid item xs={12} lg={8}>
            <SectionCard title="Your rooms">
              <Stack spacing={2}>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip
                    label="All"
                    color={gameTypeFilter === "all" ? "primary" : "default"}
                    variant={gameTypeFilter === "all" ? "filled" : "outlined"}
                    onClick={() => onChangeGameTypeFilter("all")}
                  />
                  {data.gameTypes.map((item) => (
                    <Chip
                      key={item.game_type_id}
                      label={item.name}
                      color={gameTypeFilter === item.name ? "primary" : "default"}
                      variant={gameTypeFilter === item.name ? "filled" : "outlined"}
                      onClick={() => onChangeGameTypeFilter(item.name)}
                    />
                  ))}
                </Stack>
                <ListControls
                  page={sessionsPagination.page}
                  totalPages={sessionsPagination.totalPages}
                  pageSize={sessionsPagination.pageSize}
                  sortBy={sessionsSorting.sortBy}
                  sortOrder={sessionsSorting.sortOrder}
                  sortOptions={SORT_OPTIONS}
                  total={sessionsPagination.total}
                  onChangePage={onChangeSessionsPage}
                  onChangePageSize={onChangeSessionsPageSize}
                  onChangeSortBy={onChangeSessionsSortBy}
                  onChangeSortOrder={onChangeSessionsSortOrder}
                />
              </Stack>
            </SectionCard>
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          {sessions.map((session) => {
            const gameType = data.gameTypes.find((entry) => entry.game_type_id === session.game_type_id);
            const roundGroups = groupScoresByRound(session.recent_scores || []);

            return (
              <Grid item xs={12} xl={6} key={session.game_id}>
                <Card sx={{ p: 3, height: "100%" }}>
                  <Stack spacing={2.5}>
                    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2}>
                      <Stack spacing={0.75}>
                        <Typography variant="h5">{session.title}</Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          <Chip label={gameType?.name || "Game"} color="primary" variant="outlined" />
                          <Chip label={session.game_id} variant="outlined" />
                          <Chip label={(session.played_at || "").split("T")[0]} variant="outlined" />
                          <Chip label={session.visibility || "public"} variant="outlined" />
                        </Stack>
                      </Stack>
                      <Stack direction="row" spacing={1}>
                        {session.can_manage ? (
                          <Button
                            startIcon={<GroupAddRoundedIcon />}
                            variant="outlined"
                            onClick={() => onOpenAddPlayers(session)}
                          >
                            Add players
                          </Button>
                        ) : null}
                        <Button
                          startIcon={<ScoreboardRoundedIcon />}
                          variant="contained"
                          onClick={() => onOpenScoreDialog(session)}
                        >
                          Log scores
                        </Button>
                      </Stack>
                    </Stack>

                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Players with access
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        {session.members.map((member) => (
                          <Chip
                            key={member.access_id}
                            avatar={
                              <PlayerAvatar
                                uid={member.user_id}
                                name={member.username}
                                photoUrl={member.photo_url}
                                paletteMap={paletteMap}
                                size={24}
                              />
                            }
                            label={member.username}
                            variant="outlined"
                            sx={{ pl: 0.5 }}
                          />
                        ))}
                      </Stack>
                    </Box>

                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Round logs
                      </Typography>
                      <Stack spacing={1}>
                        {roundGroups.length ? (
                          roundGroups.map((group) => (
                            <Stack key={`${session.game_id}-round-${group.roundNumber}`} spacing={1}>
                              <Typography variant="caption" color="text.secondary">
                                Round {group.roundNumber}
                              </Typography>
                              {group.items.map((score) => {
                                const user = data.users.find((entry) => entry.user_id === score.user_id);
                                return (
                                  <Stack
                                    key={score.score_id}
                                    direction="row"
                                    alignItems="center"
                                    justifyContent="space-between"
                                    sx={{ p: 1.5, borderRadius: 3, bgcolor: "grey.50" }}
                                  >
                                    <Stack direction="row" spacing={1.5} alignItems="center">
                                      <PlayerAvatar
                                        uid={score.user_id}
                                        name={user?.username || score.user_id}
                                        photoUrl={user?.photo_url || user?.avatar_url}
                                        paletteMap={paletteMap}
                                        size={32}
                                      />
                                      <Typography fontWeight={700}>{user?.username || score.user_id}</Typography>
                                    </Stack>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                      <Typography fontWeight={700}>{score.score}</Typography>
                                      <Chip
                                        label={score.is_winner ? "Winner" : "Played"}
                                        color={score.is_winner ? "success" : "default"}
                                        variant={score.is_winner ? "filled" : "outlined"}
                                      />
                                    </Stack>
                                  </Stack>
                                );
                              })}
                            </Stack>
                          ))
                        ) : (
                          <Typography color="text.secondary">No scores logged for this game yet.</Typography>
                        )}
                      </Stack>
                    </Box>
                  </Stack>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Stack>

      <Dialog open={Boolean(addPlayersState.game)} onClose={onCloseAddPlayers} fullWidth maxWidth="sm">
        <DialogTitle>Add players to game</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography color="text.secondary">
              Invite existing GameTracker users into {addPlayersState.game?.title}.
            </Typography>
            <FormControl fullWidth>
              <InputLabel id="add-players-label">Players</InputLabel>
              <Select
                labelId="add-players-label"
                multiple
                value={addPlayersState.userIds}
                onChange={(event) => onChangeUsersToAdd(event.target.value)}
                input={<OutlinedInput label="Players" />}
              >
                {addPlayersOptions.map((user) => (
                  <MenuItem key={user.user_id} value={user.user_id}>
                    {user.username}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseAddPlayers}>Cancel</Button>
          <Button variant="contained" onClick={onSubmitAddPlayers}>
            Add selected players
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(scoreDialogState.game)} onClose={onCloseScoreDialog} fullWidth maxWidth="sm">
        <DialogTitle>Log scores</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography color="text.secondary">
              Enter the latest scores for {scoreDialogState.game?.title}.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This will be saved as Round {scoreDialogState.nextRoundNumber || 1}.
            </Typography>
            {scoreDialogState.entries.map((entry, index) => {
              const user = data.users.find((item) => item.user_id === entry.user_id);
              return (
                <Stack key={`${entry.user_id}-${index}`} direction="row" spacing={2} alignItems="center">
                  <Box sx={{ minWidth: 120 }}>
                    <Typography fontWeight={700}>{user?.username || entry.user_id}</Typography>
                  </Box>
                  <TextField
                    fullWidth
                    type="number"
                    value={entry.score}
                    onChange={(event) => onChangeScoreEntry(index, event.target.value)}
                    placeholder="Score"
                  />
                </Stack>
              );
            })}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseScoreDialog}>Cancel</Button>
          <Button variant="contained" onClick={onSubmitScores}>
            Save scores
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
