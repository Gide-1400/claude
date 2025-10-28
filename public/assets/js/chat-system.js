// Advanced Real-time Chat System for Fast Shipment Platform
// نظام الدردشة المباشرة المتقدم لمنصة الشحنة السريعة

class ChatSystem {
    constructor() {
        this.supabase = window.supabaseClient;
        this.currentUser = null;
        this.currentConversation = null;
        this.conversations = new Map();
        this.messages = new Map();
        this.typingStatus = new Map();
        this.channel = null;
        this.messageQueue = [];
        this.isOnline = true;
        
        this.init();
    }
    
    async init() {
        // Get current user
        const userProfile = window.authManager?.getUserProfile();
        if (!userProfile) {
            console.error('User not authenticated');
            return;
        }
        
        this.currentUser = userProfile;
        
        // Setup realtime subscriptions
        await this.setupRealtimeSubscriptions();
        
        // Load conversations
        await this.loadConversations();
        
        // Setup UI event listeners
        this.setupEventListeners();
        
        // Check online status
        this.setupOnlineStatusMonitoring();
        
        // Process any queued messages
        this.processMessageQueue();
    }
    
    // Setup realtime subscriptions for messages and typing status
    async setupRealtimeSubscriptions() {
        if (!this.supabase) return;
        
        // Subscribe to messages channel
        this.channel = this.supabase.channel('chat-room', {
            config: {
                broadcast: { self: true },
                presence: { key: this.currentUser.id }
            }
        });
        
        // Listen for new messages
        this.channel
            .on('postgres_changes', 
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${this.currentUser.id}`
                },
                (payload) => {
                    this.handleNewMessage(payload.new);
                }
            )
            .on('postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'messages',
                    filter: `sender_id=eq.${this.currentUser.id}`
                },
                (payload) => {
                    this.handleMessageUpdate(payload.new);
                }
            );
        
        // Listen for typing status
        this.channel
            .on('broadcast', 
                { event: 'typing' },
                (payload) => {
                    this.handleTypingStatus(payload.payload);
                }
            );
        
        // Listen for read receipts
        this.channel
            .on('broadcast',
                { event: 'read_receipt' },
                (payload) => {
                    this.handleReadReceipt(payload.payload);
                }
            );
        
        // Track presence (online/offline status)
        this.channel
            .on('presence', 
                { event: 'sync' },
                () => {
                    const state = this.channel.presenceState();
                    this.updateOnlineUsers(state);
                }
            )
            .on('presence',
                { event: 'join' },
                ({ key, newPresences }) => {
                    this.handleUserJoin(key, newPresences);
                }
            )
            .on('presence',
                { event: 'leave' },
                ({ key, leftPresences }) => {
                    this.handleUserLeave(key, leftPresences);
                }
            );
        
        // Subscribe to the channel
        await this.channel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log('Chat system connected');
                this.trackPresence();
            }
        });
    }
    
    // Track user presence
    async trackPresence() {
        await this.channel.track({
            user_id: this.currentUser.id,
            user_name: this.currentUser.name,
            user_type: this.currentUser.user_type,
            online_at: new Date().toISOString()
        });
    }
    
    // Load user conversations
    async loadConversations() {
        try {
            // Load conversations based on matches
            const { data: matches, error } = await this.supabase
                .from('matches')
                .select(`
                    *,
                    trip:trips (
                        id,
                        from_city,
                        to_city,
                        trip_date,
                        user:users!trips_user_id_fkey (
                            id,
                            name,
                            phone,
                            email,
                            user_type
                        )
                    ),
                    shipment:shipments (
                        id,
                        from_city,
                        to_city,
                        needed_date,
                        weight,
                        user:users!shipments_user_id_fkey (
                            id,
                            name,
                            phone,
                            email,
                            user_type
                        )
                    )
                `)
                .or(`trip.user_id.eq.${this.currentUser.id},shipment.user_id.eq.${this.currentUser.id}`)
                .eq('status', 'accepted')
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error('Error loading conversations:', error);
                return;
            }
            
            // Process matches into conversations
            for (const match of matches || []) {
                const otherUser = this.getOtherUserFromMatch(match);
                if (otherUser) {
                    const conversation = {
                        id: match.id,
                        match_id: match.id,
                        other_user: otherUser,
                        trip: match.trip,
                        shipment: match.shipment,
                        created_at: match.created_at,
                        last_message: null,
                        unread_count: 0
                    };
                    
                    // Load last message and unread count
                    await this.loadConversationDetails(conversation);
                    
                    this.conversations.set(conversation.id, conversation);
                }
            }
            
            // Update UI
            this.displayConversations();
            
        } catch (error) {
            console.error('Error in loadConversations:', error);
        }
    }
    
    // Get other user from match
    getOtherUserFromMatch(match) {
        if (match.trip?.user?.id === this.currentUser.id) {
            return match.shipment?.user;
        } else if (match.shipment?.user?.id === this.currentUser.id) {
            return match.trip?.user;
        }
        return null;
    }
    
    // Load conversation details (last message, unread count)
    async loadConversationDetails(conversation) {
        try {
            // Get last message
            const { data: lastMessage } = await this.supabase
                .from('messages')
                .select('*')
                .eq('match_id', conversation.match_id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
            
            if (lastMessage) {
                conversation.last_message = lastMessage;
            }
            
            // Get unread count
            const { count } = await this.supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('match_id', conversation.match_id)
                .eq('receiver_id', this.currentUser.id)
                .eq('read', false);
            
            conversation.unread_count = count || 0;
            
        } catch (error) {
            console.error('Error loading conversation details:', error);
        }
    }
    
    // Display conversations in UI
    displayConversations() {
        const conversationsList = document.getElementById('conversationsList');
        if (!conversationsList) return;
        
        const sortedConversations = Array.from(this.conversations.values())
            .sort((a, b) => {
                // Sort by last message time
                const timeA = a.last_message?.created_at || a.created_at;
                const timeB = b.last_message?.created_at || b.created_at;
                return new Date(timeB) - new Date(timeA);
            });
        
        conversationsList.innerHTML = sortedConversations.map(conv => {
            const isActive = this.currentConversation?.id === conv.id;
            const hasUnread = conv.unread_count > 0;
            
            return `
                <div class="conversation-item ${isActive ? 'active' : ''} ${hasUnread ? 'unread' : ''}"
                     data-conversation-id="${conv.id}"
                     onclick="chatSystem.selectConversation('${conv.id}')">
                    
                    <div class="conversation-avatar">
                        <img src="/assets/images/user-avatar.jpg" alt="${conv.other_user.name}">
                        <span class="online-indicator ${this.isUserOnline(conv.other_user.id) ? 'online' : 'offline'}"></span>
                    </div>
                    
                    <div class="conversation-info">
                        <div class="conversation-header">
                            <h4 class="conversation-name">${conv.other_user.name}</h4>
                            <span class="conversation-time">${this.formatTime(conv.last_message?.created_at || conv.created_at)}</span>
                        </div>
                        
                        <div class="conversation-preview">
                            ${conv.last_message ? this.formatLastMessage(conv.last_message) : 'ابدأ المحادثة'}
                        </div>
                        
                        <div class="conversation-meta">
                            <span class="route-info">
                                <i class="fas fa-route"></i>
                                ${conv.trip?.from_city || conv.shipment?.from_city} → 
                                ${conv.trip?.to_city || conv.shipment?.to_city}
                            </span>
                            ${hasUnread ? `<span class="unread-badge">${conv.unread_count}</span>` : ''}
                        </div>
                    </div>
                    
                    ${this.typingStatus.get(conv.other_user.id) ? 
                        '<div class="typing-indicator">يكتب...</div>' : ''}
                </div>
            `;
        }).join('');
    }
    
    // Select and open a conversation
    async selectConversation(conversationId) {
        const conversation = this.conversations.get(conversationId);
        if (!conversation) return;
        
        this.currentConversation = conversation;
        
        // Mark conversation as active in UI
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-conversation-id="${conversationId}"]`)?.classList.add('active');
        
        // Load messages
        await this.loadMessages(conversation.match_id);
        
        // Mark messages as read
        await this.markMessagesAsRead(conversation.match_id);
        
        // Update conversation header
        this.updateConversationHeader(conversation);
        
        // Focus on message input
        document.getElementById('messageInput')?.focus();
    }
    
