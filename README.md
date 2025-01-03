# Efficient Typing System - Chrome Extension

A Chrome extension that enhances typing efficiency by utilizing a shorthand-based system. It allows users to create custom shortcuts, manage multiple profiles, and supports various languages.

## Features

- Shorthand text expansion
- Multiple language support
- Profile management (work, personal, etc.)
- Customizable rules
- Real-time text replacement
- Modern, intuitive UI

## Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the extension:
   ```bash
   npm run build
   ```
4. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` directory from this project

## Development

1. Start the development build with watch mode:
   ```bash
   npm start
   ```
2. Make your changes
3. The extension will automatically rebuild when files change

## Usage

1. Click the extension icon in Chrome to open the popup
2. Enable/disable the extension using the toggle
3. Select your preferred profile and language
4. Open the settings page to manage shorthand rules
5. Add new rules by specifying the shorthand and its expansion

## Default Shortcuts

- "ty" → "thank you"
- "pls" → "please"
- "u" → "you"
- "r" → "are"

You can add, modify, or remove these shortcuts in the settings page.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the ISC License.
