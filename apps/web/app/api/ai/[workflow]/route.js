import { error, json } from "../../../../lib/http";
import { requireSessionUser } from "../../../../lib/server-auth";
import { findUserByEmail } from "../../../../lib/user-service";
import { invokeInternalAiWorkflow } from "../../../../lib/ai/internal";

export const runtime = "nodejs";

const ALLOWED_WORKFLOWS = new Set([
  "match-commentary",
  "pre-game-win-probability",
  "stats-chat",
  "season-recap",
  "rivalry-tracker",
]);

export async function POST(request, { params }) {
  try {
    const sessionUser = await requireSessionUser();
    if (!sessionUser) {
      return error("Unauthorized", 401);
    }

    const currentUser = await findUserByEmail(sessionUser.email);
    if (!currentUser?.user) {
      return error("Complete onboarding first", 400);
    }

    const { workflow } = params;
    if (!ALLOWED_WORKFLOWS.has(workflow)) {
      return error("Unknown AI workflow", 404);
    }

    const body = await request.json().catch(() => ({}));
    const result = await invokeInternalAiWorkflow(request, workflow, {
      ...body,
      actor_user_id: currentUser.user.user_id,
      actor_email: sessionUser.email,
    });

    return json(result);
  } catch (err) {
    console.error(err);
    return error(err.message);
  }
}