    // Load messages for a conversation
    async loadMessages(matchId) {
        try {
            const { data: messages, error } = await this.supabase
                .from('messages')
                .select('*')
                .eq('match_id', matchId)
                .order('created_at', { ascending: true });
            
            if (error) {
                console.error('Error loading messages:', error);
                return;
            }
            
            // Store messages
            this.messages.set(matchId, messages || []);
            
            // Display messages
            this.displayMessages(messages || []);
            
        } catch (error) {
            console.error('Error in loadMessages:', error);
        }
    }
    
    // Display messages in chat window
    displayMessages(messages) {
        const messagesContainer = document.getElementById('messagesContainer');
        if (!messagesContainer) return;
        
        const groupedMessages = this.groupMessagesByDate(messages);
        
        messagesContainer.innerHTML = groupedMessages.map(group => `
            <div class="message-date-separator">
                <span>${group.date}</span>
            </div>
            ${group.messages.map(message => this.renderMessage(message)).join('')}
        `).join('');
        
        // Scroll to bottom
        this.scrollToBottom();
    }
    
    // Render a single message
    renderMessage(message) {
        const isSent = message.sender_id === this.currentUser.id;
        const time = new Date(message.created_at).toLocaleTimeString('ar-SA', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        return `
            <div class="message ${isSent ? 'sent' : 'received'}" data-message-id="${message.id}">
                <div class="message-bubble">
                    ${message.message_type === 'text' ? 
                        `<p class="message-text">${this.escapeHtml(message.message)}</p>` :
                        this.renderMediaMessage(message)
                    }
                    
                    <div class="message-meta">
                        <span class="message-time">${time}</span>
                        ${isSent ? this.renderMessageStatus(message) : ''}
                    </div>
                </div>
                
                ${message.attachment ? this.renderAttachment(message.attachment) : ''}
            </div>
        `;
    }
    
    // Render message status (sent, delivered, read)
    renderMessageStatus(message) {
        if (message.read) {
            return '<i class="fas fa-check-double read"></i>';
        } else if (message.delivered) {
            return '<i class="fas fa-check-double"></i>';
        } else {
            return '<i class="fas fa-check"></i>';
        }
    }
    
    // Render media message (image, file, location)
    renderMediaMessage(message) {
        switch (message.message_type) {
            case 'image':
                return `<img src="${message.media_url}" alt="صورة" class="message-image" onclick="chatSystem.viewImage('${message.media_url}')">`;
            
            case 'file':
                return `
                    <div class="message-file" onclick="chatSystem.downloadFile('${message.media_url}', '${message.file_name}')">
                        <i class="fas fa-file"></i>
                        <span>${message.file_name}</span>
                        <span class="file-size">${this.formatFileSize(message.file_size)}</span>
                    </div>
                `;
            
            case 'location':
                const location = JSON.parse(message.message);
                return `
                    <div class="message-location" onclick="chatSystem.openMap(${location.lat}, ${location.lng})">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>موقع مشترك</span>
                        <img src="https://maps.googleapis.com/maps/api/staticmap?center=${location.lat},${location.lng}&zoom=15&size=200x150&markers=${location.lat},${location.lng}" alt="خريطة">
                    </div>
                `;
            
            default:
                return `<p class="message-text">${this.escapeHtml(message.message)}</p>`;
        }
    }
    
    // Send a message
    async sendMessage(text, type = 'text', attachments = null) {
        if (!this.currentConversation || (!text && !attachments)) return;
        
        const message = {
            match_id: this.currentConversation.match_id,
            sender_id: this.currentUser.id,
            receiver_id: this.currentConversation.other_user.id,
            message: text,
            message_type: type,
            delivered: false,
            read: false,
            created_at: new Date().toISOString()
        };
        
        // Handle attachments
        if (attachments) {
            const uploadedAttachments = await this.uploadAttachments(attachments);
            if (uploadedAttachments.length > 0) {
                message.attachment = uploadedAttachments[0];
                if (type === 'image') {
                    message.media_url = uploadedAttachments[0].url;
                }
            }
        }
        
        // Add to UI immediately (optimistic update)
        this.displayOptimisticMessage(message);
        
        try {
            // Send to database
            const { data, error } = await this.supabase
                .from('messages')
                .insert([message])
                .select()
                .single();
            
            if (error) {
                console.error('Error sending message:', error);
                this.handleMessageError(message);
                return;
            }
            
            // Update local message with server response
            this.updateLocalMessage(message, data);
            
            // Update last message in conversation
            this.currentConversation.last_message = data;
            this.displayConversations();
            
            // Send notification to receiver
            this.sendMessageNotification(data);
            
        } catch (error) {
            console.error('Error in sendMessage:', error);
            this.handleMessageError(message);
        }
    }
    
    // Display optimistic message
    displayOptimisticMessage(message) {
        const messagesContainer = document.getElementById('messagesContainer');
        if (!messagesContainer) return;
        
        const tempId = `temp_${Date.now()}`;
        message.id = tempId;
        message.optimistic = true;
        
        const messageHtml = this.renderMessage(message);
        messagesContainer.insertAdjacentHTML('beforeend', messageHtml);
        
        this.scrollToBottom();
    }
    
    // Update local message after server response
    updateLocalMessage(tempMessage, serverMessage) {
        const tempElement = document.querySelector(`[data-message-id="${tempMessage.id}"]`);
        if (tempElement) {
            tempElement.setAttribute('data-message-id', serverMessage.id);
            tempElement.classList.remove('optimistic');
        }
    }
    
    // Handle message sending error
    handleMessageError(message) {
        const messageElement = document.querySelector(`[data-message-id="${message.id}"]`);
        if (messageElement) {
            messageElement.classList.add('error');
            messageElement.insertAdjacentHTML('beforeend', `
                <div class="message-error">
                    <span>فشل الإرسال</span>
                    <button onclick="chatSystem.retryMessage('${message.id}')">
                        <i class="fas fa-redo"></i> إعادة المحاولة
                    </button>
                </div>
            `);
        }
        
        // Add to queue for retry
        this.messageQueue.push(message);
    }
    
    // Retry sending message
    async retryMessage(messageId) {
        const message = this.messageQueue.find(m => m.id === messageId);
        if (message) {
            this.messageQueue = this.messageQueue.filter(m => m.id !== messageId);
            await this.sendMessage(message.message, message.message_type, message.attachment);
        }
    }
    
    // Upload attachments
    async uploadAttachments(files) {
        const uploaded = [];
        
        for (const file of files) {
            try {
                const fileName = `${Date.now()}_${file.name}`;
                const filePath = `chat-attachments/${this.currentUser.id}/${fileName}`;
                
                const { data, error } = await this.supabase.storage
                    .from('attachments')
                    .upload(filePath, file);
                
                if (error) {
                    console.error('Error uploading file:', error);
                    continue;
                }
                
                // Get public URL
                const { data: { publicUrl } } = this.supabase.storage
                    .from('attachments')
                    .getPublicUrl(filePath);
                
                uploaded.push({
                    name: file.name,
                    url: publicUrl,
                    size: file.size,
                    type: file.type,
                    path: filePath
                });
                
            } catch (error) {
                console.error('Error in uploadAttachments:', error);
            }
        }
        
        return uploaded;
    }
    
    // Mark messages as read
    async markMessagesAsRead(matchId) {
        try {
            const { error } = await this.supabase
                .from('messages')
                .update({ read: true, read_at: new Date().toISOString() })
                .eq('match_id', matchId)
                .eq('receiver_id', this.currentUser.id)
                .eq('read', false);
            
            if (error) {
                console.error('Error marking messages as read:', error);
                return;
            }
            
            // Send read receipt
            this.sendReadReceipt(matchId);
            
            // Update conversation unread count
            if (this.currentConversation) {
                this.currentConversation.unread_count = 0;
                this.displayConversations();
            }
            
        } catch (error) {
            console.error('Error in markMessagesAsRead:', error);
        }
    }
    
    // Send read receipt via broadcast
    sendReadReceipt(matchId) {
        if (this.channel) {
            this.channel.send({
                type: 'broadcast',
                event: 'read_receipt',
                payload: {
                    match_id: matchId,
                    reader_id: this.currentUser.id,
                    read_at: new Date().toISOString()
                }
            });
        }
    }
    
    // Handle incoming message
    handleNewMessage(message) {
        // Check if message is for current conversation
        if (this.currentConversation?.match_id === message.match_id) {
            // Add to current messages
            const currentMessages = this.messages.get(message.match_id) || [];
            currentMessages.push(message);
            this.messages.set(message.match_id, currentMessages);
            
            // Display new message
            const messageHtml = this.renderMessage(message);
            const messagesContainer = document.getElementById('messagesContainer');
            if (messagesContainer) {
                messagesContainer.insertAdjacentHTML('beforeend', messageHtml);
                this.scrollToBottom();
            }
            
            // Mark as read if window is focused
            if (document.hasFocus()) {
                this.markMessagesAsRead(message.match_id);
            }
        } else {
            // Update conversation list
            this.loadConversationDetails(
                Array.from(this.conversations.values())
                    .find(c => c.match_id === message.match_id)
            ).then(() => {
                this.displayConversations();
            });
        }
        
        // Show notification
        this.showMessageNotification(message);
        
        // Play notification sound
        this.playNotificationSound();
    }
    
    // Handle message update (delivered, read status)
    handleMessageUpdate(message) {
        const messageElement = document.querySelector(`[data-message-id="${message.id}"]`);
        if (messageElement) {
            const statusIcon = messageElement.querySelector('.message-meta i');
            if (statusIcon) {
                statusIcon.className = message.read ? 
                    'fas fa-check-double read' : 
                    'fas fa-check-double';
            }
        }
    }
    
    // Handle typing status
    handleTypingStatus(payload) {
        const { user_id, match_id, is_typing } = payload;
        
        if (user_id === this.currentUser.id) return;
        
        if (is_typing) {
            this.typingStatus.set(user_id, true);
            
            // Clear typing after 3 seconds
            setTimeout(() => {
                this.typingStatus.delete(user_id);
                this.updateTypingIndicator(user_id, false);
            }, 3000);
        } else {
            this.typingStatus.delete(user_id);
        }
        
        this.updateTypingIndicator(user_id, is_typing);
    }
    
    // Update typing indicator in UI
    updateTypingIndicator(userId, isTyping) {
        // Update in conversation list
        const conversation = Array.from(this.conversations.values())
            .find(c => c.other_user.id === userId);
        
        if (conversation) {
            const convElement = document.querySelector(`[data-conversation-id="${conversation.id}"]`);
            if (convElement) {
                const typingIndicator = convElement.querySelector('.typing-indicator');
                if (isTyping && !typingIndicator) {
                    convElement.insertAdjacentHTML('beforeend', 
                        '<div class="typing-indicator">يكتب...</div>'
                    );
                } else if (!isTyping && typingIndicator) {
                    typingIndicator.remove();
                }
            }
        }
        
        // Update in chat window
        if (this.currentConversation?.other_user.id === userId) {
            const typingElement = document.getElementById('typingIndicator');
            if (typingElement) {
                typingElement.style.display = isTyping ? 'block' : 'none';
            }
        }
    }
    
    // Send typing status
    sendTypingStatus(isTyping) {
        if (this.channel && this.currentConversation) {
            this.channel.send({
                type: 'broadcast',
                event: 'typing',
                payload: {
                    user_id: this.currentUser.id,
                    match_id: this.currentConversation.match_id,
                    is_typing: isTyping
                }
            });
        }
    }
    
    // Handle user join (online)
    handleUserJoin(userId, presences) {
        this.updateUserOnlineStatus(userId, true);
    }
    
    // Handle user leave (offline)
    handleUserLeave(userId, presences) {
        this.updateUserOnlineStatus(userId, false);
    }
    
    // Update user online status in UI
    updateUserOnlineStatus(userId, isOnline) {
        // Update in conversation list
        const conversation = Array.from(this.conversations.values())
            .find(c => c.other_user.id === userId);
        
        if (conversation) {
            const convElement = document.querySelector(`[data-conversation-id="${conversation.id}"]`);
            if (convElement) {
                const indicator = convElement.querySelector('.online-indicator');
                if (indicator) {
                    indicator.classList.toggle('online', isOnline);
                    indicator.classList.toggle('offline', !isOnline);
                }
            }
        }
        
        // Update in chat header
        if (this.currentConversation?.other_user.id === userId) {
            const statusElement = document.getElementById('userOnlineStatus');
            if (statusElement) {
                statusElement.textContent = isOnline ? 'متصل' : 'غير متصل';
                statusElement.className = isOnline ? 'online' : 'offline';
            }
        }
    }
    
    // Check if user is online
    isUserOnline(userId) {
        const state = this.channel?.presenceState();
        return state && Object.keys(state).includes(userId);
    }
    
    // Update online users list
    updateOnlineUsers(state) {
        const onlineUserIds = Object.keys(state);
        
        // Update all conversations
        this.conversations.forEach(conversation => {
            const isOnline = onlineUserIds.includes(conversation.other_user.id);
            this.updateUserOnlineStatus(conversation.other_user.id, isOnline);
        });
    }
    
    // Setup event listeners
    setupEventListeners() {
        // Message input
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendMessageBtn');
        
        if (messageInput) {
            // Send on Enter
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendTextMessage();
                }
            });
            
