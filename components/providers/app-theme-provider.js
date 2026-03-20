"use client";

import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#2457A6",
    },
    secondary: {
      main: "#0B7A75",
    },
    background: {
      default: "#F5F7FB",
      paper: "#FFFFFF",
    },
    success: {
      main: "#178A5B",
    },
    warning: {
      main: "#B77716",
    },
    error: {
      main: "#A63232",
    },
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      letterSpacing: "-0.03em",
    },
    h6: {
      fontWeight: 700,
    },
    overline: {
      fontWeight: 700,
      letterSpacing: "0.08em",
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          border: "1px solid rgba(15, 23, 42, 0.08)",
          boxShadow: "0 12px 36px rgba(15, 23, 42, 0.05)",
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
        },
      },
    },
  },
});

export function AppThemeProvider({ children }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
