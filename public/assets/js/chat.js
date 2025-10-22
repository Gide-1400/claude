// Chat System for Fast Shipment Platform

class ChatSystem {
    constructor() {
        this.currentConversation = null;
        this.conversations = [];
        this.messages = [];
        this.supabase = window.supabase;
        this.setupRealtimeSubscription();
    }

    // Initialize chat system
    async init() {
        await this.loadConversations();
        this.setupEventListeners();
    }

    // Setup realtime subscription for new messages
    setupRealtimeSubscription() {
        if (!this.supabase) return;

        this.supabase
            .channel('messages')
            .on('postgres_changes', 
                { event: 'INSERT', schema: 'public', table: 'messages' },
                (payload) => {
                    this.handleNewMessage(payload.new);
                }
            )
            .subscribe();
    }

    // Handle new incoming message
    handleNewMessage(message) {
        // Check if message belongs to current conversation
        if (this.currentConversation && 
            (message.match_id === this.currentConversation.match_id)) {
            this.messages.push(message);
            this.displayMessage(message);
            this.scrollToBottom();
            this.playNotificationSound();
        }
        
        // Update conversations list
        this.updateConversationsList();
    }

    // Load user conversations
    async loadConversations() {
        try {
            const user = JSON.parse(localStorage.getItem('userSession'));
            if (!user) return;

            const { data, error } = await this.supabase
                .from('matches')
                .select(`
                    *,
                    trips (
                        from_city,
                        to_city,
                        users!trips_user_id_fkey (name, phone, avatar)
                    ),
                    shipments (
                        item_description,
                        users!shipments_user_id_fkey (name, phone, avatar)
                    ),
                    messages (
                        message,
                        created_at,
                        read
                    )
                `)
                .or(`trips.user_id.eq.${user.id},shipments.user_id.eq.${user.id}`)
                .order('created_at', { ascending: false });

            if (error) throw error;

            this.conversations = data || [];
            this.displayConversations();
        } catch (error) {
            console.error('Error loading conversations:', error);
        }
    }

