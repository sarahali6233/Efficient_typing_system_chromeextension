// Initialize default settings when the extension is installed
chrome.runtime.onInstalled.addListener(async () => {
  // Set default rules
  const defaultRules = [
    { pattern: "ty", replacement: "thank you" },
    { pattern: "pls", replacement: "please" },
    { pattern: "u", replacement: "you" },
    { pattern: "r", replacement: "are" },
  ];

  // Set default settings
  await chrome.storage.sync.set({
    isEnabled: true,
    rules: defaultRules,
    selectedProfile: "default",
    selectedLanguage: "english",
  });
});

// Listen for messages from popup/options
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_RULES") {
    chrome.storage.sync.get(["rules"], (result) => {
      sendResponse(result.rules || []);
    });
    return true; // Will respond asynchronously
  }
});
