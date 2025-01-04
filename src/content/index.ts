interface ShorthandRule {
  pattern: string;
  replacement: string;
}

interface Profile {
  id: string;
  name: string;
  rules: ShorthandRule[];
}

class TypingSystem {
  private rules: ShorthandRule[] = [];
  private isEnabled: boolean = true;
  private typingHistory: Map<string, string> = new Map();
  private lastWord: string = "";
  private lastCorrection: string | null = null;
  private commonPrefixes = [
    "un",
    "pre",
    "re",
    "dis",
    "mis",
    "over",
    "under",
    "sub",
    "super",
  ];
  private commonSuffixes = [
    "ing",
    "ed",
    "ly",
    "tion",
    "sion",
    "ment",
    "ness",
    "able",
    "ible",
  ];
  private isGoogleDocs: boolean = false;

  constructor() {
    console.log("Typing System initialized");
    this.isGoogleDocs = window.location.href.includes("docs.google.com");
    this.loadRules();
    this.attachEventListeners();
    this.listenForProfileChanges();
  }

  private async loadRules() {
    const result = await chrome.storage.sync.get([
      "profiles",
      "activeProfileId",
      "isEnabled",
      "typingHistory",
    ]);
    console.log("Storage state:", result);

    if (typeof result.isEnabled !== "undefined") {
      this.isEnabled = result.isEnabled;
    }

    const activeProfile = result.profiles?.find(
      (p: Profile) => p.id === result.activeProfileId
    );

    if (activeProfile) {
      console.log("Active profile:", activeProfile.name);
      this.rules = activeProfile.rules;
    }

    if (result.typingHistory) {
      this.typingHistory = new Map(Object.entries(result.typingHistory));
    }
  }

  private listenForProfileChanges() {
    chrome.storage.onChanged.addListener((changes) => {
      console.log("Storage changes:", changes);
      if (changes.profiles || changes.activeProfileId) {
        this.loadRules();
      }
      if (changes.isEnabled) {
        this.isEnabled = changes.isEnabled.newValue;
      }
    });
  }

  private attachEventListeners() {
    if (this.isGoogleDocs) {
      // For Google Docs, we need to attach to the inner iframe
      this.attachToGoogleDocs();
    } else {
      // For regular inputs
      document.addEventListener("input", this.handleInput.bind(this));
      document.addEventListener("keydown", this.handleKeyDown.bind(this));
    }
    console.log("Event listeners attached");
  }

  private attachToGoogleDocs() {
    // Wait for the Google Docs editor to be ready
    const checkForEditor = setInterval(() => {
      const editor = document.querySelector(".docs-texteventtarget-iframe");
      if (editor) {
        clearInterval(checkForEditor);

        // Try to attach to the editor iframe
        try {
          const iframeDocument = (editor as HTMLIFrameElement).contentDocument;
          if (iframeDocument) {
            iframeDocument.addEventListener(
              "input",
              this.handleInput.bind(this)
            );
            iframeDocument.addEventListener(
              "keydown",
              this.handleKeyDown.bind(this)
            );
            console.log("Attached to Google Docs editor");
          }
        } catch (e) {
          console.log("Failed to attach to iframe, trying mutation observer");
          this.attachWithMutationObserver();
        }
      }
    }, 1000);

    // Cleanup after 30 seconds if we haven't found the editor
    setTimeout(() => clearInterval(checkForEditor), 30000);
  }

