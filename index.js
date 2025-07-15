const config = require('./config/bot-config');
const AIGirlfriendBot = require('./src/bot/telegram-bot');
const WebServer = require('./src/web/server');

class AIGirlfriendApp {
    constructor() {
        console.log('🚀 Starting AI Girlfriend Bot Application...');
        console.log(`💕 Bot Name: ${config.bot.name}`);
        console.log(`🌐 Server Port: ${config.server.port}`);
        
        this.telegramBot = null;
        this.webServer = null;
        
        this.validateConfig();
        this.startApplication();
    }
    
    validateConfig() {
        const requiredEnvVars = [
            'TELEGRAM_BOT_TOKEN',
            'OPENAI_API_KEY'
        ];
        
        const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
        
        if (missingVars.length > 0) {
            console.error('❌ Missing required environment variables:');
            missingVars.forEach(varName => {
                console.error(`   - ${varName}`);
            });
            console.error('\n📝 Please create a .env file based on .env.example');
            process.exit(1);
        }
        
        console.log('✅ Configuration validated successfully');
    }
    
    async startApplication() {
        try {
            // Start Telegram Bot
            console.log('🤖 Starting Telegram Bot...');
            this.telegramBot = new AIGirlfriendBot();
            console.log('✅ Telegram Bot started successfully');
            
            // Start Web Server
            console.log('🌐 Starting Web Server...');
            this.webServer = new WebServer();
            this.webServer.start();
            console.log('✅ Web Server started successfully');
            
            console.log('\n🎉 AI Girlfriend Bot is now fully operational!');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`💬 Telegram Bot: Ready for messages`);
            console.log(`🌐 Web Interface: http://localhost:${config.server.port}`);
            console.log(`👥 Both interfaces support Normal 🌸 and Erotic 🔥 modes`);
            console.log(`🗣️  Language: Hinglish (Hindi + English mix)`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            
        } catch (error) {
            console.error('❌ Failed to start application:', error);
            process.exit(1);
        }
    }
    
    gracefulShutdown() {
        console.log('\n🛑 Graceful shutdown initiated...');
        
        if (this.webServer && this.webServer.server) {
            this.webServer.server.close(() => {
                console.log('✅ Web server closed');
            });
        }
        
        console.log('👋 AI Girlfriend Bot shutdown complete');
        process.exit(0);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    if (global.app) {
        global.app.gracefulShutdown();
    } else {
        process.exit(0);
    }
});

process.on('SIGTERM', () => {
    if (global.app) {
        global.app.gracefulShutdown();
    } else {
        process.exit(0);
    }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Start the application
global.app = new AIGirlfriendApp();

