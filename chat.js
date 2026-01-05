// Chat Application JavaScript
class RapidBloodChat {
    constructor() {
        this.currentUser = null;
        this.currentChat = null;
        this.chats = [];
        this.users = [];
        this.init();
    }

    init() {
        this.loadCurrentUser();
        this.loadChats();
        this.loadUsers();
        this.setupEventListeners();
        this.renderChatList();
        this.showWelcomeMessage();
    }

    loadCurrentUser() {
        // Get current user from localStorage
        const loggedInUser = localStorage.getItem('currentUser');
        if (loggedInUser) {
            this.currentUser = JSON.parse(loggedInUser);
        } else {
            // Redirect to login if no user is logged in
            window.location.href = 'login.html';
        }
    }

    loadChats() {
        const savedChats = localStorage.getItem('rapidBloodChats');
        if (savedChats) {
            this.chats = JSON.parse(savedChats);
        }
    }

    loadUsers() {
        // Load donors and recipients from localStorage
        const donors = JSON.parse(localStorage.getItem('donors') || '[]');
        const recipients = JSON.parse(localStorage.getItem('recipients') || '[]');
        
        this.users = [...donors, ...recipients].filter(user => 
            user.email !== this.currentUser.email
        );
    }

    setupEventListeners() {
        // Search functionality
        document.getElementById('searchChats').addEventListener('input', (e) => {
            this.searchChats(e.target.value);
        });

        // Message input
        const messageInput = document.getElementById('messageInput');
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Search users in modal
        document.getElementById('searchUsers').addEventListener('input', (e) => {
            this.searchUsers(e.target.value);
        });
    }

    renderChatList() {
        const chatList = document.getElementById('chatList');
        chatList.innerHTML = '';

        if (this.chats.length === 0) {
            chatList.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: #666;">
                    <i class="fas fa-comments" style="font-size: 2em; color: #ff6b9d; margin-bottom: 15px;"></i>
                    <p>No conversations yet</p>
                    <p style="font-size: 0.9em;">Start a new chat to connect with donors and recipients</p>
                </div>
            `;
            return;
        }

        this.chats.forEach(chat => {
            const chatElement = this.createChatElement(chat);
            chatList.appendChild(chatElement);
        });
    }

    createChatElement(chat) {
        const chatDiv = document.createElement('div');
        chatDiv.className = 'chat-item';
        chatDiv.onclick = () => this.selectChat(chat.id);

        const lastMessage = chat.messages[chat.messages.length - 1];
        const otherUser = this.getOtherUser(chat);

        chatDiv.innerHTML = `
            <div class="chat-item-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="chat-item-info">
                <div class="chat-item-name">${otherUser.name}</div>
                <div class="chat-item-last-message">${lastMessage ? lastMessage.text : 'No messages yet'}</div>
            </div>
            <div class="chat-item-time">${lastMessage ? this.formatTime(lastMessage.timestamp) : ''}</div>
        `;

        return chatDiv;
    }

    getOtherUser(chat) {
        return chat.participants.find(p => p.email !== this.currentUser.email);
    }

    selectChat(chatId) {
        this.currentChat = this.chats.find(chat => chat.id === chatId);
        this.renderChat();
        this.updateChatHeader();
        this.enableInput();
        
        // Update active state in chat list
        document.querySelectorAll('.chat-item').forEach(item => {
            item.classList.remove('active');
        });
        event.currentTarget.classList.add('active');
    }

    renderChat() {
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = '';

        if (!this.currentChat) {
            this.showWelcomeMessage();
            return;
        }

        this.currentChat.messages.forEach(message => {
            const messageElement = this.createMessageElement(message);
            chatMessages.appendChild(messageElement);
        });

        this.scrollToBottom();
    }

    createMessageElement(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.sender === this.currentUser.email ? 'sent' : 'received'}`;

        messageDiv.innerHTML = `
            <div class="message-content">
                <div>${this.escapeHtml(message.text)}</div>
                <div class="message-time">${this.formatTime(message.timestamp)}</div>
            </div>
        `;

        return messageDiv;
    }

    updateChatHeader() {
        if (!this.currentChat) {
            document.getElementById('currentChatUser').textContent = 'Select a conversation';
            document.getElementById('currentChatStatus').textContent = 'Start chatting with donors and recipients';
            return;
        }

        const otherUser = this.getOtherUser(this.currentChat);
        document.getElementById('currentChatUser').textContent = otherUser.name;
        document.getElementById('currentChatStatus').textContent = `${otherUser.role} • ${otherUser.bloodGroup || 'N/A'}`;
    }

    enableInput() {
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');
        
        messageInput.disabled = false;
        sendBtn.disabled = false;
        messageInput.focus();
    }

    sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const text = messageInput.value.trim();

        if (!text || !this.currentChat) return;

        const message = {
            id: Date.now().toString(),
            text: text,
            sender: this.currentUser.email,
            timestamp: new Date().toISOString()
        };

        this.currentChat.messages.push(message);
        this.saveChats();
        this.renderChat();
        this.updateChatList();
        
        messageInput.value = '';
        this.scrollToBottom();
    }

