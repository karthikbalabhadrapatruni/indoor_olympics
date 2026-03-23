"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  CssBaseline,
  GlobalStyles,
  ThemeProvider,
  alpha,
  createTheme,
} from "@mui/material";

const STORAGE_KEY = "gametracker-color-mode";

const ColorModeContext = createContext({
  mode: "light",
  toggleColorMode: () => {},
});

function createAppTheme(mode) {
  const isDark = mode === "dark";

  return createTheme({
    palette: {
      mode,
      primary: {
        main: isDark ? "#8BB8FF" : "#2255A4",
      },
      secondary: {
        main: isDark ? "#6FD7CB" : "#0A7A70",
      },
      background: {
        default: isDark ? "#0D1320" : "#EEF2F8",
        paper: isDark ? "#121A2A" : "#FFFFFF",
      },
      success: {
        main: isDark ? "#4FD39A" : "#178A5B",
      },
      warning: {
        main: isDark ? "#E6B45C" : "#B77716",
      },
      error: {
        main: isDark ? "#F17979" : "#A63232",
      },
      text: {
        primary: isDark ? "#F3F7FF" : "#111827",
        secondary: isDark ? "#98A5BD" : "#5B6473",
      },
      divider: isDark ? "rgba(152,165,189,0.16)" : "rgba(15,23,42,0.08)",
    },
    shape: {
      borderRadius: 10,
    },
    typography: {
      fontFamily: '"Roboto Flex", "Inter", "Segoe UI", sans-serif',
      h3: {
        fontWeight: 760,
        letterSpacing: "-0.05em",
      },
      h4: {
        fontWeight: 740,
        letterSpacing: "-0.04em",
      },
      h5: {
        fontWeight: 700,
        letterSpacing: "-0.03em",
      },
      h6: {
        fontWeight: 700,
      },
      body1: {
        lineHeight: 1.6,
      },
      body2: {
        lineHeight: 1.55,
      },
      overline: {
        fontWeight: 700,
        letterSpacing: "0.12em",
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            transition: "background-color 180ms ease, color 180ms ease",
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            border: `1px solid ${isDark ? "rgba(152,165,189,0.14)" : "rgba(15,23,42,0.06)"}`,
            boxShadow: isDark
              ? "0 20px 44px rgba(2, 8, 20, 0.34)"
              : "0 16px 38px rgba(15, 23, 42, 0.06)",
            backgroundImage: "none",
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
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
            fontWeight: 650,
            borderRadius: 12,
            minHeight: 44,
            paddingInline: 18,
          },
          contained: {
            boxShadow: "none",
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            fontWeight: 500,
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            backgroundColor: isDark ? alpha("#FFFFFF", 0.02) : "#FFFFFF",
          },
          notchedOutline: {
            borderColor: isDark ? "rgba(152,165,189,0.18)" : "rgba(15,23,42,0.12)",
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          select: {
            borderRadius: 12,
          },
        },
      },
      MuiPaginationItem: {
        styleOverrides: {
          root: {
            borderRadius: 10,
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            overflow: "hidden",
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 18,
          },
        },
      },
      MuiAvatar: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            borderRadius: 10,
          },
        },
      },
    },
  });
}

export function AppThemeProvider({ children }) {
  const [mode, setMode] = useState("light");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") {
      setMode(stored);
      return;
    }

    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setMode(systemPrefersDark ? "dark" : "light");
  }, []);

  const colorMode = useMemo(
    () => ({
      mode,
      toggleColorMode: () => {
        setMode((current) => {
          const next = current === "light" ? "dark" : "light";
          window.localStorage.setItem(STORAGE_KEY, next);
          return next;
        });
      },
    }),
    [mode]
  );

  const theme = useMemo(() => createAppTheme(mode), [mode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline enableColorScheme />
        <GlobalStyles
          styles={{
            body: {
              backgroundColor: theme.palette.background.default,
              color: theme.palette.text.primary,
            },
            "::selection": {
              backgroundColor: alpha(theme.palette.primary.main, 0.22),
            },
          }}
        />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export function useAppColorMode() {
  return useContext(ColorModeContext);
}