    // Display conversations list
    displayConversations() {
        const conversationsList = document.getElementById('conversationsList');
        if (!conversationsList) return;

        const currentLang = document.documentElement.lang || 'ar';

        conversationsList.innerHTML = this.conversations.map(conversation => {
            const otherUser = this.getOtherUser(conversation);
            const lastMessage = conversation.messages && conversation.messages.length > 0 
                ? conversation.messages[0] 
                : null;
            
            const unreadCount = conversation.messages ? 
                conversation.messages.filter(msg => !msg.read).length : 0;

            return `
                <div class="conversation-item ${conversation.id === this.currentConversation?.id ? 'active' : ''}" 
                     data-conversation-id="${conversation.id}">
                    <div class="conversation-avatar">
                        <img src="${otherUser.avatar || '../../assets/images/user-avatar.jpg'}" alt="${otherUser.name}">
                        ${unreadCount > 0 ? `<span class="unread-badge">${unreadCount}</span>` : ''}
                    </div>
                    <div class="conversation-info">
                        <div class="conversation-header">
                            <h4>${otherUser.name}</h4>
                            <span class="conversation-time">
                                ${lastMessage ? this.formatTime(lastMessage.created_at) : ''}
                            </span>
                        </div>
                        <p class="conversation-preview">
                            ${lastMessage ? this.truncateText(lastMessage.message, 50) : 
                              (currentLang === 'ar' ? 'لا توجد رسائل بعد' : 'No messages yet')}
                        </p>
                        <div class="conversation-meta">
                            <span class="route">
                                ${conversation.trips?.from_city || ''} → 
                                ${conversation.trips?.to_city || ''}
                            </span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Add click event listeners
        this.setupConversationClickHandlers();
    }

    // Get other user in conversation
    getOtherUser(conversation) {
        const currentUser = JSON.parse(localStorage.getItem('userSession'));
        
        if (conversation.trips?.users && conversation.trips.users.id !== currentUser.id) {
            return conversation.trips.users;
        } else if (conversation.shipments?.users && conversation.shipments.users.id !== currentUser.id) {
            return conversation.shipments.users;
        }
        
        return { name: 'Unknown User', phone: '', avatar: '' };
    }

    // Setup conversation click handlers
    setupConversationClickHandlers() {
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.addEventListener('click', () => {
                const conversationId = item.getAttribute('data-conversation-id');
                this.openConversation(conversationId);
            });
        });
    }

    // Open conversation
    async openConversation(conversationId) {
        const conversation = this.conversations.find(c => c.id === conversationId);
        if (!conversation) return;

        this.currentConversation = conversation;
        
        // Update UI
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-conversation-id="${conversationId}"]`).classList.add('active');

        // Load messages
        await this.loadMessages(conversationId);
        
        // Update conversation header
        this.updateConversationHeader(conversation);
        
        // Mark messages as read
        this.markMessagesAsRead(conversationId);
    }

    // Load messages for conversation
    async loadMessages(conversationId) {
        try {
            const { data, error } = await this.supabase
                .from('messages')
                .select('*')
                .eq('match_id', conversationId)
                .order('created_at', { ascending: true });

            if (error) throw error;

            this.messages = data || [];
            this.displayMessages();
            this.scrollToBottom();
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    }

    // Display messages
    displayMessages() {
        const messagesContainer = document.getElementById('messagesContainer');
        if (!messagesContainer) return;

        const currentUser = JSON.parse(localStorage.getItem('userSession'));

        messagesContainer.innerHTML = this.messages.map(message => {
            const isCurrentUser = message.sender_id === currentUser.id;
            const messageTime = this.formatTime(message.created_at);

            return `
                <div class="message ${isCurrentUser ? 'message-sent' : 'message-received'}">
                    <div class="message-content">
                        <p>${message.message}</p>
                        <span class="message-time">${messageTime}</span>
                    </div>
                    ${!isCurrentUser && !message.read ? '<span class="read-status"></span>' : ''}
                </div>
            `;
        }).join('');
    }

    // Update conversation header
    updateConversationHeader(conversation) {
        const otherUser = this.getOtherUser(conversation);
        const headerElement = document.getElementById('conversationHeader');
        
        if (headerElement) {
            headerElement.innerHTML = `
                <div class="conversation-partner">
                    <img src="${otherUser.avatar || '../../assets/images/user-avatar.jpg'}" alt="${otherUser.name}">
                    <div class="partner-info">
                        <h4>${otherUser.name}</h4>
                        <span class="partner-status">${document.documentElement.lang === 'ar' ? 'متصل' : 'Online'}</span>
                    </div>
                </div>
                <div class="conversation-actions">
                    <button class="btn btn-icon" id="voiceCallBtn" title="${document.documentElement.lang === 'ar' ? 'مكالمة صوتية' : 'Voice Call'}">
                        <i class="fas fa-phone"></i>
                    </button>
                    <button class="btn btn-icon" id="videoCallBtn" title="${document.documentElement.lang === 'ar' ? 'مكالمة فيديو' : 'Video Call'}">
                        <i class="fas fa-video"></i>
                    </button>
                    <button class="btn btn-icon" id="whatsappBtn" title="WhatsApp">
                        <i class="fab fa-whatsapp"></i>
                    </button>
                </div>
            `;

            this.setupHeaderActionHandlers(conversation, otherUser);
        }
    }

    // Setup header action handlers
    setupHeaderActionHandlers(conversation, otherUser) {
        // WhatsApp button
        const whatsappBtn = document.getElementById('whatsappBtn');
        if (whatsappBtn && otherUser.phone) {
            whatsappBtn.addEventListener('click', () => {
                const whatsappUrl = `https://wa.me/${otherUser.phone.replace(/\D/g, '')}`;
                window.open(whatsappUrl, '_blank');
            });
        }

        // Voice call button
        const voiceCallBtn = document.getElementById('voiceCallBtn');
        if (voiceCallBtn && otherUser.phone) {
            voiceCallBtn.addEventListener('click', () => {
                window.open(`tel:${otherUser.phone}`);
            });
        }
    }

    // Send message
    async sendMessage(messageText) {
        if (!messageText.trim() || !this.currentConversation) return;

        try {
            const currentUser = JSON.parse(localStorage.getItem('userSession'));
            const otherUser = this.getOtherUser(this.currentConversation);

            const messageData = {
                sender_id: currentUser.id,
                receiver_id: otherUser.id,
                match_id: this.currentConversation.id,
                message: messageText.trim(),
                read: false
            };

            const { data, error } = await this.supabase
                .from('messages')
                .insert([messageData])
                .select();

            if (error) throw error;

            // Clear input
            const messageInput = document.getElementById('messageInput');
            if (messageInput) messageInput.value = '';

        } catch (error) {
            console.error('Error sending message:', error);
            alert(document.documentElement.lang === 'ar' ? 
                'خطأ في إرسال الرسالة' : 'Error sending message');
        }
    }

    // Mark messages as read
    async markMessagesAsRead(conversationId) {
        try {
            const currentUser = JSON.parse(localStorage.getItem('userSession'));

            const { error } = await this.supabase
                .from('messages')
                .update({ read: true })
                .eq('match_id', conversationId)
                .eq('receiver_id', currentUser.id)
                .eq('read', false);

            if (error) throw error;

            // Update UI
            this.updateUnreadCounts();
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    }

    // Update unread counts
    updateUnreadCounts() {
        document.querySelectorAll('.conversation-item').forEach(item => {
            const badge = item.querySelector('.unread-badge');
            if (badge) badge.remove();
        });
    }

    // Setup event listeners
    setupEventListeners() {
        // Send message on button click
        const sendBtn = document.getElementById('sendMessageBtn');
        if (sendBtn) {
            sendBtn.addEventListener('click', () => {
                const messageInput = document.getElementById('messageInput');
                if (messageInput) {
                    this.sendMessage(messageInput.value);
                }
            });
        }

        // Send message on Enter key
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage(messageInput.value);
                }
            });
        }

