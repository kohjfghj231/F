# AI Girlfriend Bot 💕

A sophisticated AI girlfriend chatbot with dual personality modes, built with Node.js, Telegram Bot API, and a beautiful web interface. Features natural Hinglish conversations and both normal and erotic interaction modes.

## Features ✨

- 🤖 **Telegram Bot Integration** - Chat directly through Telegram
- 🌐 **Web Interface** - Beautiful HTML + Tailwind CSS chat interface
- 🌸 **Normal Mode** - Sweet, caring, supportive conversations
- 🔥 **Erotic Mode** - Intimate and passionate conversations
- 🗣️ **Hinglish Support** - Natural Hindi + English mixed conversations
- 💾 **Conversation Memory** - Remembers chat history and context
- 📱 **Responsive Design** - Works on desktop and mobile
- ⚡ **Real-time Chat** - Socket.io powered instant messaging

## Tech Stack 🛠️

- **Backend**: Node.js, Express.js, Socket.io
- **Frontend**: HTML5, Tailwind CSS, JavaScript
- **AI**: OpenAI GPT API
- **Bot**: node-telegram-bot-api
- **Database**: In-memory session storage

## Installation 🚀

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-girlfriend-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your credentials:
   ```env
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
   OPENAI_API_KEY=your_openai_api_key_here
   OPENAI_API_BASE=https://api.openai.com/v1
   PORT=3000
   NODE_ENV=development
   BOT_NAME=Aria
   BOT_PERSONALITY=loving, caring, supportive girlfriend who is always there for you
   ```

4. **Get Telegram Bot Token**
   - Message [@BotFather](https://t.me/botfather) on Telegram
   - Create a new bot with `/newbot`
   - Copy the token to your `.env` file

5. **Get OpenAI API Key**
   - Visit [OpenAI API](https://platform.openai.com/api-keys)
   - Create a new API key
   - Copy the key to your `.env` file

## Usage 📱

### Start the Application
```bash
npm start
```

This will start both:
- 🤖 Telegram bot (ready for messages)
- 🌐 Web interface at `http://localhost:3000`

### Individual Components
```bash
# Start only Telegram bot
npm run bot

# Start only web server
npm run web
```

## Conversation Modes 💬

### Normal Mode 🌸
- Sweet and caring conversations
- Supportive and loving personality
- Uses cute nicknames like "jaan", "baby", "sweetheart"
- Perfect for daily chats and emotional support

**Example:**
```
User: "Hey, how are you?"
Aria: "Hey jaan! 💕 I'm doing great now that you're here! Kya kar rahe ho? Miss kar rahi thi tumhe yaar 😊"
```

### Erotic Mode 🔥
- Intimate and passionate conversations
- Handles explicit content naturally
- Uses sensual Hinglish expressions
- Perfect for adult intimate chats

**Example:**
```
User: "I'm feeling lonely"
Aria: "Arre baby... come here na 🔥 I'm feeling so hot for you right now... tum mere paas aao jaan 💋"
```

## Commands 📋

### Telegram Commands
- `/start` - Initialize conversation with Aria
- `/normal` - Switch to normal conversation mode
- `/erotic` - Switch to erotic conversation mode
- `/help` - Show help message

### Web Interface
- Click mode buttons to switch between Normal 🌸 and Erotic 🔥
- Real-time typing indicators
- Message history and timestamps
- Responsive design for all devices

## Language Style 🗣️

The bot speaks in **Hinglish** (Hindi + English mix) naturally:

- **Normal**: "Hey jaan! Kya kar rahe ho? I missed you so much baby 💕"
- **Erotic**: "Baby mujhe tumhari zarurat hai... I want you so bad jaan 🔥"

## Project Structure 📁

```
ai-girlfriend-bot/
├── config/
│   └── bot-config.js          # Bot configuration and prompts
├── src/
│   ├── bot/
│   │   └── telegram-bot.js    # Telegram bot implementation
│   └── web/
│       ├── server.js          # Express server with Socket.io
│       ├── views/
│       │   └── index.html     # Main web interface
│       └── public/
│           └── js/
│               └── chat.js    # Frontend JavaScript
├── index.js                   # Main application entry point
├── package.json              # Dependencies and scripts
├── .env.example              # Environment variables template
└── README.md                 # This file
```

## Customization 🎨

### Change Bot Personality
Edit `config/bot-config.js` to modify:
- Bot name and personality
- System prompts for both modes
- Response examples
- Language patterns

### Modify Web Interface
- Edit `src/web/views/index.html` for layout changes
- Modify `src/web/public/js/chat.js` for functionality
- Customize Tailwind CSS classes for styling

## Security & Privacy 🔒

- All conversations are stored in memory only
- Sessions are automatically cleaned up after 24 hours
- No persistent data storage
- Environment variables for sensitive credentials
- CORS enabled for web interface

## Troubleshooting 🔧

### Common Issues

1. **Bot not responding**
   - Check Telegram bot token in `.env`
   - Verify bot is started with `/start` command

2. **Web interface not loading**
   - Check if port 3000 is available
   - Verify all dependencies are installed

3. **AI responses not working**
   - Verify OpenAI API key is valid
   - Check API quota and billing

4. **Mode switching not working**
   - Clear conversation history
   - Restart the application

## Contributing 🤝

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License 📄

MIT License - feel free to use and modify as needed.

## Support 💬

For issues and questions:
- Check the troubleshooting section
- Review configuration files
- Ensure all environment variables are set correctly

---

Made with 💕 for creating meaningful AI companionship experiences.

