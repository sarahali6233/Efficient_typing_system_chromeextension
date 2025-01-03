interface ShorthandRule {
  pattern: string;
  replacement: string;
}

class TypingSystem {
  private rules: ShorthandRule[] = [];
  private isEnabled: boolean = true;

  constructor() {
    console.log("Typing System initialized");
    this.loadRules();
    this.attachEventListeners();
  }

  private async loadRules() {
    const result = await chrome.storage.sync.get(["rules", "isEnabled"]);
    console.log("Loaded rules:", result.rules);
    if (result.rules) {
      this.rules = result.rules;
    }
    if (typeof result.isEnabled !== "undefined") {
      this.isEnabled = result.isEnabled;
    }
  }

  private attachEventListeners() {
    document.addEventListener("input", this.handleInput.bind(this));
    console.log("Event listeners attached");
  }

  private handleInput(event: Event) {
    if (!this.isEnabled) return;

    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    if (!target || !("value" in target)) return;

    const cursorPosition = target.selectionStart;
    if (cursorPosition === null) return;

    // Get the word being typed
    const text = target.value;
    const beforeCursor = text.slice(0, cursorPosition);
    const afterCursor = text.slice(cursorPosition);

    // Find the last word boundary
    const lastSpace = beforeCursor.lastIndexOf(" ");
    const currentWord = beforeCursor.slice(lastSpace + 1);
    console.log("Current word:", currentWord);

    // Check if the current word matches any rules
    for (const rule of this.rules) {
      if (currentWord === rule.pattern) {
        console.log(
          "Match found! Replacing",
          currentWord,
          "with",
          rule.replacement
        );
        // Replace the word
        const newText =
          beforeCursor.slice(0, lastSpace + 1) + rule.replacement + afterCursor;
        target.value = newText;

        // Move cursor to end of replaced word
        const newPosition = lastSpace + 1 + rule.replacement.length;
        target.setSelectionRange(newPosition, newPosition);

        break;
      }
    }
  }
}

// Initialize the typing system
new TypingSystem();
