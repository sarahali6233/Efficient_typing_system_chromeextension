interface ShorthandRule {
  pattern: string;
  replacement: string;
}

interface Profile {
  id: string;
  name: string;
  rules: ShorthandRule[];
}

// Initialize default settings when the extension is installed
chrome.runtime.onInstalled.addListener(async () => {
  // Set just a few example rules
  const defaultRules: ShorthandRule[] = [
    { pattern: "ty", replacement: "thank you" },
    { pattern: "pls", replacement: "please" },
  ];

  const defaultProfiles: Profile[] = [
    {
      id: "default",
      name: "Default",
      rules: defaultRules,
    },
    {
      id: "work",
      name: "Work",
      rules: [],
    },
    {
      id: "personal",
      name: "Personal",
      rules: [],
    },
  ];

  // Set default settings
  await chrome.storage.sync.set({
    isEnabled: true,
    activeProfileId: "default",
    profiles: defaultProfiles,
    selectedLanguage: "english",
  });
});

// Listen for messages from popup/options
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case "GET_PROFILES":
      chrome.storage.sync.get(["profiles"], (result) => {
        sendResponse(result.profiles || []);
      });
      return true;

    case "GET_ACTIVE_PROFILE":
      chrome.storage.sync.get(["profiles", "activeProfileId"], (result) => {
        const activeProfile = result.profiles?.find(
          (p: Profile) => p.id === result.activeProfileId
        );
        sendResponse(activeProfile || null);
      });
      return true;

    case "SET_ACTIVE_PROFILE":
      chrome.storage.sync.set({ activeProfileId: message.profileId }, () => {
        sendResponse({ success: true });
      });
      return true;

    case "CREATE_PROFILE":
      chrome.storage.sync.get(["profiles"], (result) => {
        const profiles = result.profiles || [];
        const newProfile: Profile = {
          id: Date.now().toString(),
          name: message.profileName,
          rules: [],
        };
        profiles.push(newProfile);
        chrome.storage.sync.set({ profiles }, () => {
          sendResponse({ success: true, profile: newProfile });
        });
      });
      return true;

    case "DELETE_PROFILE":
      chrome.storage.sync.get(["profiles", "activeProfileId"], (result) => {
        const profiles = result.profiles || [];
        const filteredProfiles = profiles.filter(
          (p: Profile) => p.id !== message.profileId
        );

        const updates: any = { profiles: filteredProfiles };
        if (result.activeProfileId === message.profileId) {
          updates.activeProfileId = "default";
        }

        chrome.storage.sync.set(updates, () => {
          sendResponse({ success: true });
        });
      });
      return true;

    case "UPDATE_PROFILE_RULES":
      chrome.storage.sync.get(["profiles"], (result) => {
        const profiles = result.profiles || [];
        const profileIndex = profiles.findIndex(
          (p: Profile) => p.id === message.profileId
        );

        if (profileIndex !== -1) {
          profiles[profileIndex].rules = message.rules;
          chrome.storage.sync.set({ profiles }, () => {
            sendResponse({ success: true });
          });
        } else {
          sendResponse({ success: false, error: "Profile not found" });
        }
      });
      return true;
  }
});
