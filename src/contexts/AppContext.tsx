import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'dark' | 'light';
type Language = 'en' | 'hi';

interface AppContextType {
  theme: Theme;
  language: Language;
  toggleTheme: () => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Login/Register
    'login': 'Login',
    'register': 'Register',
    'email': 'Email',
    'password': 'Password',
    'name': 'Name',
    'playerName': 'Player Name',
    'chooseAvatar': 'Choose Avatar',
    'alreadyAccount': 'Already have an account?',
    'noAccount': "Don't have an account?",
    'createAccount': 'Create Account',
    'loginNow': 'Login Now',
    'registerNow': 'Register Now',
    'enterName': 'Enter your name...',
    'enterEmail': 'your@email.com',
    'enterPassword': 'Enter password...',
    'selectAvatar': 'Select Avatar',
    
    // Lobby
    'lobby': 'Lobby',
    'logout': 'Logout',
    'createRoom': 'Create Room',
    'joinRoom': 'Join Room',
    'playWithAI': 'Play with AI',
    'roomPin': 'Room PIN',
    'maxPlayers': 'Max Players',
    'numberOfBots': 'Number of Bots',
    'chooseMode': 'Choose Your Mode',
    'howToPlay': 'How to Play?',
    'createNewRoom': 'Create new room and share PIN',
    'joinWithPin': 'Join friend\'s room with PIN',
    'playOffline': 'Practice against bots - Offline mode!',
    'goBack': 'Go Back',
    'newRoom': 'New Room',
    'totalPlayers': 'Total Players (including you)',
    'roomWillHave': 'room will be created',
    'enterRoomPin': 'Enter your friend\'s room PIN',
    'pinDigits': 'Room PIN (6 digits)',
    'askHostForPin': 'Ask room host for PIN',
    'botPlayers': 'Bot Players',
    'playersPreview': 'Players Preview',
    'you': 'You',
    'aiBot': 'AI Bot',
    'totalGame': 'Total: {0} players game',
    'aiStrategy': 'AI Strategy: Bots are smart - they use action cards and +4 strategically!',
    'startGame': 'Start Game',
    'instantStart': 'Instant start - No waiting!',
    'howManyPlayers': 'How many players do you want in the room?',
    'howManyBots': 'How many bots do you want to play against?',
    'creating': 'Creating...',
    'joining': 'Joining...',
    'enterPin': 'Enter PIN',
    'pinError': 'PIN must be 6 digits!',
    'joinError': 'Could not join room!',
    
    // Room
    'waitingForPlayers': 'Waiting for players...',
    'waitingRoom': 'Waiting Room',
    'sharePin': 'Share this PIN with your friends so they can join',
    'copied': 'Copied!',
    'copy': 'Copy',
    'waitingForPlayer': 'Waiting for player...',
    'shareThisPin': 'Share PIN',
    'minPlayers': 'Need at least 2 players...',
    'hostWillStart': 'Wait for host to start the game...',
    'closeRoom': 'Close Room',
    'leaveRoom': 'Leave Room',
    'tip': 'Tip',
    'testTip': 'You can test in another browser tab! Register in another tab and join with same PIN.',
    'host': 'Host',
    
    // How to Play
    'aiModeInstant': 'AI mode: Play instantly with bots',
    'createOrJoin': 'Create room or join with PIN',
    'sharePinFriends': 'Share PIN with your friends',
    'playUnoFun': 'Play UNO and have fun!',
    
