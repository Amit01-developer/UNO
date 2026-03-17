# 🃏 UNO Online

A real-time multiplayer UNO card game built with React, TypeScript, Firebase, and Tailwind CSS.

## ✨ Features

- 🌐 **Online Multiplayer** — Create or join rooms with a 6-digit PIN
- 🤖 **AI Mode** — Play offline against 1–3 smart bots
- 🌙 **Dark / Light Theme** — Toggle anytime, saved across sessions
- 🇮🇳 **Hindi / English** — Full bilingual support
- 🎵 **Background Music** — With volume control
- 📱 **Responsive** — Works on mobile and desktop

## 🚀 Tech Stack

- **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **Firebase Firestore** — Real-time game state sync
- **Vite** — Build tool
- **Vercel** — Deployment

## 🛠️ Local Setup

```bash
# Install dependencies
npm install

# Create .env file with your Firebase config
cp .env.example .env

# Start dev server
npm run dev
```

## 🔑 Environment Variables

Create a `.env` file in the root with your Firebase project credentials:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

> ⚠️ Never commit your `.env` file — it's in `.gitignore`

## 🎮 How to Play

1. **Register / Login** with email and password
2. Choose a mode:
   - **AI Mode** — Instant game vs bots, no internet needed
   - **Create Room** — Get a 6-digit PIN, share with friends
   - **Join Room** — Enter a friend's PIN to join
3. Host starts the game when everyone is ready
4. Play UNO — match color or number, use action cards, shout UNO on last card!

## 📦 Build & Deploy

```bash
# Production build
npm run build

# Preview build locally
npm run preview
```

Deploy to **Vercel** — just connect your GitHub repo and add the environment variables in the Vercel dashboard.

## 📁 Project Structure

```
src/
├── components/
│   ├── AIGameBoard.tsx     # AI game screen
│   ├── GameBoard.tsx       # Multiplayer game screen
│   ├── LobbyScreen.tsx     # Mode selection
│   ├── LoginScreen.tsx     # Auth screen
│   ├── RoomScreen.tsx      # Waiting room
│   ├── UnoCard.tsx         # Card component
│   ├── ColorPicker.tsx     # Wild card color selector
│   ├── PlayerHand.tsx      # Player's cards
│   ├── OpponentHand.tsx    # Opponent's cards
│   └── BackgroundMusic.tsx # Music controls
├── contexts/
│   └── AppContext.tsx      # Theme & language state
├── utils/
│   ├── firebase.ts         # Firebase init
│   ├── room.ts             # Firestore room logic
│   ├── auth.ts             # Local auth helpers
│   └── cn.ts               # Tailwind class merger
├── gameLogic.ts            # UNO rules & AI logic
└── types.ts                # TypeScript types
```
