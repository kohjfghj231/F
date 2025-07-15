class ChatInterface {
    constructor() {
        this.socket = io();
        this.currentMode = 'normal';
        this.isTyping = false;
        
        this.initializeElements();
        this.setupEventListeners();
        this.setupSocketListeners();
        
        console.log('💕 Aria Chat Interface Initialized');
    }
    
    initializeElements() {
        this.chatContainer = document.getElementById('chatContainer');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.typingIndicator = document.getElementById('typingIndicator');
        this.normalModeBtn = document.getElementById('normalMode');
        this.eroticModeBtn = document.getElementById('eroticMode');
        this.sendImageBtn = document.getElementById('sendImageBtn');
        this.nextImageBtn = document.getElementById('nextImageBtn');
        this.currentModeSpan = document.getElementById('currentMode');
    }
    
    setupEventListeners() {
        // Send message on button click
        this.sendButton.addEventListener('click', () => this.sendMessage());
        
        // Send message on Enter key
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Mode switching
        this.normalModeBtn.addEventListener('click', () => this.switchMode('normal'));
        this.eroticModeBtn.addEventListener('click', () => this.switchMode('erotic'));
        
        // Image sending
        this.sendImageBtn.addEventListener('click', () => this.sendImageRequest('random'));
        this.nextImageBtn.addEventListener('click', () => this.sendImageRequest('next'));
        
        // Auto-resize input and focus
        this.messageInput.addEventListener('input', this.handleInputChange.bind(this));
        this.messageInput.focus();
    }
    
    setupSocketListeners() {
        this.socket.on('message', (data) => {
            this.hideTypingIndicator();
            this.addMessage(data.message, 'aria', data.timestamp);
        });
        
        this.socket.on('image', (data) => {
            this.hideTypingIndicator();
            this.addImageMessage(data.imageUrl, data.caption, 'aria', data.timestamp);
        });
        
        this.socket.on('typing', () => {
            this.showTypingIndicator();
        });
        
        this.socket.on('mode_changed', (data) => {
            this.currentMode = data.mode;
            this.updateModeUI();
            this.addSystemMessage(`Switched to ${data.mode} mode ${data.mode === 'normal' ? '🌸' : '🔥'}`);
        });
        
        this.socket.on('error', (error) => {
            this.addSystemMessage('Sorry jaan, something went wrong 😔 Please try again!');
            console.error('Socket error:', error);
        });
    }
    
    sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || this.isTyping) return;
        
        // Add user message to chat
        this.addMessage(message, 'user');
        
        // Clear input
        this.messageInput.value = '';
        
        // Show typing indicator
        this.showTypingIndicator();
        
        // Send to server
        this.socket.emit('user_message', {
            message: message,
            mode: this.currentMode,
            timestamp: new Date().toISOString()
        });
    }
    
    switchMode(mode) {
        if (mode === this.currentMode) return;
        
        this.currentMode = mode;
        this.updateModeUI();
        
        // Notify server about mode change
        this.socket.emit('mode_change', { mode: mode });
    }
    
    sendImageRequest(type) {
        if (this.isTyping) return;
        
        // Show typing indicator
        this.showTypingIndicator();
        
        // Send image request to server
        this.socket.emit('image_request', {
            type: type, // 'random' or 'next'
            mode: this.currentMode,
            timestamp: new Date().toISOString()
        });
    }
    
    updateModeUI() {
        // Update button states
        if (this.currentMode === 'normal') {
            this.normalModeBtn.classList.add('bg-pink-500', 'hover:bg-pink-600');
            this.normalModeBtn.classList.remove('bg-gray-400', 'hover:bg-gray-500');
            this.eroticModeBtn.classList.add('bg-gray-400', 'hover:bg-gray-500');
            this.eroticModeBtn.classList.remove('bg-red-500', 'hover:bg-red-600');
            this.currentModeSpan.innerHTML = 'Current Mode: <span class=\"font-semibold text-pink-200\">🌸 Normal</span>';
        } else {
            this.eroticModeBtn.classList.add('bg-red-500', 'hover:bg-red-600');
            this.eroticModeBtn.classList.remove('bg-gray-400', 'hover:bg-gray-500');
            this.normalModeBtn.classList.add('bg-gray-400', 'hover:bg-gray-500');
            this.normalModeBtn.classList.remove('bg-pink-500', 'hover:bg-pink-600');
            this.currentModeSpan.innerHTML = 'Current Mode: <span class=\"font-semibold text-red-200\">🔥 Erotic</span>';
        }
    }
    
    addMessage(message, sender, timestamp = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message-bubble flex items-start space-x-3';
        
        const time = timestamp ? new Date(timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now';
        
        if (sender === 'user') {
            messageDiv.classList.add('flex-row-reverse', 'space-x-reverse');
            messageDiv.innerHTML = `
                <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <i class="fas fa-user text-white"></i>
                </div>
                <div class="bg-blue-500 text-white rounded-2xl rounded-tr-sm p-4 max-w-xs shadow-lg">
                    <p>${this.escapeHtml(message)}</p>
                    <span class="text-xs text-blue-100 mt-2 block">${time}</span>
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <i class="fas fa-heart text-white"></i>
                </div>
                <div class="bg-white rounded-2xl rounded-tl-sm p-4 max-w-xs shadow-lg">
                    <p class="text-gray-800">${this.escapeHtml(message)}</p>
                    <span class="text-xs text-gray-500 mt-2 block">${time}</span>
                </div>
            `;
        }
        
        this.chatContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }
    
    addImageMessage(imageUrl, caption, sender, timestamp = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message-bubble flex items-start space-x-3';
        
        const time = timestamp ? new Date(timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now';
        
        messageDiv.innerHTML = `
            <div class="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                <i class="fas fa-heart text-white"></i>
            </div>
            <div class="bg-white rounded-2xl rounded-tl-sm p-4 max-w-sm shadow-lg">
                <img src="${imageUrl}" alt="Image from Aria" class="w-full h-auto rounded-lg mb-2 max-h-64 object-cover">
                <p class="text-gray-800">${this.escapeHtml(caption)}</p>
                <span class="text-xs text-gray-500 mt-2 block">${time}</span>
            </div>
        `;
        
        this.chatContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }
    
    addSystemMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message-bubble flex justify-center';
        messageDiv.innerHTML = `
            <div class="bg-gray-500 text-white rounded-full px-4 py-2 text-sm">
                ${this.escapeHtml(message)}
            </div>
        `;
        
        this.chatContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }
    
    showTypingIndicator() {
        this.isTyping = true;
        this.typingIndicator.classList.remove('hidden');
        this.scrollToBottom();
    }
    
    hideTypingIndicator() {
        this.isTyping = false;
        this.typingIndicator.classList.add('hidden');
    }
    
    handleInputChange() {
        // Auto-resize functionality could be added here
        // For now, just ensure the input is focused
        if (this.messageInput.value.length === 0) {
            this.messageInput.placeholder = this.currentMode === 'normal' 
                ? "Type your message jaan... 💕" 
                : "Tell me your desires baby... 🔥";
        }
    }
    
    scrollToBottom() {
        setTimeout(() => {
            this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
        }, 100);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize chat interface when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ChatInterface();
});

// Handle page visibility for better UX
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        document.getElementById('messageInput')?.focus();
    }
});

