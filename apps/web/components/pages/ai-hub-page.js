"use client";

import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import ForumRoundedIcon from "@mui/icons-material/ForumRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import StarsRoundedIcon from "@mui/icons-material/StarsRounded";
import {
  alpha,
  Box,
  Button,
  Card,
  Chip,
  Grid,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { PlayerAvatar } from "../common/player-avatar";
import { SectionCard } from "../common/section-card";

function formatPeriodLabel(periodKey) {
  if (!periodKey) {
    return "this month";
  }

  const [year, month] = String(periodKey).split("-");
  if (!year || !month) {
    return periodKey;
  }

  return new Date(Number(year), Number(month) - 1, 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function AiHubPage({
  data,
  paletteMap,
  chatMessages,
  chatInput,
  chatLoading,
  onChangeChatInput,
  onSubmitChat,
  seasonRecapState,
  onChangeSeasonRecapPeriod,
  onGenerateSeasonRecap,
  rivalryState,
  onChangeRivalryGameTypeId,
  onGenerateRivalries,
}) {
  const theme = useTheme();
  const surface = theme.palette.mode === "dark" ? alpha("#FFFFFF", 0.03) : "rgba(15, 23, 42, 0.03)";
  const panel = theme.palette.mode === "dark" ? alpha("#FFFFFF", 0.04) : alpha(theme.palette.primary.main, 0.04);

  return (
    <Stack spacing={3}>
      <Card
        sx={{
          p: { xs: 2.5, md: 3.5 },
          borderRadius: 4,
          background:
            theme.palette.mode === "dark"
              ? "linear-gradient(145deg, rgba(139,184,255,0.12), rgba(111,215,203,0.08))"
              : "linear-gradient(145deg, rgba(36,87,166,0.08), rgba(11,122,117,0.10))",
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} lg={8}>
            <Stack spacing={1.5}>
              <Typography variant="overline" color="text.secondary">
                Agentic workspace
              </Typography>
              <Typography variant="h3" sx={{ maxWidth: 760 }}>
                Ask questions, generate rivalries, and turn game history into stories.
              </Typography>
              <Typography color="text.secondary" sx={{ maxWidth: 760 }}>
                This is the intelligence layer for your group. Use it to answer stats questions instantly,
                generate month-end recaps, and surface the matchups that matter most.
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip icon={<ForumRoundedIcon />} label="Stats chat" sx={{ borderRadius: 2 }} />
                <Chip icon={<LocalFireDepartmentRoundedIcon />} label="Rivalry stories" sx={{ borderRadius: 2 }} />
                <Chip icon={<StarsRoundedIcon />} label="Season recaps" sx={{ borderRadius: 2 }} />
              </Stack>
            </Stack>
          </Grid>
          <Grid item xs={12} lg={4}>
            <Card
              variant="outlined"
              sx={{
                p: 2.5,
                borderRadius: 3,
                bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === "dark" ? 0.6 : 0.72),
              }}
            >
              <Stack spacing={1.25}>
                <Typography variant="subtitle2" color="text.secondary">
                  What is live today
                </Typography>
                <Typography>
                  Match commentary is already running automatically whenever a new round gets logged.
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  Use the panels below to explore the rest of the AI stack without leaving the app.
                </Typography>
              </Stack>
            </Card>
          </Grid>
        </Grid>
      </Card>

      <Grid container spacing={3}>
        <Grid item xs={12} xl={7}>
          <SectionCard
            title="Stats Chat"
            action={
              <Chip
                icon={<BoltRoundedIcon />}
                label={chatLoading ? "Thinking..." : "Ready"}
                color={chatLoading ? "warning" : "success"}
                variant={chatLoading ? "filled" : "outlined"}
                sx={{ borderRadius: 2 }}
              />
            }
          >
            <Stack spacing={2}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 3,
                  border: `1px solid ${theme.palette.divider}`,
                  bgcolor: surface,
                  minHeight: 420,
                  maxHeight: 560,
                  overflowY: "auto",
                }}
              >
                <Stack spacing={1.25}>
                  {chatMessages.map((message, index) => (
                    <Stack
                      key={`${message.role}-${index}`}
                      direction={message.role === "user" ? "row-reverse" : "row"}
                      spacing={1.25}
                      alignItems="flex-start"
                    >
                      {message.role === "assistant" ? (
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: 2.5,
                            display: "grid",
                            placeItems: "center",
                            bgcolor: alpha(theme.palette.primary.main, 0.12),
                            color: "primary.main",
                            flexShrink: 0,
                          }}
                        >
                          <AutoAwesomeRoundedIcon fontSize="small" />
                        </Box>
                      ) : (
                        <PlayerAvatar
                          uid={data.me?.user_id}
                          name={data.me?.username}
                          photoUrl={data.me?.photo_url || data.me?.avatar_url}
                          paletteMap={paletteMap}
                          size={36}
                        />
                      )}
                      <Box
                        sx={{
                          maxWidth: "80%",
                          p: 1.5,
                          borderRadius: 3,
                          bgcolor:
                            message.role === "user"
                              ? theme.palette.primary.main
                              : alpha(theme.palette.background.paper, theme.palette.mode === "dark" ? 0.78 : 0.9),
                          color: message.role === "user" ? theme.palette.primary.contrastText : "text.primary",
                          border:
                            message.role === "user"
                              ? "none"
                              : `1px solid ${alpha(theme.palette.divider, 0.9)}`,
                        }}
                      >
                        <Typography variant="caption" sx={{ display: "block", mb: 0.5, opacity: 0.72 }}>
                          {message.role === "user" ? "You" : "AI analyst"}
                        </Typography>
                        <Typography sx={{ whiteSpace: "pre-line" }}>{message.content}</Typography>
                      </Box>
                    </Stack>
                  ))}
                  {chatLoading ? <LinearProgress sx={{ mt: 1, borderRadius: 999 }} /> : null}
                </Stack>
              </Box>

              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  maxRows={5}
                  label="Ask anything about your group"
                  placeholder="Who is my biggest rival in Uno?"
                  value={chatInput}
                  onChange={(event) => onChangeChatInput(event.target.value)}
                  onKeyDown={(event) => {
                    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                      event.preventDefault();
                      onSubmitChat();
                    }
                  }}
                />
                <Button
                  variant="contained"
                  onClick={onSubmitChat}
                  disabled={chatLoading || !chatInput.trim()}
                  sx={{ minWidth: { md: 140 } }}
                >
                  Send
                </Button>
              </Stack>

              <Stack direction="row" spacing={1} flexWrap="wrap">
                {[
                  "Who has the best win rate in Uno?",
                  "Who is my biggest rival?",
                  "How many total sessions have we played?",
                ].map((prompt) => (
                  <Chip
                    key={prompt}
                    label={prompt}
                    onClick={() => onChangeChatInput(prompt)}
                    variant="outlined"
                    sx={{ borderRadius: 2 }}
                  />
                ))}
              </Stack>
            </Stack>
          </SectionCard>
        </Grid>

        <Grid item xs={12} xl={5}>
          <Stack spacing={3}>
            <SectionCard
              title="Season Recap"
              action={
                <Button
                  variant="contained"
                  onClick={onGenerateSeasonRecap}
                  disabled={seasonRecapState.loading}
                >
                  {seasonRecapState.loading ? "Generating..." : "Generate"}
                </Button>
              }
            >
              <Stack spacing={2}>
                <TextField
                  type="month"
                  label="Period"
                  InputLabelProps={{ shrink: true }}
                  value={seasonRecapState.periodKey}
                  onChange={(event) => onChangeSeasonRecapPeriod(event.target.value)}
                />
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    bgcolor: panel,
                    border: `1px solid ${theme.palette.divider}`,
                    minHeight: 220,
                  }}
                >
                  {seasonRecapState.loading ? (
                    <Stack spacing={1.5}>
                      <Typography color="text.secondary">Generating recap for {formatPeriodLabel(seasonRecapState.periodKey)}...</Typography>
                      <LinearProgress sx={{ borderRadius: 999 }} />
                    </Stack>
                  ) : seasonRecapState.recap ? (
                    <Stack spacing={1.5}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <InsightsRoundedIcon color="primary" fontSize="small" />
                        <Typography variant="subtitle2">
                          {formatPeriodLabel(seasonRecapState.periodKey)}
                        </Typography>
                        {seasonRecapState.cached ? (
                          <Chip label="Cached" size="small" variant="outlined" sx={{ borderRadius: 2 }} />
                        ) : null}
                      </Stack>
                      <Typography sx={{ whiteSpace: "pre-line" }}>{seasonRecapState.recap}</Typography>
                    </Stack>
                  ) : (
                    <Typography color="text.secondary">
                      Generate a shareable month-end summary with standout performances, rivalries, and upsets.
                    </Typography>
                  )}
                </Box>
              </Stack>
            </SectionCard>

            <SectionCard
              title="Rivalry Tracker"
              action={
                <Button
                  variant="outlined"
                  onClick={onGenerateRivalries}
                  disabled={rivalryState.loading}
                >
                  {rivalryState.loading ? "Scanning..." : "Generate"}
                </Button>
              }
            >
              <Stack spacing={2}>
                <TextField
                  select
                  label="Game scope"
                  value={rivalryState.gameTypeId}
                  onChange={(event) => onChangeRivalryGameTypeId(event.target.value)}
                >
                  <MenuItem value="">All games</MenuItem>
                  {data.gameTypes.map((item) => (
                    <MenuItem key={item.game_type_id} value={item.game_type_id}>
                      {item.name}
                    </MenuItem>
                  ))}
                </TextField>

                <Stack spacing={1.5}>
                  {rivalryState.loading ? <LinearProgress sx={{ borderRadius: 999 }} /> : null}
                  {rivalryState.items.length ? (
                    rivalryState.items.map((rivalry, index) => (
                      <Card
                        key={`${rivalry.players?.join("-") || index}`}
                        variant="outlined"
                        sx={{ p: 2, borderRadius: 3, bgcolor: surface }}
                      >
                        <Stack spacing={1.25}>
                          <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                            <Typography variant="subtitle1" fontWeight={700}>
                              {(rivalry.players || []).join(" vs ")}
                            </Typography>
                            <Chip
                              label={`${rivalry.total_games || rivalry.games || 0} battles`}
                              size="small"
                              sx={{ borderRadius: 2 }}
                            />
                          </Stack>
                          {rivalry.narrative ? (
                            <Typography sx={{ whiteSpace: "pre-line" }}>{rivalry.narrative}</Typography>
                          ) : null}
                          <Typography variant="body2" color="text.secondary">
                            Close games: {rivalry.close_games || 0}
                          </Typography>
                        </Stack>
                      </Card>
                    ))
                  ) : (
                    <Typography color="text.secondary">
                      Generate rivalry intelligence to see the matchups that define your group.
                    </Typography>
                  )}
                </Stack>
              </Stack>
            </SectionCard>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
