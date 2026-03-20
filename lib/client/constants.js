export const NAV_ITEMS = [
  {
    id: "dashboard",
    label: "Dashboard",
    description: "Live analytics across all players and sessions",
  },
  {
    id: "players",
    label: "Players",
    description: "All registered players and cumulative stats",
  },
  {
    id: "games",
    label: "Game Sessions",
    description: "All recorded sessions with scores",
  },
  {
    id: "enter-scores",
    label: "Enter Scores",
    description: "Record results for a new game session",
  },
  {
    id: "add-player",
    label: "Add Player",
    description: "Register a new player in the system",
  },
  {
    id: "profile",
    label: "Player Profile",
    description: "Individual stats, history and photo management",
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
  users: [],
  gameTypes: [],
  sessions: [],
  scores: [],
  rankings: [],
  allrounders: [],
};
