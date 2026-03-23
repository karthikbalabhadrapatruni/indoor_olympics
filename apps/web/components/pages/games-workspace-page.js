"use client";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import GroupAddRoundedIcon from "@mui/icons-material/GroupAddRounded";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import ScoreboardRoundedIcon from "@mui/icons-material/ScoreboardRounded";
import {
  alpha,
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
  useTheme,
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
  sessionLeaderboardState,
  onOpenSessionLeaderboard,
  onCloseSessionLeaderboard,
  onEndGame,
  onGenerateCommentary,
  sessions,
  sessionsPagination,
  sessionsSorting,
  onChangeSessionsPage,
  onChangeSessionsPageSize,
  onChangeSessionsSortBy,
  onChangeSessionsSortOrder,
}) {
  const theme = useTheme();
  const mutedSurface = theme.palette.mode === "dark" ? alpha("#FFFFFF", 0.04) : "rgba(15, 23, 42, 0.03)";
  const softSurface = theme.palette.mode === "dark" ? alpha("#FFFFFF", 0.03) : theme.palette.grey[50];
  const addPlayersOptions = addPlayersState.game
    ? data.users.filter(
        (user) => !addPlayersState.game.members.some((member) => member.user_id === user.user_id)
      )
    : [];

  function groupScoresByRound(scores) {
    const grouped = new Map();
    for (const score of scores) {
      const roundNumber = score.round_number || 0;
      if (!grouped.has(roundNumber)) {
        grouped.set(roundNumber, []);
      }
      grouped.get(roundNumber).push(score);
    }

    return [...grouped.entries()]
      .sort((left, right) => right[0] - left[0])
      .map(([roundNumber, items]) => ({
        roundNumber,
        items,
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
                borderRadius: 4,
                background:
                  theme.palette.mode === "dark"
                    ? "linear-gradient(160deg, rgba(139,184,255,0.10), rgba(111,215,203,0.08))"
                    : "linear-gradient(160deg, rgba(36,87,166,0.08), rgba(11,122,117,0.12))",
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
            <SectionCard
              title="Rooms"
              action={
                <TextField
                  select
                  size="small"
                  label="Game type"
                  value={gameTypeFilter}
                  onChange={(event) => onChangeGameTypeFilter(event.target.value)}
                  sx={{ minWidth: { xs: "100%", md: 220 } }}
                >
                  <MenuItem value="all">All game types</MenuItem>
                  {data.gameTypes.map((item) => (
                    <MenuItem key={item.game_type_id} value={item.name}>
                      {item.name}
                    </MenuItem>
                  ))}
                </TextField>
              }
            >
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 3,
                  bgcolor: mutedSurface,
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
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
              </Box>
            </SectionCard>
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          {sessions.map((session) => {
            const gameType = data.gameTypes.find((entry) => entry.game_type_id === session.game_type_id);
            const scoringMode = gameType?.scoring_mode || "highest";
            const roundGroups = groupScoresByRound(session.recent_scores || []).map((group) => {
              const sortedItems = [...group.items].sort((left, right) => {
                if (Boolean(right.is_winner) !== Boolean(left.is_winner)) {
                  return Number(right.is_winner) - Number(left.is_winner);
                }
                return scoringMode === "lowest" ? left.score - right.score : right.score - left.score;
              });

              return {
                ...group,
                items: sortedItems,
                winners: sortedItems.filter((item) => item.is_winner),
              };
            });

            return (
              <Grid item xs={12} xl={6} key={session.game_id}>
                <Card sx={{ p: 3, height: "100%", borderRadius: 4 }}>
                  <Stack spacing={2.5}>
                    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2}>
                      <Stack spacing={0.75}>
                        <Typography variant="h5">{session.title}</Typography>
                        <Typography color="text.secondary">
                          {gameType?.name || "Game"} · {(session.played_at || "").split("T")[0]} ·{" "}
                          {session.visibility || "public"} · {session.round_count || 0} rounds
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: session.status === "ended" ? "text.secondary" : "success.main",
                            fontWeight: 700,
                            letterSpacing: "0.04em",
                            textTransform: "uppercase",
                          }}
                        >
                          {session.status === "ended" ? "Ended" : "Active"}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="flex-end">
                        <Button
                          startIcon={<EmojiEventsRoundedIcon />}
                          variant="outlined"
                          onClick={() => onOpenSessionLeaderboard(session)}
                        >
                          View leaderboard
                        </Button>
                        <Button
                          startIcon={<SmartToyRoundedIcon />}
                          variant="outlined"
                          onClick={() => onGenerateCommentary(session)}
                        >
                          Test AI
                        </Button>
                        {session.can_manage && session.status !== "ended" ? (
                          <Button
                            startIcon={<GroupAddRoundedIcon />}
                            variant="outlined"
                            onClick={() => onOpenAddPlayers(session)}
                          >
                            Add players
                          </Button>
                        ) : null}
                        {session.status !== "ended" ? (
                          <Button
                            startIcon={<ScoreboardRoundedIcon />}
                            variant="contained"
                            onClick={() => onOpenScoreDialog(session)}
                          >
                            Log scores
                          </Button>
                        ) : null}
                        {session.can_manage && session.status !== "ended" ? (
                          <Button
                            startIcon={<FlagRoundedIcon />}
                            color="inherit"
                            variant="outlined"
                            onClick={() => onEndGame(session)}
                          >
                            End game
                          </Button>
                        ) : null}
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
                            sx={{ pl: 0.5, borderRadius: 2.5 }}
                          />
                        ))}
                      </Stack>
                    </Box>

                    {session.latest_commentary?.content ? (
                      <Box
                        sx={{
                          p: 1.75,
                          borderRadius: 3,
                          bgcolor: mutedSurface,
                          border: `1px solid ${theme.palette.divider}`,
                        }}
                      >
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.75 }}>
                          AI match commentary
                        </Typography>
                        <Typography sx={{ whiteSpace: "pre-line" }}>
                          {session.latest_commentary.content}
                        </Typography>
                      </Box>
                    ) : null}

                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Round logs
                      </Typography>
                      <Stack spacing={1.5}>
                        {roundGroups.length ? (
                          roundGroups.map((group) => (
                            <Card
                              key={`${session.game_id}-round-${group.roundNumber}`}
                              variant="outlined"
                              sx={{ p: 2, borderRadius: 3, bgcolor: "rgba(255,255,255,0.72)" }}
                            >
                              <Stack spacing={1.25}>
                                <Stack
                                  direction={{ xs: "column", sm: "row" }}
                                  justifyContent="space-between"
                                  alignItems={{ xs: "flex-start", sm: "center" }}
                                  spacing={1}
                                >
                                  <Typography variant="subtitle1" fontWeight={700}>
                                    Round {group.roundNumber}
                                  </Typography>
                                  <Stack direction="row" spacing={1} flexWrap="wrap">
                                    {group.winners.map((winner) => {
                                      const winnerUser = data.users.find((entry) => entry.user_id === winner.user_id);
                                      return (
                                        <Chip
                                          key={`${winner.score_id}-winner`}
                                          label={`Winner: ${winnerUser?.username || winner.user_id}`}
                                          color="success"
                                          sx={{ borderRadius: 2 }}
                                        />
                                      );
                                    })}
                                  </Stack>
                                </Stack>
                                {group.items.map((score) => {
                                  const user = data.users.find((entry) => entry.user_id === score.user_id);
                                  return (
                                    <Stack
                                      key={score.score_id}
                                      direction="row"
                                      alignItems="center"
                                      justifyContent="space-between"
                                      sx={{ p: 1.5, borderRadius: 3, bgcolor: softSurface }}
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
                                          sx={{ borderRadius: 2 }}
                                        />
                                      </Stack>
                                    </Stack>
                                  );
                                })}
                              </Stack>
                            </Card>
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

      <Dialog
        open={Boolean(sessionLeaderboardState.game)}
        onClose={onCloseSessionLeaderboard}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{sessionLeaderboardState.game?.title} leaderboard</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography color="text.secondary">
              Session totals across all rounds played in this room.
            </Typography>
            {(sessionLeaderboardState.game?.session_leaderboard || []).length ? (
              sessionLeaderboardState.game.session_leaderboard.map((entry, index) => (
                <Stack
                  key={`${entry.user_id}-leaderboard`}
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ p: 1.5, borderRadius: 2.5, bgcolor: softSurface }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Typography sx={{ width: 20, color: "text.secondary" }}>{index + 1}</Typography>
                    <PlayerAvatar
                      uid={entry.user_id}
                      name={entry.username}
                      photoUrl={entry.photo_url}
                      paletteMap={paletteMap}
                      size={32}
                    />
                    <Stack>
                      <Typography fontWeight={700}>{entry.username}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {entry.rounds_won} rounds won · {entry.rounds_played} rounds played
                      </Typography>
                    </Stack>
                  </Stack>
                  <Typography fontWeight={800}>{entry.total_score}</Typography>
                </Stack>
              ))
            ) : (
              <Typography color="text.secondary">No round scores have been logged yet.</Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseSessionLeaderboard}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
