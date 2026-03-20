import GameTrackerApp from "../components/game-tracker-app";
import { auth } from "../lib/auth";

export default async function HomePage() {
  const session = await auth();
  return <GameTrackerApp sessionUser={session?.user || null} />;
}
