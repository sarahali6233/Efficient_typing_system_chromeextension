import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
} from "@mui/material";

interface Profile {
  id: string;
  name: string;
  rules: {
    pattern: string;
    replacement: string;
  }[];
}

const Popup: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [selectedProfileId, setSelectedProfileId] = useState("default");
  const [selectedLanguage, setSelectedLanguage] = useState("english");
  const [profiles, setProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const result = await chrome.storage.sync.get([
      "isEnabled",
      "activeProfileId",
      "selectedLanguage",
      "profiles",
    ]);

    setIsEnabled(result.isEnabled ?? true);
    setSelectedProfileId(result.activeProfileId || "default");
    setSelectedLanguage(result.selectedLanguage || "english");
    setProfiles(result.profiles || []);
  };

  const handleToggle = () => {
    setIsEnabled(!isEnabled);
    chrome.storage.sync.set({ isEnabled: !isEnabled });
  };

  const handleProfileChange = (event: SelectChangeEvent<string>) => {
    const profileId = event.target.value;
    setSelectedProfileId(profileId);
    chrome.runtime.sendMessage(
      { type: "SET_ACTIVE_PROFILE", profileId },
      () => {}
    );
  };

  const handleLanguageChange = (event: SelectChangeEvent<string>) => {
    const language = event.target.value;
    setSelectedLanguage(language);
    chrome.storage.sync.set({ selectedLanguage: language });
  };

  return (
    <Box sx={{ width: 300, p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Efficient Typing System
      </Typography>

      <FormControlLabel
        control={
          <Switch checked={isEnabled} onChange={handleToggle} color="primary" />
        }
        label="Enable Extension"
      />

      <Box sx={{ mt: 2 }}>
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>Profile</InputLabel>
          <Select
            value={selectedProfileId}
            label="Profile"
            onChange={handleProfileChange}
          >
            {profiles.map((profile) => (
              <MenuItem key={profile.id} value={profile.id}>
                {profile.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel>Language</InputLabel>
          <Select
            value={selectedLanguage}
            label="Language"
            onChange={handleLanguageChange}
          >
            <MenuItem value="english">English</MenuItem>
            <MenuItem value="spanish">Spanish</MenuItem>
            <MenuItem value="french">French</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Button
        variant="contained"
        fullWidth
        sx={{ mt: 2 }}
        onClick={() => {
          chrome.runtime.openOptionsPage();
        }}
      >
        Open Settings
      </Button>
    </Box>
  );
};

export default Popup;
