"use client";

import { Alert, Snackbar, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { AuthLanding } from "./auth/auth-landing";
import { OnboardingScreen } from "./auth/onboarding-screen";
import { AppShell } from "./layout/app-shell";
import { GameTypesPage } from "./pages/game-types-page";
import { HomeDashboardPage } from "./pages/home-dashboard-page";
import { GamesWorkspacePage } from "./pages/games-workspace-page";
import { LeaderboardPage } from "./pages/leaderboard-page";
import { ProfileHubPage } from "./pages/profile-hub-page";
import { useGameTrackerData } from "../hooks/use-game-tracker-data";
import { readPhotoFile } from "../lib/client/files";
import { apiRequest } from "../lib/client/api";
import { NAV_ITEMS } from "../lib/client/constants";

export default function GameTrackerApp({ sessionUser, authConfigured }) {
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
  const [leaderboardGameTypeId, setLeaderboardGameTypeId] = useState("");
  const [createGameForm, setCreateGameForm] = useState({ title: "", gameTypeId: "", visibility: "public" });
  const [addPlayersState, setAddPlayersState] = useState({ game: null, userIds: [] });
  const [scoreDialogState, setScoreDialogState] = useState({ game: null, entries: [], nextRoundNumber: 1 });
  const [listRefreshKey, setListRefreshKey] = useState(0);
  const [profileData, setProfileData] = useState(null);
  const [gameTypeCreateForm, setGameTypeCreateForm] = useState({
    name: "",
    scoringMode: "highest",
    description: "",
  });
  const [gameTypeEditForms, setGameTypeEditForms] = useState({});
  const [savingGameTypeCreate, setSavingGameTypeCreate] = useState(false);
  const [savingGameTypeId, setSavingGameTypeId] = useState("");
  const [leaderboardState, setLeaderboardState] = useState({
    items: [],
    pagination: { page: 1, pageSize: 10, total: 0, totalPages: 1 },
    sort: { sortBy: "total_score", sortOrder: "desc" },
    loading: false,
  });
  const [gamesState, setGamesState] = useState({
    items: [],
    pagination: { page: 1, pageSize: 6, total: 0, totalPages: 1 },
    sort: { sortBy: "played_at", sortOrder: "desc" },
    loading: false,
  });
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [uploadingProfilePhoto, setUploadingProfilePhoto] = useState(false);
  const { data, loading, error, paletteMap, refresh } = useGameTrackerData(
    Boolean(sessionUser && authState.onboarded)
  );

  const activeMeta = useMemo(() => {
    return NAV_ITEMS.find((item) => item.id === activePage) || NAV_ITEMS[0];
  }, [activePage]);
  const userMap = useMemo(
    () => Object.fromEntries(data.users.map((user) => [user.user_id, user])),
    [data.users]
  );

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
          setEditUsername(result.appUser?.username || "");
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
    setLeaderboardGameTypeId((current) => current || data.gameTypes[0]?.game_type_id || "");
  }, [data.gameTypes]);

  useEffect(() => {
    setGameTypeEditForms((current) => {
      const next = {};
      for (const gameType of data.gameTypes) {
        next[gameType.game_type_id] = current[gameType.game_type_id] || {
          name: gameType.name || "",
          scoringMode: gameType.scoring_mode || "highest",
          description: gameType.description || "",
        };
      }
      return next;
    });
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

  useEffect(() => {
    if (!(sessionUser && authState.onboarded)) {
      return;
    }

    let cancelled = false;
    async function loadLeaderboard() {
      setLeaderboardState((current) => ({ ...current, loading: true }));
      try {
        const params = new URLSearchParams({
          type: "rankings",
          page: String(leaderboardState.pagination.page),
          pageSize: String(leaderboardState.pagination.pageSize),
          sortBy: leaderboardState.sort.sortBy,
          sortOrder: leaderboardState.sort.sortOrder,
          game_type_id: leaderboardGameTypeId,
        });
        const result = await apiRequest(`/api/analytics?${params.toString()}`);
        if (!cancelled) {
          setLeaderboardState((current) => ({
            ...current,
            items: result.items,
            pagination: result.pagination,
            sort: result.sort,
            loading: false,
          }));
        }
      } catch (requestError) {
        if (!cancelled) {
          setLeaderboardState((current) => ({ ...current, loading: false }));
          showToast(requestError.message, "error");
        }
      }
    }

    loadLeaderboard();
    return () => {
      cancelled = true;
    };
  }, [
    sessionUser,
    authState.onboarded,
    leaderboardState.pagination.page,
    leaderboardState.pagination.pageSize,
    leaderboardState.sort.sortBy,
    leaderboardState.sort.sortOrder,
    leaderboardGameTypeId,
    listRefreshKey,
  ]);

  useEffect(() => {
    if (!(sessionUser && authState.onboarded)) {
      return;
    }

    let cancelled = false;
    async function loadGames() {
      setGamesState((current) => ({ ...current, loading: true }));
      try {
        const params = new URLSearchParams({
          page: String(gamesState.pagination.page),
          pageSize: String(gamesState.pagination.pageSize),
          sortBy: gamesState.sort.sortBy,
          sortOrder: gamesState.sort.sortOrder,
          gameType: gameTypeFilter,
        });
        const result = await apiRequest(`/api/game-sessions?${params.toString()}`);
        if (!cancelled) {
          setGamesState((current) => ({
            ...current,
            items: result.items,
            pagination: result.pagination,
            sort: result.sort,
            loading: false,
          }));
        }
      } catch (requestError) {
        if (!cancelled) {
          setGamesState((current) => ({ ...current, loading: false }));
          showToast(requestError.message, "error");
        }
      }
    }

    loadGames();
    return () => {
      cancelled = true;
    };
  }, [
    sessionUser,
    authState.onboarded,
    gamesState.pagination.page,
    gamesState.pagination.pageSize,
    gamesState.sort.sortBy,
    gamesState.sort.sortOrder,
    gameTypeFilter,
    listRefreshKey,
  ]);

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

  async function handleSaveProfile() {
    if (!editUsername.trim()) {
      setProfileError("Username cannot be empty");
      return;
    }

    try {
      setSavingProfile(true);
      setProfileError("");
      const user = await apiRequest("/api/me/profile", {
        method: "POST",
        body: { username: editUsername.trim() },
      });
      setAuthState((current) => ({ ...current, appUser: user, error: "" }));
      setUsername(user.username || "");
      setEditUsername(user.username || "");
      await refresh();
      setEditProfileOpen(false);
      showToast("Profile updated");
    } catch (requestError) {
      setProfileError(requestError.message);
    } finally {
      setSavingProfile(false);
    }
  }

  function changeCreateGameForm(field, value) {
    setCreateGameForm((current) => ({ ...current, [field]: value }));
  }

  function changeGameTypeCreateForm(field, value) {
    setGameTypeCreateForm((current) => ({ ...current, [field]: value }));
  }

  function changeGameTypeEditForm(gameTypeId, field, value) {
    setGameTypeEditForms((current) => ({
      ...current,
      [gameTypeId]: {
        ...(current[gameTypeId] || {}),
        [field]: value,
      },
    }));
  }

  async function handleCreateGameType() {
    if (!gameTypeCreateForm.name.trim()) {
      showToast("Enter a game type name", "error");
      return;
    }

    try {
      setSavingGameTypeCreate(true);
      await apiRequest("/api/game-types", {
        method: "POST",
        body: {
          name: gameTypeCreateForm.name.trim(),
          scoring_mode: gameTypeCreateForm.scoringMode,
          description: gameTypeCreateForm.description.trim(),
        },
      });
      setGameTypeCreateForm({ name: "", scoringMode: "highest", description: "" });
      await refresh();
      showToast("Game type created");
    } catch (requestError) {
      showToast(requestError.message, "error");
    } finally {
      setSavingGameTypeCreate(false);
    }
  }

  async function handleSaveGameType(gameTypeId) {
    const form = gameTypeEditForms[gameTypeId];
    if (!form?.name?.trim()) {
      showToast("Game type name cannot be empty", "error");
      return;
    }

    try {
      setSavingGameTypeId(gameTypeId);
      await apiRequest("/api/game-types", {
        method: "PUT",
        body: {
          game_type_id: gameTypeId,
          name: form.name.trim(),
          scoring_mode: form.scoringMode,
          description: form.description?.trim() || "",
        },
      });
      await refresh();
      showToast("Game type updated");
    } catch (requestError) {
      showToast(requestError.message, "error");
    } finally {
      setSavingGameTypeId("");
    }
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
          visibility: createGameForm.visibility,
        },
      });
      await refresh();
      setListRefreshKey((current) => current + 1);
      setGamesState((current) => ({ ...current, pagination: { ...current.pagination, page: 1 } }));
      setCreateGameForm((current) => ({ ...current, title: "", visibility: "public" }));
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
      setListRefreshKey((current) => current + 1);
      setGamesState((current) => ({ ...current, pagination: { ...current.pagination, page: 1 } }));
      setAddPlayersState({ game: null, userIds: [] });
      showToast("Players added to game");
    } catch (requestError) {
      showToast(requestError.message, "error");
    }
  }

  function openScoreDialog(game) {
    const nextRoundNumber =
      Math.max(0, ...(game.recent_scores || []).map((entry) => entry.round_number || 1)) + 1;
    setScoreDialogState({
      game,
      nextRoundNumber,
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
      setListRefreshKey((current) => current + 1);
      setScoreDialogState({ game: null, entries: [], nextRoundNumber: 1 });
      showToast("Scores saved");
    } catch (requestError) {
      showToast(requestError.message, "error");
    }
  }

  async function handleProfilePhoto(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !data.me?.user_id) {
      return;
    }

    try {
      setUploadingProfilePhoto(true);
      setProfileError("");
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
      setProfileError(requestError.message);
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
      case "game-types":
        return (
          <GameTypesPage
            gameTypes={data.gameTypes}
            createForm={gameTypeCreateForm}
            editForms={gameTypeEditForms}
            savingCreate={savingGameTypeCreate}
            savingEditId={savingGameTypeId}
            onChangeCreateForm={changeGameTypeCreateForm}
            onCreateGameType={handleCreateGameType}
            onChangeEditForm={changeGameTypeEditForm}
            onSaveEditForm={handleSaveGameType}
          />
        );
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
            onCloseScoreDialog={() => setScoreDialogState({ game: null, entries: [], nextRoundNumber: 1 })}
            onChangeScoreEntry={(index, value) =>
              setScoreDialogState((current) => ({
                ...current,
                entries: current.entries.map((entry, entryIndex) =>
                  entryIndex === index ? { ...entry, score: value } : entry
                ),
              }))
            }
            onSubmitScores={submitScores}
            sessions={gamesState.items}
            sessionsPagination={gamesState.pagination}
            sessionsSorting={gamesState.sort}
            onChangeSessionsPage={(page) =>
              setGamesState((current) => ({ ...current, pagination: { ...current.pagination, page } }))
            }
            onChangeSessionsPageSize={(pageSize) =>
              setGamesState((current) => ({
                ...current,
                pagination: { ...current.pagination, page: 1, pageSize },
              }))
            }
            onChangeSessionsSortBy={(sortBy) =>
              setGamesState((current) => ({
                ...current,
                sort: { ...current.sort, sortBy },
                pagination: { ...current.pagination, page: 1 },
              }))
            }
            onChangeSessionsSortOrder={(sortOrder) =>
              setGamesState((current) => ({
                ...current,
                sort: { ...current.sort, sortOrder },
                pagination: { ...current.pagination, page: 1 },
              }))
            }
          />
        );
      case "leaderboard":
        return (
          <LeaderboardPage
            items={leaderboardState.items}
            pagination={leaderboardState.pagination}
            sorting={leaderboardState.sort}
            chartItems={leaderboardState.items.slice(0, 8)}
            gameTypes={data.gameTypes}
            selectedGameTypeId={leaderboardGameTypeId}
            userMap={userMap}
            paletteMap={paletteMap}
            onChangeGameTypeId={(gameTypeId) => {
              setLeaderboardGameTypeId(gameTypeId);
              setLeaderboardState((current) => ({
                ...current,
                pagination: { ...current.pagination, page: 1 },
              }));
            }}
            onChangePage={(page) =>
              setLeaderboardState((current) => ({
                ...current,
                pagination: { ...current.pagination, page },
              }))
            }
            onChangePageSize={(pageSize) =>
              setLeaderboardState((current) => ({
                ...current,
                pagination: { ...current.pagination, page: 1, pageSize },
              }))
            }
            onChangeSortBy={(sortBy) =>
              setLeaderboardState((current) => ({
                ...current,
                sort: { ...current.sort, sortBy },
                pagination: { ...current.pagination, page: 1 },
              }))
            }
            onChangeSortOrder={(sortOrder) =>
              setLeaderboardState((current) => ({
                ...current,
                sort: { ...current.sort, sortOrder },
                pagination: { ...current.pagination, page: 1 },
              }))
            }
          />
        );
      case "profile":
        return (
          <ProfileHubPage
            sessionUser={sessionUser}
            me={data.me}
            profileData={profileData}
            editOpen={editProfileOpen}
            editUsername={editUsername}
            savingProfile={savingProfile}
            profileError={profileError}
            uploadingProfilePhoto={uploadingProfilePhoto}
            onOpenEdit={() => {
              setEditUsername(data.me?.username || authState.appUser?.username || "");
              setProfileError("");
              setEditProfileOpen(true);
            }}
            onCloseEdit={() => {
              setProfileError("");
              setEditProfileOpen(false);
            }}
            onChangeEditUsername={setEditUsername}
            onSaveProfile={handleSaveProfile}
            onChangePhoto={handleProfilePhoto}
          />
        );
      default:
        return <HomeDashboardPage data={data} paletteMap={paletteMap} onOpenGames={() => setActivePage("games")} />;
    }
  }

  if (!sessionUser) {
    return <AuthLanding authConfigured={authConfigured} />;
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
