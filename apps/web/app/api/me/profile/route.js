import { error, json } from "../../../../lib/http";
import { requireSessionUser } from "../../../../lib/server-auth";
import { createOrUpdateOnboardedUser } from "../../../../lib/user-service";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const sessionUser = await requireSessionUser();
    if (!sessionUser) {
      return error("Unauthorized", 401);
    }

    const { username } = await request.json();
    if (!username?.trim()) {
      return error("username required", 400);
    }

    const user = await createOrUpdateOnboardedUser({
      email: sessionUser.email,
      username: username.trim(),
      googleName: sessionUser.name || "",
      avatarUrl: sessionUser.image || "",
    });

    globalThis.__gtCacheInvalidated = Date.now();
    return json(user, { status: 201 });
  } catch (err) {
    console.error(err);
    return error(err.message.includes("username already taken") ? err.message : err.message, err.message.includes("username already taken") ? 409 : 500);
  }
}
