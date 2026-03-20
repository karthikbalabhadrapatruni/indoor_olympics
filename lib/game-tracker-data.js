import {
  batchReadSheets,
  getSheetsClient,
  rowToGameAccess,
  rowToGameSession,
  rowToGameType,
  rowToScore,
  rowToUser,
  safeReadSheet,
} from "./sheets";

export function aggregateUser(stats, gameTypes, userId) {
  const userStats = stats.filter((stat) => stat.user_id === userId);
  const total_score = userStats.reduce((sum, stat) => sum + stat.total_score, 0);
  const total_games = userStats.reduce((sum, stat) => sum + stat.total_games, 0);
  const total_wins = userStats.reduce((sum, stat) => sum + stat.total_wins, 0);
  const win_pct = total_games > 0 ? Math.round((total_wins / total_games) * 100) : 0;
  const game_types_played = userStats
    .filter((stat) => stat.total_games > 0)
    .map((stat) => {
      const gameType = gameTypes.find((item) => item.game_type_id === stat.game_type_id);
      return {
        ...stat,
        game_type_name: gameType ? gameType.name : stat.game_type_id,
      };
    });

  return { total_score, total_games, total_wins, win_pct, game_types_played };
}

export function buildAnalytics({ users, gameTypes, stats }) {
  const enriched = users.map((user) => ({
    ...user,
    ...aggregateUser(stats, gameTypes, user.user_id),
  }));

  const rankings = [...enriched]
    .sort((a, b) => b.total_score - a.total_score)
    .map((user, index) => ({ ...user, rank: index + 1 }));

  const allrounders = [...enriched]
    .sort((a, b) => b.total_score - a.total_score)
    .map((user) => ({
      ...user,
      is_allrounder: user.game_types_played.length >= 2,
    }));

  return { rankings, allrounders };
}

export async function readAllData() {
  const sheets = getSheetsClient();
  const [userRows, gameTypeRows, sessionRows, scoreRows, statRows] = await batchReadSheets(sheets, [
    "users!A2:H",
    "game_types!A2:B",
    "game_sessions!A2:E",
    "scores!A2:E",
    "user_game_stats!A2:F",
  ]);
  const accessRows = await safeReadSheet(sheets, "game_access!A2:E");

  const users = userRows.map(rowToUser);
  const gameTypes = gameTypeRows.map(rowToGameType);
  const sessions = sessionRows.map(rowToGameSession);
  const scores = scoreRows.map(rowToScore);
  const access = accessRows.map(rowToGameAccess);
  const stats = statRows.map(([id, user_id, game_type_id, total_score, total_games, total_wins]) => ({
    id,
    user_id,
    game_type_id,
    total_score: Number(total_score),
    total_games: Number(total_games),
    total_wins: Number(total_wins),
  }));

  return { users, gameTypes, sessions, scores, stats, access };
}

export function buildPlayerAnalytics({ users, gameTypes, sessions, scores, stats }, userId) {
  const user = users.find((item) => item.user_id === userId);
  if (!user) {
    return null;
  }

  const aggregate = aggregateUser(stats, gameTypes, userId);

  const history = scores
    .filter((score) => score.user_id === userId)
    .map((score) => {
      const session = sessions.find((item) => item.game_id === score.game_id);
      const gameType = session
        ? gameTypes.find((item) => item.game_type_id === session.game_type_id)
        : null;

      return {
        ...score,
        played_at: session?.played_at || null,
        game_type_name: gameType?.name || null,
      };
    })
    .sort((a, b) => (b.played_at || "").localeCompare(a.played_at || ""));

  const ranked = users
    .map((item) => ({
      user_id: item.user_id,
      total_score: aggregateUser(stats, gameTypes, item.user_id).total_score,
    }))
    .sort((a, b) => b.total_score - a.total_score);

  return {
    ...user,
    ...aggregate,
    rank: ranked.findIndex((item) => item.user_id === userId) + 1,
    history,
  };
}
