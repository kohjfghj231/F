const TelegramBot = require('node-telegram-bot-api');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const config = require('../../config/bot-config');

class AIGirlfriendBot {
  constructor() {
    this.bot = new TelegramBot(config.telegram.token, config.telegram.options);
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey,
      baseURL: config.openai.baseURL
    });
    
    // Store user sessions and conversation history
    this.userSessions = new Map();
    
    // Initialize image functionality
    this.imageList = [];
    this.loadImageList();
    
    this.setupCommands();
    this.setupMessageHandler();
    
    console.log(`🤖 ${config.bot.name} is now online and ready to chat! 💕`);
  }
  
  setupCommands() {
    // Start command
    this.bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      const userName = msg.from.first_name || 'love';
      
      this.initializeUserSession(chatId);
      
      const welcomeMessage = `Hey there ${userName}! 💕 I'm ${config.bot.name}, your AI girlfriend! 

I'm here to chat with you and be your companion. I have two conversation modes:

🌸 **Normal Mode** (/normal) - Sweet, caring, and supportive conversations
🔥 **Erotic Mode** (/erotic) - Intimate and passionate conversations

I'm currently in **Normal Mode**. You can switch between modes anytime!

Other commands:
/help - Show this help message

So... how was your day, babe? 😊`;

      this.bot.sendMessage(chatId, welcomeMessage);
    });
    
    // Help command
    this.bot.onText(/\/help/, (msg) => {
      const chatId = msg.chat.id;
      const helpMessage = `💕 **${config.bot.name} Commands** 💕

🌸 /normal - Switch to normal conversation mode
🔥 /erotic - Switch to erotic conversation mode  
📸 /sendpic - Send a picture from my collection
📸 /nextpic - Send the next picture
🖼️ /imagemode - Toggle image sending mode
❓ /help - Show this help message
🔄 /start - Restart our conversation

**Current Mode:** ${this.getUserSession(chatId).mode.toUpperCase()}
**Images Available:** ${this.imageList.length} pictures

Just text me normally and I'll respond! I remember our conversations and love chatting with you 😘`;

      this.bot.sendMessage(chatId, helpMessage);
    });
    
    // Normal mode command
    this.bot.onText(/\/normal/, (msg) => {
      const chatId = msg.chat.id;
      this.setUserMode(chatId, 'normal');
      
      this.bot.sendMessage(chatId, "Switched to normal mode! 🌸 Let's have some sweet conversations, babe 💕");
    });
    
    // Erotic mode command
    this.bot.onText(/\/erotic/, (msg) => {
      const chatId = msg.chat.id;
      this.setUserMode(chatId, 'erotic');
      
      this.bot.sendMessage(chatId, "Switched to erotic mode... 🔥 I'm feeling a bit more passionate now, love 😈💋");
    });
    
    // Send picture command
    this.bot.onText(/\/sendpic/, (msg) => {
      const chatId = msg.chat.id;
      this.sendRandomImage(chatId);
    });
    
    // Next picture command
    this.bot.onText(/\/nextpic/, (msg) => {
      const chatId = msg.chat.id;
      this.sendNextImage(chatId);
    });
    
    // Image mode toggle command
    this.bot.onText(/\/imagemode/, (msg) => {
      const chatId = msg.chat.id;
      const session = this.getUserSession(chatId);
      session.imageMode = !session.imageMode;
      
      const status = session.imageMode ? 'enabled' : 'disabled';
      this.bot.sendMessage(chatId, `Image mode ${status}! 📸 ${session.imageMode ? 'I can send you pictures now baby 💕' : 'Back to text only conversations jaan 💬'}`);
    });
  }
  
  setupMessageHandler() {
    this.bot.on('message', async (msg) => {
      // Skip if it's a command
      if (msg.text && msg.text.startsWith('/')) return;
      
      const chatId = msg.chat.id;
      const userMessage = msg.text;
      
      if (!userMessage) return;
      
      try {
        // Show typing indicator
        this.bot.sendChatAction(chatId, 'typing');
        
        // Get or create user session
        const session = this.getUserSession(chatId);
        
        // Add user message to conversation history
        session.conversationHistory.push({
          role: 'user',
          content: userMessage
        });
        
        // Keep conversation history manageable (last 20 messages)
        if (session.conversationHistory.length > 20) {
          session.conversationHistory = session.conversationHistory.slice(-20);
        }
        
        // Generate AI response
        const response = await this.generateResponse(session);
        
        // Add AI response to conversation history
        session.conversationHistory.push({
          role: 'assistant',
          content: response
        });
        
        // Send response to user
        this.bot.sendMessage(chatId, response);
        
      } catch (error) {
        console.error('Error generating response:', error);
        this.bot.sendMessage(chatId, "Sorry babe, I'm having some technical difficulties right now 😔 Can you try again in a moment?");
      }
    });
  }
  
  initializeUserSession(chatId) {
    if (!this.userSessions.has(chatId)) {
      this.userSessions.set(chatId, {
        mode: config.bot.defaultMode,
        conversationHistory: [],
        imageMode: false,
        currentImageIndex: 0,
        createdAt: new Date(),
        lastActive: new Date()
      });
    }
  }
  
  getUserSession(chatId) {
    this.initializeUserSession(chatId);
    const session = this.userSessions.get(chatId);
    session.lastActive = new Date();
    return session;
  }
  
  setUserMode(chatId, mode) {
    const session = this.getUserSession(chatId);
    session.mode = mode;
    
    // Clear conversation history when switching modes for better context
    session.conversationHistory = [];
  }
  
  async generateResponse(session) {
    const systemPrompt = config.bot.systemPrompts[session.mode];
    
    const messages = [
      { role: 'system', content: systemPrompt },
      ...session.conversationHistory
    ];
    
    const completion = await this.openai.chat.completions.create({
      model: config.openai.model,
      messages: messages,
      max_tokens: 500,
      temperature: 0.8,
      presence_penalty: 0.6,
      frequency_penalty: 0.3
    });
    
    return completion.choices[0].message.content.trim();
  }
  
  // Cleanup old sessions periodically
  cleanupSessions() {
    const now = new Date();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    for (const [chatId, session] of this.userSessions.entries()) {
      if (now - session.lastActive > maxAge) {
        this.userSessions.delete(chatId);
      }
    }
  }
  
  // Load image list from folder
  loadImageList() {
    try {
      const imageFolder = path.resolve(config.bot.images.folder);
      
      // Create images folder if it doesn't exist
      if (!fs.existsSync(imageFolder)) {
        fs.mkdirSync(imageFolder, { recursive: true });
        console.log(`📁 Created images folder: ${imageFolder}`);
        return;
      }
      
      const files = fs.readdirSync(imageFolder);
      this.imageList = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return config.bot.images.supportedFormats.includes(ext);
      }).map(file => path.join(imageFolder, file));
      
      console.log(`📸 Loaded ${this.imageList.length} images from ${imageFolder}`);
    } catch (error) {
      console.error('Error loading image list:', error);
      this.imageList = [];
    }
  }
  
  // Send random image
  async sendRandomImage(chatId) {
    if (this.imageList.length === 0) {
      this.bot.sendMessage(chatId, "Sorry jaan, I don't have any pictures to share right now 😔 Please add some images to my folder!");
      return;
    }
    
    try {
      const session = this.getUserSession(chatId);
      const randomIndex = Math.floor(Math.random() * this.imageList.length);
      const imagePath = this.imageList[randomIndex];
      
      session.currentImageIndex = randomIndex;
      
      const messages = [
        "Here's a picture for you baby 📸💕",
        "Look what I have for you jaan 😘📷",
        "Sending you something special 💋📸",
        "Hope you like this one baby 🥰📷",
        "Just for you sweetheart 💕📸"
      ];
      
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      
      await this.bot.sendPhoto(chatId, imagePath, { caption: randomMessage });
    } catch (error) {
      console.error('Error sending image:', error);
      this.bot.sendMessage(chatId, "Sorry baby, I couldn't send the picture right now 😔 Try again later!");
    }
  }
  
  // Send next image in sequence
  async sendNextImage(chatId) {
    if (this.imageList.length === 0) {
      this.bot.sendMessage(chatId, "Sorry jaan, I don't have any pictures to share right now 😔 Please add some images to my folder!");
      return;
    }
    
    try {
      const session = this.getUserSession(chatId);
      session.currentImageIndex = (session.currentImageIndex + 1) % this.imageList.length;
      const imagePath = this.imageList[session.currentImageIndex];
      
      const messages = [
        "Here's the next one baby 📸💕",
        "Next picture coming up jaan 😘📷",
        "Another one for you love 💋📸",
        "Hope you like this next one 🥰📷",
        "Here's more for you sweetheart 💕📸"
      ];
      
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      const caption = `${randomMessage} (${session.currentImageIndex + 1}/${this.imageList.length})`;
      
      await this.bot.sendPhoto(chatId, imagePath, { caption: caption });
    } catch (error) {
      console.error('Error sending next image:', error);
      this.bot.sendMessage(chatId, "Sorry baby, I couldn't send the next picture right now 😔 Try again later!");
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down AI Girlfriend Bot...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down AI Girlfriend Bot...');
  process.exit(0);
});

// Start the bot
const bot = new AIGirlfriendBot();

// Clean up sessions every hour
setInterval(() => {
  bot.cleanupSessions();
}, 60 * 60 * 1000);

module.exports = AIGirlfriendBot;