    updateChatList() {
        // Update the chat list to show the latest message
        this.renderChatList();
        
        // Re-select current chat if it exists
        if (this.currentChat) {
            const chatElement = document.querySelector(`[onclick="selectChat('${this.currentChat.id}')"]`);
            if (chatElement) {
                chatElement.classList.add('active');
            }
        }
    }

    saveChats() {
        localStorage.setItem('rapidBloodChats', JSON.stringify(this.chats));
    }

    scrollToBottom() {
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    searchChats(query) {
        const chatItems = document.querySelectorAll('.chat-item');
        const searchTerm = query.toLowerCase();

        chatItems.forEach(item => {
            const name = item.querySelector('.chat-item-name').textContent.toLowerCase();
            const message = item.querySelector('.chat-item-last-message').textContent.toLowerCase();
            
            if (name.includes(searchTerm) || message.includes(searchTerm)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }

    startNewChat() {
        this.showNewChatModal();
    }

    showNewChatModal() {
        const modal = document.getElementById('newChatModal');
        modal.classList.add('active');
        this.renderUserList();
    }

    closeNewChatModal() {
        const modal = document.getElementById('newChatModal');
        modal.classList.remove('active');
        document.getElementById('searchUsers').value = '';
    }

    renderUserList() {
        const userList = document.getElementById('userList');
        userList.innerHTML = '';

        this.users.forEach(user => {
            const userElement = this.createUserElement(user);
            userList.appendChild(userElement);
        });
    }

    createUserElement(user) {
        const userDiv = document.createElement('div');
        userDiv.className = 'user-item';
        userDiv.onclick = () => this.startChatWithUser(user);

        userDiv.innerHTML = `
            <div class="user-item-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="user-item-info">
                <h5>${user.name}</h5>
                <p>${user.role} • ${user.bloodGroup || 'N/A'}</p>
            </div>
        `;

        return userDiv;
    }

    startChatWithUser(user) {
        // Check if chat already exists
        const existingChat = this.chats.find(chat => 
            chat.participants.some(p => p.email === user.email)
        );

        if (existingChat) {
            this.selectChat(existingChat.id);
        } else {
            // Create new chat
            const newChat = {
                id: Date.now().toString(),
                participants: [this.currentUser, user],
                messages: [],
                createdAt: new Date().toISOString()
            };

            this.chats.push(newChat);
            this.saveChats();
            this.selectChat(newChat.id);
            this.renderChatList();
        }

        this.closeNewChatModal();
    }

    searchUsers(query) {
        const userItems = document.querySelectorAll('.user-item');
        const searchTerm = query.toLowerCase();

        userItems.forEach(item => {
            const name = item.querySelector('h5').textContent.toLowerCase();
            const info = item.querySelector('p').textContent.toLowerCase();
            
            if (name.includes(searchTerm) || info.includes(searchTerm)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }

    toggleChatInfo() {
        const infoPanel = document.getElementById('chatInfoPanel');
        infoPanel.classList.toggle('active');
        
        if (infoPanel.classList.contains('active') && this.currentChat) {
            this.renderChatInfo();
        }
    }

    renderChatInfo() {
        const infoContent = document.getElementById('chatInfoContent');
        const otherUser = this.getOtherUser(this.currentChat);

        infoContent.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: center; margin: 0 auto 15px; color: white; font-size: 2em;">
                    <i class="fas fa-user"></i>
                </div>
                <h4>${otherUser.name}</h4>
                <p style="color: #666;">${otherUser.role}</p>
            </div>
            <div style="border-top: 1px solid #e9ecef; padding-top: 20px;">
                <h5>Contact Information</h5>
                <p><strong>Email:</strong> ${otherUser.email}</p>
                <p><strong>Phone:</strong> ${otherUser.phone || 'Not provided'}</p>
                <p><strong>Blood Group:</strong> ${otherUser.bloodGroup || 'Not specified'}</p>
                <p><strong>Location:</strong> ${otherUser.location || 'Not specified'}</p>
            </div>
            <div style="border-top: 1px solid #e9ecef; padding-top: 20px; margin-top: 20px;">
                <h5>Chat Information</h5>
                <p><strong>Created:</strong> ${this.formatDate(this.currentChat.createdAt)}</p>
                <p><strong>Messages:</strong> ${this.currentChat.messages.length}</p>
            </div>
        `;
    }

    clearChat() {
        if (!this.currentChat) return;

        if (confirm('Are you sure you want to clear this conversation? This action cannot be undone.')) {
            this.currentChat.messages = [];
            this.saveChats();
            this.renderChat();
            this.updateChatList();
        }
    }

    showWelcomeMessage() {
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = `
            <div class="welcome-message">
                <div class="welcome-icon">
                    <i class="fas fa-heartbeat"></i>
                </div>
                <h3>Welcome to RapidBlood Chat</h3>
                <p>Connect with donors and recipients to coordinate blood donations and save lives.</p>
                <div class="welcome-features">
                    <div class="feature">
                        <i class="fas fa-shield-alt"></i>
                        <span>Secure messaging</span>
                    </div>
                    <div class="feature">
                        <i class="fas fa-clock"></i>
                        <span>Real-time chat</span>
                    </div>
                    <div class="feature">
                        <i class="fas fa-users"></i>
                        <span>Direct communication</span>
                    </div>
                </div>
            </div>
        `;
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);

        if (diffInHours < 24) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffInHours < 48) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString();
        }
    }

    formatDate(timestamp) {
        return new Date(timestamp).toLocaleDateString();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    attachFile() {
        alert('File attachment feature coming soon!');
    }

    sendLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = `${position.coords.latitude}, ${position.coords.longitude}`;
                    const message = {
                        id: Date.now().toString(),
                        text: `📍 Location: ${location}`,
                        sender: this.currentUser.email,
                        timestamp: new Date().toISOString()
                    };

                    if (this.currentChat) {
                        this.currentChat.messages.push(message);
                        this.saveChats();
                        this.renderChat();
                        this.updateChatList();
                        this.scrollToBottom();
                    }
                },
                (error) => {
                    alert('Unable to get your location. Please check your browser settings.');
                }
            );
        } else {
            alert('Geolocation is not supported by this browser.');
        }
    }
}

// Global functions for HTML onclick handlers
function startNewChat() {
    chatApp.startNewChat();
}

function closeNewChatModal() {
    chatApp.closeNewChatModal();
}

function sendMessage() {
    chatApp.sendMessage();
}

function toggleChatInfo() {
    chatApp.toggleChatInfo();
}

function clearChat() {
    chatApp.clearChat();
}

function attachFile() {
    chatApp.attachFile();
}

function sendLocation() {
    chatApp.sendLocation();
}

// Initialize chat application
let chatApp;
document.addEventListener('DOMContentLoaded', () => {
    chatApp = new RapidBloodChat();
}); 