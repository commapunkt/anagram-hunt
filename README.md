# Anagram Hunt

A React Native word game where players find sub-words from a seed word within a time limit. Features a dark, relaxing UI, custom keyboard, and support for multiple languages.

## Live Demo

🌐 **Play the game online**: [https://anagram-hunt.commapunkt.com](https://anagram-hunt.commapunkt.com)

## Features

- **Multi-language Support**: English and German with automatic language detection
- **Level System**: Progressive difficulty with different seed words
- **Custom Keyboard**: Visual feedback showing available letters
- **Scoring System**: Points based on word length and rarity
- **Streak Bonuses**: Bonus points for consecutive words of the same length
- **Dark Theme**: Relaxing dark UI design
- **Cross-platform**: Works on mobile and web

## Dev tools

There are a few dev tools, accessible via: [https://anagram-hunt.commapunkt.com?devtools=true](https://anagram-hunt.commapunkt.com?devtools=true)

## Automatic Deployment

This app is automatically deployed to GitHub Pages on every push to the main branch. The deployment process:

1. **Builds** the web version using Expo
2. **Deploys** to GitHub Pages automatically
3. **Updates** the live demo at [https://anagram-hunt.commapunkt.com](https://anagram-hunt.commapunkt.com)

## Installation

```bash
npm install
```

## Running the Game

### Mobile Development
```bash
# Start Expo development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android
```

### Web Development
```bash
# Basic web server (recommended)
npm run web

# Web server with custom port
npm run server

# Web server with development client
npm run web-dev

# Web server with tunnel (for external access)
npm run web-tunnel

# Custom web server with options
npm run launch-web
```

**Note**: The web version uses Metro bundler for optimal performance and compatibility with React Native components.

### Web Server Options

The `launch-web` script provides additional options:

```bash
# Basic launch
npm run launch-web

# With custom port
PORT=8080 npm run launch-web

# With tunnel (for external access)
npm run launch-web --tunnel

# With development client
npm run launch-web --dev

# Combined options
PORT=8080 npm run launch-web --tunnel --dev
```

The web server will be available at `http://localhost:3000` (or your custom port).

## Generating Word Lists

Use the word generation script to create new levels.

First install the depedencies:

```bash
# Install dependency
npm install
```

Here are some examples on how to generate the words list:

```bash

# English words
npm run find-words "understanding"

# German words
npm run find-words "verstehen" "de"

# With custom letter counts
npm run find-words "understanding" "u:1,n:2,d:2,e:1,r:1,s:1,t:1,a:1,i:1,g:1"
```

### Level Management Features
- **Truly Dynamic Loading**: Files are loaded at runtime using fetch (web) and FileSystem (native)
- **Cross-Platform**: Works on web, iOS, and Android
- **Automatic Mapping**: New levels are automatically assigned to the next available level number
- **File Validation**: Scripts check if files exist before adding them
- **No Import Lists**: No need to maintain import mappings - completely dynamic
- **Public Directory Sync**: Automatically syncs files to public directory for web access

## Project Structure

```
anagram-hunt/
├── App.tsx                 # Main game component
├── public/                 # Web-accessible files
│   └── data/              # Synced data files for web
│       ├── en/           # English word files
│       └── de/           # German word files
├── src/
│   ├── data/              # Word lists and level mappings
│   │   ├── en/           # English word files
│   │   └── de/           # German word files
│   ├── translations/     # Language files
│   ├── types/           # TypeScript definitions
│   └── utils/           # Utility functions
├── scripts/
│   ├── find-words.js    # Word generation script
│   ├── add-level-file.js # Level management script
│   ├── list-levels.js   # Level listing script
│   ├── sync-public-data.js # Data sync script
│   └── launch-web.js    # Web server launcher
└── package.json
```

## Technologies Used

- React Native
- Expo
- TypeScript
- React Native Web (for web support)
- Metro (bundler)

## License

MIT