  private attachWithMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "characterData" ||
          mutation.type === "childList"
        ) {
          const target = mutation.target as HTMLElement;
          if (target && target.textContent) {
            this.handleGoogleDocsChange(target);
          }
        }
      });
    });

    // Start observing the document with the configured parameters
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      characterDataOldValue: true,
    });
  }

  private handleGoogleDocsChange(target: HTMLElement) {
    const text = target.textContent || "";
    const words = text.split(/\s+/);
    const lastWord = words[words.length - 1];

    if (lastWord && lastWord.length >= 2) {
      // Try to apply our rules
      for (const rule of this.rules) {
        if (lastWord === rule.pattern) {
          // Replace the last word
          const newText = text.slice(0, -lastWord.length) + rule.replacement;
          // Use Google Docs' execCommand if available
          if (document.execCommand) {
            document.execCommand("insertText", false, newText);
          }
          break;
        }
      }
    }
  }

  private handleKeyDown(event: KeyboardEvent) {
    // If user presses Backspace after a replacement, revert it
    if (event.key === "Backspace" && this.lastCorrection) {
      const target = event.target as HTMLInputElement | HTMLTextAreaElement;
      if (!target || !("value" in target)) return;

      const cursorPosition = target.selectionStart;
      if (cursorPosition === null) return;

      const text = target.value;
      const beforeCursor = text.slice(0, cursorPosition);
      const afterCursor = text.slice(cursorPosition);

      // Check if we're right after the last correction
      if (beforeCursor.endsWith(this.lastCorrection)) {
        event.preventDefault();
        // Revert to original text
        const newText =
          beforeCursor.slice(0, -this.lastCorrection.length) +
          this.lastWord +
          afterCursor;
        target.value = newText;
        const newPosition =
          cursorPosition - (this.lastCorrection.length - this.lastWord.length);
        target.setSelectionRange(newPosition, newPosition);
        this.lastCorrection = null;
      }
    }
  }

  private handleInput(event: Event) {
    if (!this.isEnabled) return;

    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    if (!target || !("value" in target)) return;

    const cursorPosition = target.selectionStart;
    if (cursorPosition === null) return;

    const text = target.value;
    const beforeCursor = text.slice(0, cursorPosition);
    const afterCursor = text.slice(cursorPosition);

    // Find the last word boundary
    const lastSpace = beforeCursor.lastIndexOf(" ");
    const currentWord = beforeCursor.slice(lastSpace + 1);

    // Don't process if the word is too short or empty
    if (currentWord.length < 2) return;

    console.log("Current word:", currentWord);

    // Try exact matches first
    if (this.tryExactMatch(target, lastSpace, currentWord, afterCursor)) return;

    // Try prefix/suffix patterns
    if (this.tryPrefixSuffixMatch(target, lastSpace, currentWord, afterCursor))
      return;

    // Try similar patterns
    if (
      this.trySimilarPatternMatch(target, lastSpace, currentWord, afterCursor)
    )
      return;

    // Try common abbreviation patterns
    if (this.tryAbbreviationMatch(target, lastSpace, currentWord, afterCursor))
      return;

    // Store the word if it's followed by a space or punctuation
    if (afterCursor.match(/^[\s.,!?]/)) {
      this.updateTypingHistory(currentWord, currentWord);
    }
  }

  private tryExactMatch(
    target: HTMLInputElement | HTMLTextAreaElement,
    lastSpace: number,
    currentWord: string,
    afterCursor: string
  ): boolean {
    // Check existing rules first
    for (const rule of this.rules) {
      if (currentWord === rule.pattern) {
        this.lastWord = currentWord;
        this.lastCorrection = rule.replacement;
        this.applyReplacement(target, lastSpace, rule.replacement, afterCursor);
        return true;
      }
    }
    return false;
  }

  private tryPrefixSuffixMatch(
    target: HTMLInputElement | HTMLTextAreaElement,
    lastSpace: number,
    currentWord: string,
    afterCursor: string
  ): boolean {
    // Check for common prefixes
    for (const prefix of this.commonPrefixes) {
      if (
        currentWord.startsWith(prefix) &&
        currentWord.length > prefix.length
      ) {
        const rest = currentWord.slice(prefix.length);
        if (rest.length >= 2) {
          const suggestion = prefix + rest;
          this.suggestNewRule(currentWord, suggestion);
          return true;
        }
      }
    }

    // Check for common suffixes
    for (const suffix of this.commonSuffixes) {
      if (currentWord.endsWith(suffix) && currentWord.length > suffix.length) {
        const base = currentWord.slice(0, -suffix.length);
        if (base.length >= 2) {
          const suggestion = base + suffix;
          this.suggestNewRule(currentWord, suggestion);
          return true;
        }
      }
    }

    return false;
  }

  private trySimilarPatternMatch(
    target: HTMLInputElement | HTMLTextAreaElement,
    lastSpace: number,
    currentWord: string,
    afterCursor: string
  ): boolean {
    // Look for similar patterns in typing history
    let bestMatch = "";
    let highestSimilarity = 0;

    this.typingHistory.forEach((value, pattern) => {
      const similarity = this.calculateSimilarity(currentWord, pattern);
      if (similarity > 0.8 && similarity > highestSimilarity) {
        bestMatch = value;
        highestSimilarity = similarity;
      }
    });

    if (bestMatch) {
      this.lastWord = currentWord;
      this.lastCorrection = bestMatch;
      this.applyReplacement(target, lastSpace, bestMatch, afterCursor);
      return true;
    }

    return false;
  }

  private tryAbbreviationMatch(
    target: HTMLInputElement | HTMLTextAreaElement,
    lastSpace: number,
    currentWord: string,
    afterCursor: string
  ): boolean {
    // Check for consonant-only abbreviations
    const isConsonantsOnly = /^[bcdfghjklmnpqrstvwxyz]+$/i.test(currentWord);
    if (isConsonantsOnly && currentWord.length >= 2) {
      // Look for words in history that match the consonant pattern
      this.typingHistory.forEach((value, pattern) => {
        const patternConsonants = pattern.replace(/[aeiou]/gi, "");
        if (patternConsonants === currentWord.toLowerCase()) {
          this.suggestNewRule(currentWord, pattern);
          return true;
        }
      });
    }

    // Check for first-letter abbreviations (e.g., "asap" -> "as soon as possible")
    if (currentWord.length >= 2 && currentWord === currentWord.toLowerCase()) {
      const commonAbbreviations: { [key: string]: string } = {
        asap: "as soon as possible",
        fyi: "for your information",
        aka: "also known as",
        tbd: "to be determined",
        imo: "in my opinion",
        tbh: "to be honest",
      };

      if (commonAbbreviations[currentWord]) {
        this.lastWord = currentWord;
        this.lastCorrection = commonAbbreviations[currentWord];
        this.applyReplacement(
          target,
          lastSpace,
          commonAbbreviations[currentWord],
          afterCursor
        );
        return true;
      }
    }

    return false;
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const costs: number[] = [];
    for (let i = 0; i <= longer.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= shorter.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (longer[i - 1] !== shorter[j - 1]) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[shorter.length] = lastValue;
    }

    return (longer.length - costs[shorter.length]) / longer.length;
  }

  private async updateTypingHistory(pattern: string, replacement: string) {
    this.typingHistory.set(pattern, replacement);
    // Convert Map to object for storage
    const historyObj = Object.fromEntries(this.typingHistory);
    await chrome.storage.sync.set({ typingHistory: historyObj });
  }

  private suggestNewRule(pattern: string, replacement: string) {
    // Count how many times this pattern has been used
    let usageCount = 0;
    this.typingHistory.forEach((value, key) => {
      if (key === pattern && value === replacement) {
        usageCount++;
      }
    });

    // If used more than 5 times, suggest adding it as a rule
    if (usageCount > 5) {
      const notification = document.createElement("div");
      notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: white;
        padding: 15px;
        border-radius: 5px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        z-index: 10000;
      `;
      notification.innerHTML = `
        <p>Add "${pattern}" → "${replacement}" as a shortcut?</p>
        <button id="addRule">Yes</button>
        <button id="ignoreRule">No</button>
      `;
      document.body.appendChild(notification);

      document.getElementById("addRule")?.addEventListener("click", () => {
        this.addNewRule(pattern, replacement);
        notification.remove();
      });

      document.getElementById("ignoreRule")?.addEventListener("click", () => {
        notification.remove();
      });

      setTimeout(() => notification.remove(), 5000);
    }
  }

  private async addNewRule(pattern: string, replacement: string) {
    const result = await chrome.storage.sync.get([
      "profiles",
      "activeProfileId",
    ]);
    const profiles = result.profiles || [];
    const activeProfileId = result.activeProfileId;

    const profileIndex = profiles.findIndex(
      (p: Profile) => p.id === activeProfileId
    );
    if (profileIndex !== -1) {
      profiles[profileIndex].rules.push({ pattern, replacement });
      await chrome.storage.sync.set({ profiles });
      this.rules = profiles[profileIndex].rules;
    }
  }

  private applyReplacement(
    target: HTMLInputElement | HTMLTextAreaElement,
    lastSpace: number,
    replacement: string,
    afterCursor: string
  ) {
    console.log("Applying replacement:", replacement);
    const beforeReplacement = target.value.slice(0, lastSpace + 1);
    const newText = beforeReplacement + replacement + afterCursor;
    target.value = newText;

    // Move cursor to end of replaced word
    const newPosition = lastSpace + 1 + replacement.length;
    target.setSelectionRange(newPosition, newPosition);
  }
}

// Initialize the typing system
new TypingSystem();
