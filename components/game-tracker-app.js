"use client";

import { Alert, Snackbar, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { AuthLanding } from "./auth/auth-landing";
import { OnboardingScreen } from "./auth/onboarding-screen";
import { AppShell } from "./layout/app-shell";
import { HomeDashboardPage } from "./pages/home-dashboard-page";
import { GamesWorkspacePage } from "./pages/games-workspace-page";
import { LeaderboardPage } from "./pages/leaderboard-page";
import { ProfileHubPage } from "./pages/profile-hub-page";
import { useGameTrackerData } from "../hooks/use-game-tracker-data";
import { readPhotoFile } from "../lib/client/files";
import { apiRequest } from "../lib/client/api";
import { NAV_ITEMS } from "../lib/client/constants";

export default function GameTrackerApp({ sessionUser }) {
  const [activePage, setActivePage] = useState("dashboard");
  const [toast, setToast] = useState(null);
  const [authState, setAuthState] = useState({
    loading: Boolean(sessionUser),
    onboarded: false,
    appUser: null,
    error: "",
  });
  const [username, setUsername] = useState("");
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [gameTypeFilter, setGameTypeFilter] = useState("all");
  const [createGameForm, setCreateGameForm] = useState({ title: "", gameTypeId: "" });
  const [addPlayersState, setAddPlayersState] = useState({ game: null, userIds: [] });
  const [scoreDialogState, setScoreDialogState] = useState({ game: null, entries: [] });
  const [profileData, setProfileData] = useState(null);
  const [uploadingProfilePhoto, setUploadingProfilePhoto] = useState(false);
  const { data, loading, error, paletteMap, refresh } = useGameTrackerData(
    Boolean(sessionUser && authState.onboarded)
  );

  const activeMeta = useMemo(() => {
    return NAV_ITEMS.find((item) => item.id === activePage) || NAV_ITEMS[0];
  }, [activePage]);

  function showToast(message, severity = "success") {
    setToast({ message, severity });
  }

  useEffect(() => {
    if (!sessionUser) {
      setAuthState({ loading: false, onboarded: false, appUser: null, error: "" });
      return;
    }

    let cancelled = false;

    async function loadMe() {
      try {
        const result = await apiRequest("/api/me");
        if (!cancelled) {
          setAuthState({
            loading: false,
            onboarded: result.onboarded,
            appUser: result.appUser,
            error: "",
          });
          setUsername(result.appUser?.username || "");
        }
      } catch (requestError) {
        if (!cancelled) {
          setAuthState({ loading: false, onboarded: false, appUser: null, error: requestError.message });
        }
      }
    }

    loadMe();
    return () => {
      cancelled = true;
    };
  }, [sessionUser]);

  useEffect(() => {
    if (!data.gameTypes.length) {
      return;
    }
    setCreateGameForm((current) => ({
      ...current,
      gameTypeId: current.gameTypeId || data.gameTypes[0]?.game_type_id || "",
    }));
  }, [data.gameTypes]);

  useEffect(() => {
    if (!data.me?.user_id) {
      return;
    }

    let cancelled = false;
    async function loadProfile() {
      try {
        const result = await apiRequest(`/api/analytics?type=player&user_id=${data.me.user_id}`);
        if (!cancelled) {
          setProfileData(result);
        }
      } catch (requestError) {
        if (!cancelled) {
          showToast(requestError.message, "error");
        }
      }
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [data.me?.user_id]);

  async function handleOnboarding() {
    if (!username.trim()) {
      setAuthState((current) => ({ ...current, error: "Choose a username to continue" }));
      return;
    }

    try {
      setUsernameSaving(true);
      const user = await apiRequest("/api/me/profile", {
        method: "POST",
        body: { username: username.trim() },
      });
      setAuthState({ loading: false, onboarded: true, appUser: user, error: "" });
      await refresh();
      showToast("Workspace ready");
    } catch (requestError) {
      setAuthState((current) => ({ ...current, error: requestError.message }));
    } finally {
      setUsernameSaving(false);
    }
  }

  function changeCreateGameForm(field, value) {
    setCreateGameForm((current) => ({ ...current, [field]: value }));
  }

  async function handleCreateGame() {
    if (!createGameForm.title.trim()) {
      showToast("Give the game a title", "error");
      return;
    }

    try {
      await apiRequest("/api/game-sessions", {
        method: "POST",
        body: {
          title: createGameForm.title.trim(),
          game_type_id: createGameForm.gameTypeId,
        },
      });
      await refresh();
      setCreateGameForm((current) => ({ ...current, title: "" }));
      setActivePage("games");
      showToast("Game created");
    } catch (requestError) {
      showToast(requestError.message, "error");
    }
  }

  function openAddPlayers(game) {
    setAddPlayersState({ game, userIds: [] });
  }

  async function submitAddPlayers() {
    if (!addPlayersState.game || addPlayersState.userIds.length === 0) {
      showToast("Select at least one player", "error");
      return;
    }

    try {
      await apiRequest("/api/game-access", {
        method: "POST",
        body: {
          game_id: addPlayersState.game.game_id,
          user_ids: addPlayersState.userIds,
        },
      });
      await refresh();
      setAddPlayersState({ game: null, userIds: [] });
      showToast("Players added to game");
    } catch (requestError) {
      showToast(requestError.message, "error");
    }
  }

  function openScoreDialog(game) {
    setScoreDialogState({
      game,
      entries: game.members.map((member) => ({ user_id: member.user_id, score: "" })),
    });
  }

  async function submitScores() {
    if (!scoreDialogState.game) {
      return;
    }

    const scores = scoreDialogState.entries
      .filter((entry) => entry.score !== "")
      .map((entry) => ({ user_id: entry.user_id, score: Number(entry.score) }));

    if (!scores.length) {
      showToast("Enter at least one score", "error");
      return;
    }

    try {
      await apiRequest("/api/scores", {
        method: "POST",
        body: {
          game_id: scoreDialogState.game.game_id,
          scores,
        },
      });
      await refresh();
      setScoreDialogState({ game: null, entries: [] });
      showToast("Scores saved");
    } catch (requestError) {
      showToast(requestError.message, "error");
    }
  }

  async function handleProfilePhoto(event) {
    const file = event.target.files?.[0];
    if (!file || !data.me?.user_id) {
      return;
    }

    try {
      setUploadingProfilePhoto(true);
      const photo = await readPhotoFile(file);
      await apiRequest("/api/upload-photo", {
        method: "POST",
        body: {
          user_id: data.me.user_id,
          file_data: photo.data,
          file_name: photo.name,
          mime_type: photo.mime,
        },
      });
      await refresh();
      showToast("Profile photo updated");
    } catch (requestError) {
      showToast(requestError.message, "error");
    } finally {
      setUploadingProfilePhoto(false);
    }
  }

  function renderAuthedPage() {
    if (loading) {
      return <Typography color="text.secondary">Loading your workspace...</Typography>;
    }

    if (error) {
      return <Alert severity="error">Cannot load workspace. {error}</Alert>;
    }

    switch (activePage) {
      case "dashboard":
        return <HomeDashboardPage data={data} paletteMap={paletteMap} onOpenGames={() => setActivePage("games")} />;
      case "games":
        return (
          <GamesWorkspacePage
            data={data}
            paletteMap={paletteMap}
            gameTypeFilter={gameTypeFilter}
            onChangeGameTypeFilter={setGameTypeFilter}
            createGameForm={createGameForm}
            onChangeCreateGameForm={changeCreateGameForm}
            onCreateGame={handleCreateGame}
            addPlayersState={addPlayersState}
            onOpenAddPlayers={openAddPlayers}
            onCloseAddPlayers={() => setAddPlayersState({ game: null, userIds: [] })}
            onChangeUsersToAdd={(userIds) =>
              setAddPlayersState((current) => ({
                ...current,
                userIds: Array.isArray(userIds) ? userIds : String(userIds).split(","),
              }))
            }
            onSubmitAddPlayers={submitAddPlayers}
            scoreDialogState={scoreDialogState}
            onOpenScoreDialog={openScoreDialog}
            onCloseScoreDialog={() => setScoreDialogState({ game: null, entries: [] })}
            onChangeScoreEntry={(index, value) =>
              setScoreDialogState((current) => ({
                ...current,
                entries: current.entries.map((entry, entryIndex) =>
                  entryIndex === index ? { ...entry, score: value } : entry
                ),
              }))
            }
            onSubmitScores={submitScores}
          />
        );
      case "leaderboard":
        return <LeaderboardPage data={data} paletteMap={paletteMap} />;
      case "profile":
        return (
          <ProfileHubPage
            sessionUser={sessionUser}
            me={data.me}
            profileData={profileData}
            uploadingProfilePhoto={uploadingProfilePhoto}
            onChangePhoto={handleProfilePhoto}
          />
        );
      default:
        return <HomeDashboardPage data={data} paletteMap={paletteMap} onOpenGames={() => setActivePage("games")} />;
    }
  }

  if (!sessionUser) {
    return <AuthLanding />;
  }

  if (authState.loading) {
    return <Typography sx={{ p: 4 }}>Loading your account...</Typography>;
  }

  if (!authState.onboarded) {
    return (
      <OnboardingScreen
        sessionUser={sessionUser}
        username={username}
        loading={usernameSaving}
        error={authState.error}
        onChangeUsername={setUsername}
        onSubmit={handleOnboarding}
      />
    );
  }

  return (
    <>
      <AppShell
        navItems={NAV_ITEMS}
        activePage={activePage}
        onChangePage={setActivePage}
        title={activeMeta.label}
        description={activeMeta.description}
        sessionUser={sessionUser}
        me={data.me || authState.appUser}
      >
        {renderAuthedPage()}
      </AppShell>
      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={3200}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={toast?.severity || "success"} onClose={() => setToast(null)} variant="filled">
          {toast?.message || ""}
        </Alert>
      </Snackbar>
    </>
  );
}
