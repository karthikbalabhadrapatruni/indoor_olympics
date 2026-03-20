"use client";

import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import {
  Box,
  Button,
  Card,
  Chip,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { SectionCard } from "../common/section-card";

const SCORING_MODE_OPTIONS = [
  { value: "highest", label: "Highest score wins" },
  { value: "lowest", label: "Lowest score wins" },
];

export function GameTypesPage({
  gameTypes,
  createForm,
  editForms,
  savingCreate,
  savingEditId,
  onChangeCreateForm,
  onCreateGameType,
  onChangeEditForm,
  onSaveEditForm,
}) {
  return (
    <Stack spacing={3}>
      <Grid container spacing={2}>
        <Grid item xs={12} lg={4}>
          <Card
            sx={{
              p: { xs: 2.25, md: 3 },
              height: "100%",
              borderRadius: 5,
              background: "linear-gradient(160deg, rgba(36,87,166,0.08), rgba(11,122,117,0.14))",
            }}
          >
            <Stack spacing={2}>
              <Stack spacing={0.75}>
                <Typography variant="overline" color="text.secondary">
                  New game type
                </Typography>
                <Typography variant="h5">Define how a game is scored</Typography>
                <Typography variant="body2" color="text.secondary">
                  Add reusable formats like Rummy, Carrom, or Foosball so every room follows the right rules.
                </Typography>
              </Stack>

              <TextField
                label="Game type name"
                value={createForm.name}
                onChange={(event) => onChangeCreateForm("name", event.target.value)}
                placeholder="Rummy"
              />
              <TextField
                select
                label="Scoring rule"
                value={createForm.scoringMode}
                onChange={(event) => onChangeCreateForm("scoringMode", event.target.value)}
              >
                {SCORING_MODE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Description"
                value={createForm.description}
                onChange={(event) => onChangeCreateForm("description", event.target.value)}
                placeholder="Lower score wins after each round"
                multiline
                minRows={3}
              />
              <Button
                variant="contained"
                startIcon={<AutoAwesomeRoundedIcon />}
                onClick={onCreateGameType}
                disabled={savingCreate}
              >
                {savingCreate ? "Creating..." : "Create game type"}
              </Button>
            </Stack>
          </Card>
        </Grid>

        <Grid item xs={12} lg={8}>
          <SectionCard title="Configured game types">
            <Stack spacing={2}>
              {gameTypes.length ? (
                gameTypes.map((gameType) => {
                  const form = editForms[gameType.game_type_id] || {
                    name: gameType.name,
                    scoringMode: gameType.scoring_mode || "highest",
                    description: gameType.description || "",
                  };

                  return (
                    <Card
                      key={gameType.game_type_id}
                      variant="outlined"
                      sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 4 }}
                    >
                      <Stack spacing={2}>
                        <Stack
                          direction={{ xs: "column", md: "row" }}
                          justifyContent="space-between"
                          alignItems={{ xs: "flex-start", md: "center" }}
                          spacing={1.5}
                        >
                          <Box>
                            <Typography variant="h6">{gameType.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              ID: {gameType.game_type_id}
                            </Typography>
                          </Box>
                          <Chip
                            label={
                              form.scoringMode === "lowest" ? "Lowest score wins" : "Highest score wins"
                            }
                            color="primary"
                            variant="outlined"
                          />
                        </Stack>

                        <Grid container spacing={2}>
                          <Grid item xs={12} md={5}>
                            <TextField
                              fullWidth
                              label="Name"
                              value={form.name}
                              onChange={(event) =>
                                onChangeEditForm(gameType.game_type_id, "name", event.target.value)
                              }
                            />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <TextField
                              select
                              fullWidth
                              label="Scoring rule"
                              value={form.scoringMode}
                              onChange={(event) =>
                                onChangeEditForm(gameType.game_type_id, "scoringMode", event.target.value)
                              }
                            >
                              {SCORING_MODE_OPTIONS.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                  {option.label}
                                </MenuItem>
                              ))}
                            </TextField>
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <Button
                              fullWidth
                              variant="contained"
                              startIcon={<SaveRoundedIcon />}
                              sx={{ height: "100%", minHeight: 56 }}
                              onClick={() => onSaveEditForm(gameType.game_type_id)}
                              disabled={savingEditId === gameType.game_type_id}
                            >
                              {savingEditId === gameType.game_type_id ? "Saving..." : "Save"}
                            </Button>
                          </Grid>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              label="Description"
                              value={form.description}
                              onChange={(event) =>
                                onChangeEditForm(gameType.game_type_id, "description", event.target.value)
                              }
                              multiline
                              minRows={3}
                            />
                          </Grid>
                        </Grid>
                      </Stack>
                    </Card>
                  );
                })
              ) : (
                <Typography color="text.secondary">
                  No game types yet. Create the first one from the panel on the left.
                </Typography>
              )}
            </Stack>
          </SectionCard>
        </Grid>
      </Grid>
    </Stack>
  );
}
