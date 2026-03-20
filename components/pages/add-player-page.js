"use client";

import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import { Avatar, Box, Button, Stack, TextField, Typography } from "@mui/material";
import { SectionCard } from "../common/section-card";

export function AddPlayerPage({
  username,
  photoPreview,
  uploading,
  onChangeUsername,
  onChangePhoto,
  onSubmit,
}) {
  return (
    <Box maxWidth={520}>
      <SectionCard title="Register player">
        <Stack spacing={3}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              src={photoPreview || undefined}
              sx={{
                width: 88,
                height: 88,
                bgcolor: "grey.200",
              }}
            >
              <CloudUploadOutlinedIcon />
            </Avatar>
            <Stack spacing={0.5}>
              <Button component="label" variant="outlined">
                Upload photo
                <input hidden accept="image/*" type="file" onChange={onChangePhoto} />
              </Button>
              <Typography variant="caption" color="text.secondary">
                JPG or PNG, max 4 MB, stored on Google Drive
              </Typography>
              {uploading ? (
                <Typography variant="caption" color="primary">
                  Uploading photo...
                </Typography>
              ) : null}
            </Stack>
          </Stack>

          <TextField
            label="Username"
            value={username}
            onChange={(event) => onChangeUsername(event.target.value)}
            placeholder="e.g. Suresh"
          />

          <Button variant="contained" onClick={onSubmit}>
            Register player
          </Button>
        </Stack>
      </SectionCard>
    </Box>
  );
}
