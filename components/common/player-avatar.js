"use client";

import { Avatar } from "@mui/material";
import { PALETTES } from "../../lib/client/constants";

export function PlayerAvatar({ uid, name, photoUrl, paletteMap, size = 36 }) {
  const palette = paletteMap[uid] || PALETTES[0];
  const initials = (name || "?").slice(0, 2).toUpperCase();

  return (
    <Avatar
      src={photoUrl || undefined}
      sx={{
        width: size,
        height: size,
        bgcolor: photoUrl ? undefined : palette[0],
        color: photoUrl ? undefined : palette[1],
        fontWeight: 700,
      }}
    >
      {initials}
    </Avatar>
  );
}
