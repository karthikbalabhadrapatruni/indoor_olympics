import {
  appendRow,
  getSheetsClient,
  readSheet,
  rowToScore,
  safeReadSheet,
  upsertStats,
} from "../../../lib/sheets";
import { error, json } from "../../../lib/http";
import { requireSessionUser } from "../../../lib/server-auth";
import { findUserByEmail } from "../../../lib/user-service";
import { acquireScoreWriteLock, releaseScoreWriteLock } from "../../../lib/write-lock";
import { invokeInternalAiWorkflow } from "../../../lib/ai/internal";

export const runtime = "nodejs";

export async function GET() {
  try {
    const sessionUser = await requireSessionUser();
    if (!sessionUser) {
      return error("Unauthorized", 401);
    }
    const currentUser = await findUserByEmail(sessionUser.email);
    if (!currentUser?.user) {
      return error("Complete onboarding first", 400);
    }
    const sheets = getSheetsClient();
    const rows = await readSheet(sheets, "scores!A2:F");
    return json(rows.map(rowToScore));
  } catch (err) {
    console.error(err);
    return error(err.message);
  }
}

export async function POST(request) {
  let lockToken = null;

  try {
    const sessionUser = await requireSessionUser();
    if (!sessionUser) {
      return error("Unauthorized", 401);
    }
    const currentUser = await findUserByEmail(sessionUser.email);
    if (!currentUser?.user) {
      return error("Complete onboarding first", 400);
    }

    const { game_id, scores } = await request.json();
    if (!game_id || !Array.isArray(scores) || scores.length === 0) {
      return error("game_id and scores[] required", 400);
    }

    lockToken = acquireScoreWriteLock();
    if (!lockToken) {
      return error(
        "Another score submission is already being processed. Please retry in a few seconds.",
        409
      );
    }

    const sheets = getSheetsClient();
    const sessionRows = await readSheet(sheets, "game_sessions!A2:H");
    const session = sessionRows.find((row) => row[0] === game_id);
    if (!session) {
      return error(`game_id '${game_id}' not found`, 404);
    }
    if ((session[6] || "active") === "ended") {
      return error("this game has ended and can no longer accept scores", 409);
    }
    const accessRows = await safeReadSheet(sheets, "game_access!A2:E");
    const allowed =
      session[3] === currentUser.user.user_id ||
      accessRows.some((row) => row[1] === game_id && row[2] === currentUser.user.user_id);
    if (!allowed) {
      return error("you do not have access to submit scores for this game", 403);
    }

    const gameTypeId = session[1];
    const gameTypeRows = await readSheet(sheets, "game_types!A2:D");
    const gameType = gameTypeRows.find((row) => row[0] === gameTypeId);
    const scoringMode = gameType?.[2] || "highest";
    const existingScores = (await readSheet(sheets, "scores!A2:F"))
      .map(rowToScore)
      .filter((entry) => entry.game_id === game_id);
    const nextRoundNumber =
      existingScores.reduce((maxRound, entry) => Math.max(maxRound, entry.round_number || 0), 0) + 1;
    const winningScore =
      scoringMode === "lowest"
        ? Math.min(...scores.map((entry) => Number(entry.score)))
        : Math.max(...scores.map((entry) => Number(entry.score)));
    const written = [];

    for (const entry of scores) {
      const item = {
        score_id: crypto.randomUUID(),
        game_id,
        user_id: entry.user_id,
        score: Number(entry.score),
        is_winner: Number(entry.score) === winningScore,
        round_number: nextRoundNumber,
      };

      await appendRow(sheets, "scores!A:F", [
        item.score_id,
        item.game_id,
        item.user_id,
        item.score,
        item.is_winner ? "TRUE" : "FALSE",
        item.round_number,
      ]);
      await upsertStats(sheets, entry.user_id, gameTypeId, item.score, item.is_winner ? 1 : 0);
      written.push(item);
    }

    globalThis.__gtCacheInvalidated = Date.now();
    try {
      await invokeInternalAiWorkflow(request, "match-commentary", {
        game_id,
        round_number: nextRoundNumber,
      });
    } catch (aiError) {
      console.error("match commentary workflow failed", aiError);
    }

    return json({ written, round_number: nextRoundNumber }, { status: 201 });
  } catch (err) {
    console.error(err);
    return error(err.message);
  } finally {
    if (lockToken) {
      releaseScoreWriteLock(lockToken);
    }
  }
}
