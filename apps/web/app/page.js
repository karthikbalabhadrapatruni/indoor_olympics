import GameTrackerApp from "../components/game-tracker-app";
import { auth, isGoogleAuthConfigured } from "../lib/auth";

export default async function HomePage() {
  if (!isGoogleAuthConfigured) {
    return <GameTrackerApp sessionUser={null} authConfigured={false} />;
  }

  const session = await auth();
  return <GameTrackerApp sessionUser={session?.user || null} authConfigured={true} />;
}