        // File attachment
        const attachBtn = document.getElementById('attachFileBtn');
        if (attachBtn) {
            attachBtn.addEventListener('click', () => {
                this.attachFile();
            });
        }
    }

    // Attach file
    attachFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,application/pdf,.doc,.docx';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.uploadFile(file);
            }
        };
        
        input.click();
    }

    // Upload file
    async uploadFile(file) {
        try {
            // Validate file
            if (file.size > 5 * 1024 * 1024) {
                alert(document.documentElement.lang === 'ar' ? 
                    'الملف كبير جداً (الحد الأقصى 5MB)' : 'File too large (max 5MB)');
                return;
            }

            // Upload to Supabase Storage
            const fileName = `${Date.now()}-${file.name}`;
            const { data, error } = await this.supabase.storage
                .from('chat-attachments')
                .upload(fileName, file);

            if (error) throw error;

            // Get public URL
            const { data: { publicUrl } } = this.supabase.storage
                .from('chat-attachments')
                .getPublicUrl(fileName);

            // Send message with file
            const fileMessage = `[ملف مرفق] ${publicUrl}`;
            this.sendMessage(fileMessage);

        } catch (error) {
            console.error('Error uploading file:', error);
            alert(document.documentElement.lang === 'ar' ? 
                'خطأ في رفع الملف' : 'Error uploading file');
        }
    }

    // Format time
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

        if (diffMins < 1) return 'الآن';
        if (diffMins < 60) return `قبل ${diffMins} دقيقة`;
        if (diffHours < 24) return `قبل ${diffHours} ساعة`;
        
        return date.toLocaleTimeString('ar-SA', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
    }

    // Truncate text
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength) + '...';
    }

    // Scroll to bottom
    scrollToBottom() {
        const messagesContainer = document.getElementById('messagesContainer');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    // Play notification sound
    playNotificationSound() {
        // Simple notification sound
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvm0cB