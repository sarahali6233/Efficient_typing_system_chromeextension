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
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

interface Rule {
  pattern: string;
  replacement: string;
}

const Options: React.FC = () => {
  const [rules, setRules] = useState<Rule[]>([]);
  const [newPattern, setNewPattern] = useState("");
  const [newReplacement, setNewReplacement] = useState("");

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    const result = await chrome.storage.sync.get(["rules"]);
    if (result.rules) {
      setRules(result.rules);
    }
  };

  const saveRules = async (updatedRules: Rule[]) => {
    await chrome.storage.sync.set({ rules: updatedRules });
    setRules(updatedRules);
  };

  const handleAddRule = () => {
    if (newPattern && newReplacement) {
      const updatedRules = [
        ...rules,
        { pattern: newPattern, replacement: newReplacement },
      ];
      saveRules(updatedRules);
      setNewPattern("");
      setNewReplacement("");
    }
  };

  const handleDeleteRule = (index: number) => {
    const updatedRules = rules.filter((_, i) => i !== index);
    saveRules(updatedRules);
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Efficient Typing System Settings
        </Typography>

        <Paper sx={{ p: 2, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Add New Shorthand Rule
          </Typography>
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <TextField
              label="Shorthand"
              value={newPattern}
              onChange={(e) => setNewPattern(e.target.value)}
              size="small"
            />
            <TextField
              label="Expansion"
              value={newReplacement}
              onChange={(e) => setNewReplacement(e.target.value)}
              size="small"
            />
            <Button
              variant="contained"
              onClick={handleAddRule}
              disabled={!newPattern || !newReplacement}
            >
              Add Rule
            </Button>
          </Box>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Current Rules
          </Typography>
          <List>
            {rules.map((rule, index) => (
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
    </Container>
  );
};

export default Options;
