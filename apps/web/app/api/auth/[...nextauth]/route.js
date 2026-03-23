import { handlers, isGoogleAuthConfigured } from "../../../../lib/auth";

export async function GET(request, context) {
  if (!isGoogleAuthConfigured) {
    return Response.json(
      {
        error:
          "Google auth is not configured. Set AUTH_SECRET, AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET on Vercel.",
      },
      { status: 503 }
    );
  }

  return handlers.GET(request, context);
}

export async function POST(request, context) {
  if (!isGoogleAuthConfigured) {
    return Response.json(
      {
        error:
          "Google auth is not configured. Set AUTH_SECRET, AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET on Vercel.",
      },
      { status: 503 }
    );
  }

  return handlers.POST(request, context);
}
