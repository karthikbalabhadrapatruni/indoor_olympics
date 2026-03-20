import "./globals.css";
import { AppThemeProvider } from "../components/providers/app-theme-provider";

export const metadata = {
  title: "GameTracker",
  description: "Game analytics tracker powered by Google Sheets.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppThemeProvider>{children}</AppThemeProvider>
      </body>
    </html>
  );
}
