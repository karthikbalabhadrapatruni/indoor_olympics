export const NAV_ITEMS = [
  {
    id: "dashboard",
    label: "Overview",
    description: "Your personal game hub, streaks, and quick actions",
  },
  {
    id: "game-types",
    label: "Game Types",
    description: "Create and maintain the scoring rules behind each game format",
  },
  {
    id: "games",
    label: "Games",
    description: "Create games, add players, and log scores for rooms you can access",
  },
  {
    id: "ai",
    label: "AI Studio",
    description: "Chat with your stats, generate rivalry stories, and build season recaps",
  },
  {
    id: "leaderboard",
    label: "Leaderboard",
    description: "See rankings, win rates, and multi-game performance",
  },
  {
    id: "profile",
    label: "Profile",
    description: "Manage your identity, photo, and personal performance",
  },
];

export const PALETTES = [
  ["#EEEDFE", "#3C3489"],
  ["#E1F5EE", "#0F6E56"],
  ["#FAECE7", "#993C1D"],
  ["#FBEAF0", "#993556"],
  ["#E6F1FB", "#185FA5"],
  ["#EAF3DE", "#3B6D11"],
  ["#FAEEDA", "#854F0B"],
  ["#F1EFE8", "#5F5E5A"],
];

export const INITIAL_BOOTSTRAP_STATE = {
  me: null,
  users: [],
  gameTypes: [],
  sessions: [],
  scores: [],
  rankings: [],
  allrounders: [],
};
