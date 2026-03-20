import { requireSessionUser } from "../../../lib/server-auth";
import { error, json } from "../../../lib/http";
import { findUserByEmail } from "../../../lib/user-service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const sessionUser = await requireSessionUser();
    if (!sessionUser) {
      return error("Unauthorized", 401);
    }

    const existing = await findUserByEmail(sessionUser.email);
    return json({
      sessionUser: {
        email: sessionUser.email,
        name: sessionUser.name || "",
        image: sessionUser.image || "",
      },
      appUser: existing?.user || null,
      onboarded: Boolean(existing?.user?.user_id),
    });
  } catch (err) {
    console.error(err);
    return error(err.message);
  }
}
