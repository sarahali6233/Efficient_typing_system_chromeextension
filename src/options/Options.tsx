import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  List,
  ListItem,
  IconButton,
  Paper,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";

interface Rule {
  pattern: string;
  replacement: string;
}

interface Profile {
  id: string;
  name: string;
  rules: Rule[];
}

const Options: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("default");
  const [newPattern, setNewPattern] = useState("");
  const [newReplacement, setNewReplacement] = useState("");
  const [isCreateProfileOpen, setIsCreateProfileOpen] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    const result = await chrome.storage.sync.get([
      "profiles",
      "activeProfileId",
    ]);
    if (result.profiles) {
      setProfiles(result.profiles);
      setSelectedProfileId(result.activeProfileId || "default");
    }
  };

  const handleProfileChange = (event: SelectChangeEvent<string>) => {
    const profileId = event.target.value;
    setSelectedProfileId(profileId);
    chrome.runtime.sendMessage(
      { type: "SET_ACTIVE_PROFILE", profileId },
      () => {}
    );
  };

  const handleCreateProfile = () => {
    if (newProfileName.trim()) {
      chrome.runtime.sendMessage(
        { type: "CREATE_PROFILE", profileName: newProfileName.trim() },
        () => {
          loadProfiles();
          setIsCreateProfileOpen(false);
          setNewProfileName("");
        }
      );
    }
  };

  const handleDeleteProfile = (profileId: string) => {
    if (profileId === "default") return; // Prevent deleting default profile
    chrome.runtime.sendMessage({ type: "DELETE_PROFILE", profileId }, () => {
      loadProfiles();
    });
  };

  const getCurrentProfile = () => {
    return profiles.find((p) => p.id === selectedProfileId);
  };

  const handleAddRule = () => {
    if (newPattern && newReplacement) {
      const currentProfile = getCurrentProfile();
      if (currentProfile) {
        const updatedProfile = {
          ...currentProfile,
          rules: [
            ...currentProfile.rules,
            { pattern: newPattern, replacement: newReplacement },
          ],
        };

        const updatedProfiles = profiles.map((p) =>
          p.id === selectedProfileId ? updatedProfile : p
        );

        chrome.runtime.sendMessage(
          {
            type: "UPDATE_PROFILE_RULES",
            profileId: selectedProfileId,
            rules: updatedProfile.rules,
          },
          () => {
            setProfiles(updatedProfiles);
            setNewPattern("");
            setNewReplacement("");
          }
        );
      }
    }
  };

  const handleDeleteRule = (index: number) => {
    const currentProfile = getCurrentProfile();
    if (currentProfile) {
      const updatedRules = currentProfile.rules.filter((_, i) => i !== index);
      const updatedProfile = { ...currentProfile, rules: updatedRules };
      const updatedProfiles = profiles.map((p) =>
        p.id === selectedProfileId ? updatedProfile : p
      );

      chrome.runtime.sendMessage(
        {
          type: "UPDATE_PROFILE_RULES",
          profileId: selectedProfileId,
          rules: updatedRules,
        },
        () => {
          setProfiles(updatedProfiles);
        }
      );
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Efficient Typing System Settings
        </Typography>

        <Paper sx={{ p: 2, mb: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Active Profile</InputLabel>
              <Select
                value={selectedProfileId}
                label="Active Profile"
                onChange={handleProfileChange}
              >
                {profiles.map((profile) => (
                  <MenuItem key={profile.id} value={profile.id}>
                    {profile.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              startIcon={<AddIcon />}
              onClick={() => setIsCreateProfileOpen(true)}
              sx={{ ml: 2 }}
            >
              New Profile
            </Button>
          </Box>

          <Typography variant="h6" gutterBottom>
            Add New Shortcut
          </Typography>
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <TextField
              label="Type this"
              value={newPattern}
              onChange={(e) => setNewPattern(e.target.value)}
              size="small"
              helperText="The text you want to type"
            />
            <TextField
              label="Replace with"
              value={newReplacement}
              onChange={(e) => setNewReplacement(e.target.value)}
              size="small"
              helperText="What it should become"
            />
            <Button
              variant="contained"
              onClick={handleAddRule}
              disabled={!newPattern || !newReplacement}
            >
              Add Shortcut
            </Button>
          </Box>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h6">
              Current Shortcuts for {getCurrentProfile()?.name}
            </Typography>
            {selectedProfileId !== "default" && (
              <Button
                startIcon={<DeleteIcon />}
                color="error"
                onClick={() => handleDeleteProfile(selectedProfileId)}
              >
                Delete Profile
              </Button>
            )}
          </Box>
          <List>
            {getCurrentProfile()?.rules.map((rule, index) => (
              <ListItem
                key={index}
                secondaryAction={
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => handleDeleteRule(index)}
                  >
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <Typography>
                  {rule.pattern} → {rule.replacement}
                </Typography>
              </ListItem>
            ))}
          </List>
        </Paper>
      </Box>

      <Dialog
        open={isCreateProfileOpen}
        onClose={() => setIsCreateProfileOpen(false)}
      >
        <DialogTitle>Create New Profile</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Profile Name"
            fullWidth
            value={newProfileName}
            onChange={(e) => setNewProfileName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsCreateProfileOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateProfile}
            disabled={!newProfileName.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Options;
