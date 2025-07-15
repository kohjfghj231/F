const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const OpenAI = require('openai');
const config = require('../../config/bot-config');

class WebServer {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIo(this.server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });
        
        this.openai = new OpenAI({
            apiKey: config.openai.apiKey,
            baseURL: config.openai.baseURL
        });
        
        // Store user sessions for web interface
        this.webSessions = new Map();
        
        // Initialize image functionality
        this.imageList = [];
        this.loadImageList();
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupSocketHandlers();
        
        console.log('🌐 Web server initialized');
    }
    
    setupMiddleware() {
        // Enable CORS for all origins
        this.app.use(cors({
            origin: "*",
            methods: ["GET", "POST", "PUT", "DELETE"],
            allowedHeaders: ["Content-Type", "Authorization"]
        }));
        
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        
        // Serve static files
        this.app.use('/js', express.static(path.join(__dirname, 'public/js')));
        this.app.use('/css', express.static(path.join(__dirname, 'public/css')));
        this.app.use('/assets', express.static(path.join(__dirname, 'public/assets')));
        
        // Serve images from the images folder
        this.app.use('/images', express.static(path.resolve(config.bot.images.folder)));
    }
    
    setupRoutes() {
        // Serve main chat interface
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'views/index.html'));
        });
        
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({ 
                status: 'healthy', 
                timestamp: new Date().toISOString(),
                bot: config.bot.name
            });
        });
        
        // API endpoint to get bot info
        this.app.get('/api/bot-info', (req, res) => {
            res.json({
                name: config.bot.name,
                personality: config.bot.personality,
                modes: ['normal', 'erotic'],
                defaultMode: config.bot.defaultMode
            });
        });
    }
    
    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`💕 User connected: ${socket.id}`);
            
            // Initialize user session
            this.initializeWebSession(socket.id);
            
            // Handle user messages
            socket.on('user_message', async (data) => {
                try {
                    const session = this.getWebSession(socket.id);
                    
                    // Update session mode if provided
                    if (data.mode) {
                        session.mode = data.mode;
                    }
                    
                    // Add user message to conversation history
                    session.conversationHistory.push({
                        role: 'user',
                        content: data.message
                    });
                    
                    // Keep conversation history manageable
                    if (session.conversationHistory.length > 20) {
                        session.conversationHistory = session.conversationHistory.slice(-20);
                    }
                    
                    // Show typing indicator
                    socket.emit('typing');
                    
                    // Generate AI response
                    const response = await this.generateWebResponse(session);
                    
                    // Add AI response to conversation history
                    session.conversationHistory.push({
                        role: 'assistant',
                        content: response
                    });
                    
                    // Send response back to client
                    socket.emit('message', {
                        message: response,
                        timestamp: new Date().toISOString(),
                        mode: session.mode
                    });
                    
                } catch (error) {
                    console.error('Error processing message:', error);
                    socket.emit('error', { message: 'Sorry jaan, something went wrong 😔' });
                }
            });
            
            // Handle mode changes
            socket.on('mode_change', (data) => {
                const session = this.getWebSession(socket.id);
                session.mode = data.mode;
                
                // Clear conversation history when switching modes
                session.conversationHistory = [];
                
                socket.emit('mode_changed', { 
                    mode: data.mode,
                    message: `Switched to ${data.mode} mode ${data.mode === 'normal' ? '🌸' : '🔥'}`
                });
                
                console.log(`User ${socket.id} switched to ${data.mode} mode`);
            });
            
            // Handle image requests
            socket.on('image_request', async (data) => {
                try {
                    const session = this.getWebSession(socket.id);
                    
                    if (data.type === 'random') {
                        await this.sendRandomImageWeb(socket, session);
                    } else if (data.type === 'next') {
                        await this.sendNextImageWeb(socket, session);
                    }
                } catch (error) {
                    console.error('Error handling image request:', error);
                    socket.emit('error', { message: 'Sorry jaan, couldn\'t send image right now 😔' });
                }
            });
            
            // Handle disconnection
            socket.on('disconnect', () => {
                console.log(`👋 User disconnected: ${socket.id}`);
                this.webSessions.delete(socket.id);
            });
        });
    }
    
    initializeWebSession(socketId) {
        if (!this.webSessions.has(socketId)) {
            this.webSessions.set(socketId, {
                mode: config.bot.defaultMode,
                conversationHistory: [],
                currentImageIndex: 0,
                createdAt: new Date(),
                lastActive: new Date()
            });
        }
    }
    
    getWebSession(socketId) {
        this.initializeWebSession(socketId);
        const session = this.webSessions.get(socketId);
        session.lastActive = new Date();
        return session;
    }
    
    async generateWebResponse(session) {
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
    cleanupWebSessions() {
        const now = new Date();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        for (const [socketId, session] of this.webSessions.entries()) {
            if (now - session.lastActive > maxAge) {
                this.webSessions.delete(socketId);
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
            });
            
            console.log(`📸 Loaded ${this.imageList.length} images from ${imageFolder}`);
        } catch (error) {
            console.error('Error loading image list:', error);
            this.imageList = [];
        }
    }
    
    // Send random image via web interface
    async sendRandomImageWeb(socket, session) {
        if (this.imageList.length === 0) {
            socket.emit('message', {
                message: "Sorry jaan, I don't have any pictures to share right now 😔 Please add some images to my folder!",
                timestamp: new Date().toISOString()
            });
            return;
        }
        
        const randomIndex = Math.floor(Math.random() * this.imageList.length);
        const imageName = this.imageList[randomIndex];
        const imageUrl = `/images/${imageName}`;
        
        session.currentImageIndex = randomIndex;
        
        const messages = [
            "Here's a picture for you baby 📸💕",
            "Look what I have for you jaan 😘📷",
            "Sending you something special 💋📸",
            "Hope you like this one baby 🥰📷",
            "Just for you sweetheart 💕📸"
        ];
        
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        
        socket.emit('image', {
            imageUrl: imageUrl,
            caption: randomMessage,
            timestamp: new Date().toISOString()
        });
    }
    
    // Send next image via web interface
    async sendNextImageWeb(socket, session) {
        if (this.imageList.length === 0) {
            socket.emit('message', {
                message: "Sorry jaan, I don't have any pictures to share right now 😔 Please add some images to my folder!",
                timestamp: new Date().toISOString()
            });
            return;
        }
        
        session.currentImageIndex = (session.currentImageIndex + 1) % this.imageList.length;
        const imageName = this.imageList[session.currentImageIndex];
        const imageUrl = `/images/${imageName}`;
        
        const messages = [
            "Here's the next one baby 📸💕",
            "Next picture coming up jaan 😘📷",
            "Another one for you love 💋📸",
            "Hope you like this next one 🥰📷",
            "Here's more for you sweetheart 💕📸"
        ];
        
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        const caption = `${randomMessage} (${session.currentImageIndex + 1}/${this.imageList.length})`;
        
        socket.emit('image', {
            imageUrl: imageUrl,
            caption: caption,
            timestamp: new Date().toISOString()
        });
    }
    
    start() {
        this.server.listen(config.server.port, config.server.host, () => {
            console.log(`🚀 Web server running on http://${config.server.host}:${config.server.port}`);
            console.log(`💕 ${config.bot.name} web interface is ready!`);
        });
        
        // Clean up sessions every hour
        setInterval(() => {
            this.cleanupWebSessions();
        }, 60 * 60 * 1000);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down web server...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n👋 Shutting down web server...');
    process.exit(0);
});

// Start the web server if this file is run directly
if (require.main === module) {
    const webServer = new WebServer();
    webServer.start();
}

module.exports = WebServer;

