"use client";

import { Alert, Snackbar, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { AddPlayerPage } from "./pages/add-player-page";
import { DashboardPage } from "./pages/dashboard-page";
import { EnterScoresPage } from "./pages/enter-scores-page";
import { GamesPage } from "./pages/games-page";
import { PlayersPage } from "./pages/players-page";
import { ProfilePage } from "./pages/profile-page";
import { AppShell } from "./layout/app-shell";
import { useGameTrackerData } from "../hooks/use-game-tracker-data";
import { readPhotoFile } from "../lib/client/files";
import { apiRequest } from "../lib/client/api";
import { NAV_ITEMS } from "../lib/client/constants";

export default function GameTrackerApp() {
  const { data, loading, error, paletteMap, refresh } = useGameTrackerData();
  const [activePage, setActivePage] = useState("dashboard");
  const [toast, setToast] = useState(null);
  const [gameTypeFilter, setGameTypeFilter] = useState("all");
  const [currentProfile, setCurrentProfile] = useState("");
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [scoreEntries, setScoreEntries] = useState([
    { user_id: "", score: "" },
    { user_id: "", score: "" },
  ]);
  const [gameId, setGameId] = useState("");
  const [selectedGameTypeId, setSelectedGameTypeId] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPlayerPhoto, setNewPlayerPhoto] = useState(null);
  const [newPlayerPhotoPreview, setNewPlayerPhotoPreview] = useState("");
  const [uploadingNewPhoto, setUploadingNewPhoto] = useState(false);
  const [uploadingProfilePhoto, setUploadingProfilePhoto] = useState(false);

  const activeMeta = useMemo(() => {
    return NAV_ITEMS.find((item) => item.id === activePage) || NAV_ITEMS[0];
  }, [activePage]);

  function showToast(message, severity = "success") {
    setToast({ message, severity });
  }

  useEffect(() => {
    if (!data.users.length) {
      return;
    }

    setSelectedGameTypeId((current) => current || data.gameTypes[0]?.game_type_id || "");
    setCurrentProfile((current) => current || data.users[0]?.user_id || "");
    setScoreEntries((current) =>
      current.map((entry, index) => ({
        user_id: entry.user_id || data.users[index]?.user_id || data.users[0]?.user_id || "",
        score: entry.score,
      }))
    );
  }, [data.users, data.gameTypes]);

  useEffect(() => {
    if (!currentProfile) {
      setProfileData(null);
      return;
    }

    let cancelled = false;

    async function loadProfile() {
      setProfileLoading(true);
      try {
        const result = await apiRequest(`/api/analytics?type=player&user_id=${currentProfile}`);
        if (!cancelled) {
          setProfileData(result);
        }
      } catch (requestError) {
        if (!cancelled) {
          showToast(requestError.message, "error");
        }
      } finally {
        if (!cancelled) {
          setProfileLoading(false);
        }
      }
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [currentProfile]);

  async function uploadPhoto(userId, photo) {
    return apiRequest("/api/upload-photo", {
      method: "POST",
      body: {
        user_id: userId,
        file_data: photo.data,
        file_name: photo.name,
        mime_type: photo.mime,
      },
    });
  }

  function updateScoreEntry(index, field, value) {
    setScoreEntries((current) =>
      current.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [field]: value } : entry
      )
    );
  }

  function addScoreRow() {
    setScoreEntries((current) => [
      ...current,
      { user_id: data.users[0]?.user_id || "", score: "" },
    ]);
  }

  function removeScoreRow(index) {
    setScoreEntries((current) => current.filter((_, entryIndex) => entryIndex !== index));
  }

  async function handleSubmitScores() {
    const scores = scoreEntries
      .filter((entry) => entry.user_id && entry.score !== "")
      .map((entry) => ({ user_id: entry.user_id, score: Number(entry.score) }));

    if (!gameId.trim()) {
      showToast("Enter a game ID.", "error");
      return;
    }

    if (!scores.length) {
      showToast("Add at least one score.", "error");
      return;
    }

    try {
      await apiRequest("/api/game-sessions", {
        method: "POST",
        body: { game_id: gameId.trim(), game_type_id: selectedGameTypeId },
      });
      await apiRequest("/api/scores", {
        method: "POST",
        body: { game_id: gameId.trim(), scores },
      });
      await refresh();
      setGameId("");
      setScoreEntries([
        { user_id: data.users[0]?.user_id || "", score: "" },
        { user_id: data.users[1]?.user_id || data.users[0]?.user_id || "", score: "" },
      ]);
      showToast(`Session ${gameId.trim()} saved!`);
    } catch (requestError) {
      showToast(requestError.message, "error");
    }
  }

  async function handleNewPlayerPhoto(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const photo = await readPhotoFile(file);
      setNewPlayerPhoto(photo);
      setNewPlayerPhotoPreview(photo.preview);
    } catch (fileError) {
      showToast(fileError.message, "error");
    }
  }

  async function handleAddPlayer() {
    if (!newUsername.trim()) {
      showToast("Enter a username.", "error");
      return;
    }

    try {
      const user = await apiRequest("/api/users", {
        method: "POST",
        body: { username: newUsername.trim() },
      });

      if (newPlayerPhoto) {
        setUploadingNewPhoto(true);
        await uploadPhoto(user.user_id, newPlayerPhoto);
      }

      await refresh();
      setNewUsername("");
      setNewPlayerPhoto(null);
      setNewPlayerPhotoPreview("");
      showToast(`Player "${newUsername.trim()}" added!`);
    } catch (requestError) {
      showToast(requestError.message, "error");
    } finally {
      setUploadingNewPhoto(false);
    }
  }

  async function handleProfilePhoto(event) {
    const file = event.target.files?.[0];
    if (!file || !currentProfile) {
      return;
    }

    try {
      const photo = await readPhotoFile(file);
      setUploadingProfilePhoto(true);
      await uploadPhoto(currentProfile, photo);
      await refresh();
      showToast("Profile photo updated!");
    } catch (requestError) {
      showToast(requestError.message, "error");
    } finally {
      setUploadingProfilePhoto(false);
    }
  }

  function renderPage() {
    if (loading) {
      return <Typography color="text.secondary">Loading...</Typography>;
    }

    if (error) {
      return <Alert severity="error">Cannot connect to backend. {error}</Alert>;
    }

    switch (activePage) {
      case "dashboard":
        return <DashboardPage data={data} paletteMap={paletteMap} />;
      case "players":
        return <PlayersPage data={data} paletteMap={paletteMap} />;
      case "games":
        return (
          <GamesPage
            data={data}
            paletteMap={paletteMap}
            gameTypeFilter={gameTypeFilter}
            onChangeGameTypeFilter={setGameTypeFilter}
          />
        );
      case "enter-scores":
        return (
          <EnterScoresPage
            data={data}
            gameId={gameId}
            selectedGameTypeId={selectedGameTypeId}
            scoreEntries={scoreEntries}
            onChangeGameId={setGameId}
            onChangeGameType={setSelectedGameTypeId}
            onAddScoreRow={addScoreRow}
            onUpdateScoreEntry={updateScoreEntry}
            onRemoveScoreEntry={removeScoreRow}
            onSubmit={handleSubmitScores}
          />
        );
      case "add-player":
        return (
          <AddPlayerPage
            username={newUsername}
            photoPreview={newPlayerPhotoPreview}
            uploading={uploadingNewPhoto}
            onChangeUsername={setNewUsername}
            onChangePhoto={handleNewPlayerPhoto}
            onSubmit={handleAddPlayer}
          />
        );
      case "profile":
        return (
          <ProfilePage
            users={data.users}
            rankings={data.rankings}
            currentProfile={currentProfile}
            profileData={profileData}
            profileLoading={profileLoading}
            uploadingProfilePhoto={uploadingProfilePhoto}
            onChangeProfile={setCurrentProfile}
            onChangePhoto={handleProfilePhoto}
          />
        );
      default:
        return <DashboardPage data={data} paletteMap={paletteMap} />;
    }
  }

  return (
    <>
      <AppShell
        navItems={NAV_ITEMS}
        activePage={activePage}
        onChangePage={setActivePage}
        title={activeMeta.label}
        description={activeMeta.description}
      >
        {renderPage()}
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
