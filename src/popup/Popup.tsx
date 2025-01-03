import React, { useState } from "react";
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
} from "@mui/material";

const Popup: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState("default");
  const [selectedLanguage, setSelectedLanguage] = useState("english");

  const handleToggle = () => {
    setIsEnabled(!isEnabled);
    // TODO: Implement chrome.storage.sync.set
  };

  const handleProfileChange = (event: any) => {
    setSelectedProfile(event.target.value);
    // TODO: Implement profile switching logic
  };

  const handleLanguageChange = (event: any) => {
    setSelectedLanguage(event.target.value);
    // TODO: Implement language switching logic
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
            value={selectedProfile}
            label="Profile"
            onChange={handleProfileChange}
          >
            <MenuItem value="default">Default</MenuItem>
            <MenuItem value="work">Work</MenuItem>
            <MenuItem value="personal">Personal</MenuItem>
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