            // Typing indicator
            let typingTimer;
            messageInput.addEventListener('input', () => {
                this.sendTypingStatus(true);
                
                clearTimeout(typingTimer);
                typingTimer = setTimeout(() => {
                    this.sendTypingStatus(false);
                }, 2000);
            });
        }
        
        if (sendButton) {
            sendButton.addEventListener('click', () => {
                this.sendTextMessage();
            });
        }
        
        // File attachment
        const attachButton = document.getElementById('attachFileBtn');
        const fileInput = document.getElementById('fileInput');
        
        if (attachButton && fileInput) {
            attachButton.addEventListener('click', () => {
                fileInput.click();
            });
            
            fileInput.addEventListener('change', async (e) => {
                const files = Array.from(e.target.files);
                if (files.length > 0) {
                    await this.sendFileMessage(files);
                }
                e.target.value = '';
            });
        }
        
        // Emoji picker
        const emojiButton = document.getElementById('emojiBtn');
        if (emojiButton) {
            emojiButton.addEventListener('click', () => {
                this.toggleEmojiPicker();
            });
        }
        
        // Voice message
        const voiceButton = document.getElementById('voiceBtn');
        if (voiceButton) {
            this.setupVoiceRecording(voiceButton);
        }
        
        // Search messages
        const searchInput = document.getElementById('searchMessages');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchMessages(e.target.value);
            });
        }
    }
    
    // Send text message from input
    sendTextMessage() {
        const messageInput = document.getElementById('messageInput');
        if (!messageInput) return;
        
        const text = messageInput.value.trim();
        if (text) {
            this.sendMessage(text);
            messageInput.value = '';
            this.sendTypingStatus(false);
        }
    }
    
    // Send file message
    async sendFileMessage(files) {
        for (const file of files) {
            const isImage = file.type.startsWith('image/');
            await this.sendMessage(
                file.name,
                isImage ? 'image' : 'file',
                [file]
            );
        }
    }
    
    // Setup voice recording
    setupVoiceRecording(button) {
        let mediaRecorder;
        let audioChunks = [];
        let isRecording = false;
        
        button.addEventListener('mousedown', async () => {
            if (!isRecording) {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    mediaRecorder = new MediaRecorder(stream);
                    
                    mediaRecorder.ondataavailable = (event) => {
                        audioChunks.push(event.data);
                    };
                    
                    mediaRecorder.onstop = async () => {
                        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                        const audioFile = new File([audioBlob], 'voice-message.wav', { type: 'audio/wav' });
                        
                        await this.sendMessage('🎤 رسالة صوتية', 'audio', [audioFile]);
                        
                        audioChunks = [];
                        stream.getTracks().forEach(track => track.stop());
                    };
                    
                    mediaRecorder.start();
                    isRecording = true;
                    button.classList.add('recording');
                    
                } catch (error) {
                    console.error('Error starting recording:', error);
                    alert('لا يمكن الوصول إلى الميكروفون');
                }
            }
        });
        
        button.addEventListener('mouseup', () => {
            if (isRecording && mediaRecorder) {
                mediaRecorder.stop();
                isRecording = false;
                button.classList.remove('recording');
            }
        });
    }
    
    // Search messages
    searchMessages(query) {
        if (!query) {
            this.displayMessages(
                this.messages.get(this.currentConversation?.match_id) || []
            );
            return;
        }
        
        const messages = this.messages.get(this.currentConversation?.match_id) || [];
        const filtered = messages.filter(m => 
            m.message.toLowerCase().includes(query.toLowerCase())
        );
        
        this.displayMessages(filtered);
    }
    
    // Group messages by date
    groupMessagesByDate(messages) {
        const groups = [];
        let currentDate = null;
        let currentGroup = null;
        
        messages.forEach(message => {
            const messageDate = new Date(message.created_at).toLocaleDateString('ar-SA');
            
            if (messageDate !== currentDate) {
                currentDate = messageDate;
                currentGroup = {
                    date: this.formatMessageDate(message.created_at),
                    messages: []
                };
                groups.push(currentGroup);
            }
            
            currentGroup.messages.push(message);
        });
        
        return groups;
    }
    
    // Format message date
    formatMessageDate(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (date.toDateString() === today.toDateString()) {
            return 'اليوم';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'أمس';
        } else {
            return date.toLocaleDateString('ar-SA', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    }
    
    // Format time
    formatTime(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) { // Less than 1 minute
            return 'الآن';
        } else if (diff < 3600000) { // Less than 1 hour
            const minutes = Math.floor(diff / 60000);
            return `منذ ${minutes} دقيقة`;
        } else if (diff < 86400000) { // Less than 1 day
            const hours = Math.floor(diff / 3600000);
            return `منذ ${hours} ساعة`;
        } else {
            return date.toLocaleDateString('ar-SA');
        }
    }
    
    // Format last message
    formatLastMessage(message) {
        if (!message) return '';
        
        const prefix = message.sender_id === this.currentUser.id ? 'أنت: ' : '';
        
        switch (message.message_type) {
            case 'image':
                return `${prefix}📷 صورة`;
            case 'file':
                return `${prefix}📎 ملف`;
            case 'audio':
                return `${prefix}🎤 رسالة صوتية`;
            case 'location':
                return `${prefix}📍 موقع`;
            default:
                return `${prefix}${message.message}`;
        }
    }
    
    // Format file size
    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    }
    
    // Update conversation header
    updateConversationHeader(conversation) {
        const header = document.getElementById('chatHeader');
        if (!header) return;
        
        header.innerHTML = `
            <div class="chat-header-info">
                <button class="back-btn" onclick="chatSystem.closeChat()">
                    <i class="fas fa-arrow-right"></i>
                </button>
                
                <div class="chat-user-avatar">
                    <img src="/assets/images/user-avatar.jpg" alt="${conversation.other_user.name}">
                </div>
                
                <div class="chat-user-info">
                    <h3>${conversation.other_user.name}</h3>
                    <span id="userOnlineStatus" class="${this.isUserOnline(conversation.other_user.id) ? 'online' : 'offline'}">
                        ${this.isUserOnline(conversation.other_user.id) ? 'متصل' : 'غير متصل'}
                    </span>
                </div>
            </div>
            
            <div class="chat-header-actions">
                <button class="icon-btn" onclick="chatSystem.startVideoCall()">
                    <i class="fas fa-video"></i>
                </button>
                <button class="icon-btn" onclick="chatSystem.startVoiceCall()">
                    <i class="fas fa-phone"></i>
                </button>
                <button class="icon-btn" onclick="chatSystem.showChatInfo()">
                    <i class="fas fa-info-circle"></i>
                </button>
            </div>
        `;
    }
    
    // Close chat
    closeChat() {
        this.currentConversation = null;
        document.getElementById('messagesContainer').innerHTML = '';
        document.getElementById('chatHeader').innerHTML = '';
    }
    
    // Scroll to bottom of messages
    scrollToBottom() {
        const container = document.getElementById('messagesContainer');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }
    
    // Play notification sound
    playNotificationSound() {
        const audio = new Audio('/assets/sounds/notification.mp3');
        audio.play().catch(e => console.log('Could not play notification sound'));
    }
    
    // Show message notification
    showMessageNotification(message) {
        if (!document.hasFocus() && 'Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification('رسالة جديدة', {
                body: message.message,
                icon: '/assets/images/logo.png',
                badge: '/assets/images/logo.png',
                tag: `message_${message.id}`
            });
            
            notification.onclick = () => {
                window.focus();
                this.selectConversation(message.match_id);
            };
        }
    }
    
    // Send message notification
    async sendMessageNotification(message) {
        try {
            await this.supabase
                .from('notifications')
                .insert({
                    user_id: message.receiver_id,
                    type: 'new_message',
                    title: 'رسالة جديدة',
                    message: `لديك رسالة جديدة من ${this.currentUser.name}`,
                    metadata: {
                        message_id: message.id,
                        match_id: message.match_id,
                        sender_id: message.sender_id
                    }
                });
        } catch (error) {
            console.error('Error sending notification:', error);
        }
    }
    
    // Setup online status monitoring
    setupOnlineStatusMonitoring() {
        // Monitor connection status
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.processMessageQueue();
            this.trackPresence();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
        
        // Monitor page visibility
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.currentConversation) {
                this.markMessagesAsRead(this.currentConversation.match_id);
            }
        });
    }
    
    // Process queued messages
    async processMessageQueue() {
        if (!this.isOnline || this.messageQueue.length === 0) return;
        
        const queue = [...this.messageQueue];
        this.messageQueue = [];
        
        for (const message of queue) {
            await this.sendMessage(message.message, message.message_type, message.attachment);
        }
    }
    
    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // View image in modal
    viewImage(imageUrl) {
        // Implementation for image viewer modal
        console.log('View image:', imageUrl);
    }
    
    // Download file
    downloadFile(fileUrl, fileName) {
        const a = document.createElement('a');
        a.href = fileUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
    
    // Open map
    openMap(lat, lng) {
        window.open(`https://maps.google.com/?q=${lat},${lng}`, '_blank');
    }
    
    // Start video call
    startVideoCall() {
        console.log('Starting video call...');
        // Implementation for video call
    }
    
    // Start voice call
    startVoiceCall() {
        console.log('Starting voice call...');
        // Implementation for voice call
    }
    
    // Show chat info
    showChatInfo() {
        console.log('Showing chat info...');
        // Implementation for chat info modal
    }
    
    // Toggle emoji picker
    toggleEmojiPicker() {
        console.log('Toggle emoji picker');
        // Implementation for emoji picker
    }
    
    // Request notification permission
    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }
}

// Initialize chat system
document.addEventListener('DOMContentLoaded', () => {
    window.chatSystem = new ChatSystem();
    window.chatSystem.requestNotificationPermission();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatSystem;
}