    // Game
    'yourTurn': 'Your Turn',
    'draw': 'Draw',
    'uno': 'UNO!',
    'chooseColor': 'Choose Color',
    'gameOver': 'Game Over',
    'winner': 'Winner',
    'playAgain': 'Play Again',
    'backToLobby': 'Back to Lobby',
    'cards': 'cards',
    'card': 'card',
    'bot': 'Bot',
    'bots': 'Bots',
  },
  hi: {
    // Login/Register
    'login': 'लॉगिन',
    'register': 'रजिस्टर',
    'email': 'ईमेल',
    'password': 'पासवर्ड',
    'name': 'नाम',
    'playerName': 'खिलाड़ी का नाम',
    'chooseAvatar': 'अवतार चुनें',
    'alreadyAccount': 'पहले से खाता है?',
    'noAccount': 'खाता नहीं है?',
    'createAccount': 'खाता बनाएं',
    'loginNow': 'लॉगिन करें',
    'registerNow': 'रजिस्टर करें',
    'enterName': 'अपना नाम लिखें...',
    'enterEmail': 'apna@email.com',
    'enterPassword': 'पासवर्ड डालें...',
    'selectAvatar': 'अवतार चुनें',
    
    // Lobby
    'lobby': 'लॉबी',
    'logout': 'लॉगआउट',
    'createRoom': 'रूम बनाएं',
    'joinRoom': 'रूम में शामिल हों',
    'playWithAI': 'AI के साथ खेलें',
    'roomPin': 'रूम पिन',
    'maxPlayers': 'अधिकतम खिलाड़ी',
    'numberOfBots': 'बॉट्स की संख्या',
    'chooseMode': 'अपना मोड चुनें',
    'howToPlay': 'कैसे खेलें?',
    'createNewRoom': 'नया रूम बनाएं और PIN शेयर करें',
    'joinWithPin': 'PIN से दोस्त के रूम में शामिल हों',
    'playOffline': 'बॉट्स के साथ प्रैक्टिस करें - ऑफलाइन मोड!',
    'goBack': 'वापस जाएं',
    'newRoom': 'नया रूम',
    'totalPlayers': 'कुल खिलाड़ी (आप शामिल)',
    'roomWillHave': 'खिलाड़ियों का रूम बनेगा',
    'enterRoomPin': 'अपने दोस्त का रूम PIN डालें',
    'pinDigits': 'रूम PIN (6 अंक)',
    'askHostForPin': 'रूम होस्ट से PIN मांगें',
    'botPlayers': 'बॉट खिलाड़ी',
    'playersPreview': 'खिलाड़ियों का पूर्वावलोकन',
    'you': 'आप',
    'aiBot': 'AI बॉट',
    'totalGame': 'कुल: {0} खिलाड़ियों का खेल',
    'aiStrategy': 'AI रणनीति: बॉट्स स्मार्ट हैं - एक्शन कार्ड और +4 रणनीतिक रूप से उपयोग करते हैं!',
    'startGame': 'खेल शुरू करें',
    'instantStart': 'तुरंत शुरू - कोई इंतजार नहीं!',
    'howManyPlayers': 'रूम में कितने खिलाड़ी चाहिए?',
    'howManyBots': 'कितने बॉट्स के साथ खेलना है?',
    'creating': 'बन रहा है...',
    'joining': 'शामिल हो रहे हैं...',
    'enterPin': 'PIN डालें',
    'pinError': 'PIN 6 अंकों का होना चाहिए!',
    'joinError': 'रूम में शामिल नहीं हो सके!',
    
    // Room
    'waitingForPlayers': 'खिलाड़ियों का इंतजार...',
    'waitingRoom': 'प्रतीक्षा कक्ष',
    'sharePin': 'यह PIN अपने दोस्तों को भेजें ताकि वे शामिल हो सकें',
    'copied': 'कॉपी हो गया!',
    'copy': 'कॉपी',
    'waitingForPlayer': 'खिलाड़ी का इंतजार...',
    'shareThisPin': 'PIN शेयर करें',
    'minPlayers': 'कम से कम 2 खिलाड़ी चाहिए...',
    'hostWillStart': 'होस्ट के खेल शुरू करने का इंतजार करें...',
    'closeRoom': 'रूम बंद करें',
    'leaveRoom': 'रूम छोड़ें',
    'tip': 'टिप',
    'testTip': 'दूसरे ब्राउज़र टैब में खोलकर टेस्ट कर सकते हैं! दूसरे टैब में रजिस्टर करके same PIN से join करें।',
    'host': 'होस्ट',
    
    // How to Play
    'aiModeInstant': 'AI मोड: तुरंत बॉट्स के साथ खेलें',
    'createOrJoin': 'रूम बनाएं या PIN से join करें',
    'sharePinFriends': 'PIN अपने दोस्तों को शेयर करें',
    'playUnoFun': 'UNO खेलें और मज़े करें!',
    
    // Game - General
    'yourTurn': 'आपकी बारी',
    'draw': 'कार्ड लें',
    'uno': 'UNO!',
    'chooseColor': 'रंग चुनें',
    'gameOver': 'खेल समाप्त',
    'winner': 'विजेता',
    'playAgain': 'फिर से खेलें',
    'backToLobby': 'लॉबी में वापस',
    'cards': 'कार्ड',
    'card': 'कार्ड',
    'leave': 'छोड़ें',
    'discard': 'डिस्कार्ड',
    'currentColor': 'वर्तमान रंग',
    
    // Color Picker
    'selectColor': 'रंग चुनें!',
    'whichColor': 'कौनसा रंग चाहिए?',
    'red': 'लाल',
    'blue': 'नीला',
    'green': 'हरा',
    'yellow': 'पीला',
    
    // Game Messages
    'yourTurnPlay': 'आपकी बारी! कार्ड खेलें या ड्रॉ करें।',
    'thinking': 'सोच रहा है...',
    'drawCard': 'कार्ड लें!',
    'youWon': 'आप जीत गए!',
    'awesome': 'शानदार! आपने सभी बॉट्स को हरा दिया!',
    'botWon': 'ने गेम जीत लिया',
    'vsBot': 'vs',
    'bot': 'बॉट',
    'bots': 'बॉट्स',
    'pin': 'पिन',
  },
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('uno-theme');
    return (saved as Theme) || 'dark'; // Default is dark
  });

  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('uno-language');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('uno-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('uno-language', language);
  }, [language]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'hi' : 'en');
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <AppContext.Provider value={{ theme, language, toggleTheme, toggleLanguage, t }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
