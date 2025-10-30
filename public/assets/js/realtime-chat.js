// ========================================
// نظام الدردشة الفوري - Fast Ship SA
// Real-time Chat System with Supabase Realtime
// ========================================

class RealtimeChatSystem {
    constructor() {
        this.currentConversation = null;
        this.conversations = [];
        this.messages = [];
        this.currentUser = null;
        this.supabase = window.supabaseClient;
        this.realtimeChannel = null;
        this.typingTimeout = null;
        this.onlineUsers = new Set();
    }

    // تهيئة النظام
    async init() {
        try {
            // التحقق من تسجيل الدخول
            this.currentUser = JSON.parse(localStorage.getItem('fastship_user') || sessionStorage.getItem('fastship_user'));
            
            if (!this.currentUser) {
                window.location.href = '/pages/auth/login.html';
                return;
            }

            // تحميل المحادثات
            await this.loadConversations();
            
            // إعداد Realtime
            this.setupRealtimeSubscription();
            
            // إعداد مستمعي الأحداث
            this.setupEventListeners();
            
            // تحديث حالة المستخدم إلى متصل
            this.updateUserStatus('online');
            
            console.log('✅ نظام الدردشة جاهز');
        } catch (error) {
            console.error('خطأ في تهيئة نظام الدردشة:', error);
        }
    }

    // ========================================
    // إعداد Supabase Realtime
    // ========================================
    
    setupRealtimeSubscription() {
        if (!this.supabase) {
            console.error('❌ Supabase client غير متاح');
            return;
        }

        // إنشاء قناة للرسائل الجديدة
        this.realtimeChannel = this.supabase
            .channel('chat-room')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${this.currentUser.id}`
                },
                (payload) => {
                    console.log('📨 رسالة جديدة:', payload.new);
                    this.handleNewMessage(payload.new);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'messages',
                    filter: `sender_id=eq.${this.currentUser.id}`
                },
                (payload) => {
                    // تحديث حالة القراءة
                    this.handleMessageUpdate(payload.new);
                }
            )
            .on('presence', { event: 'sync' }, () => {
                const state = this.realtimeChannel.presenceState();
                this.updateOnlineUsers(state);
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('✅ متصل بـ Realtime');
                    // إرسال حالة الحضور
                    this.realtimeChannel.track({
                        user_id: this.currentUser.id,
                        online_at: new Date().toISOString()
                    });
                }
            });
    }

    // معالجة رسالة جديدة
    handleNewMessage(message) {
        // تشغيل صوت الإشعار
        this.playNotificationSound();
        
        // إذا كانت الرسالة من المحادثة الحالية
        if (this.currentConversation && message.match_id === this.currentConversation.id) {
            this.messages.push(message);
            this.appendMessage(message);
            this.scrollToBottom();
            
            // تحديث حالة القراءة تلقائياً
            this.markMessageAsRead(message.id);
        } else {
            // تحديث قائمة المحادثات
            this.updateConversationPreview(message);
            
            // إظهار إشعار
            this.showNotification(message);
        }
        
        // تحديث عدد الرسائل غير المقروءة
        this.updateUnreadCount();
    }

    // معالجة تحديث الرسالة
    handleMessageUpdate(message) {
        if (message.is_read) {
            const messageElement = document.querySelector(`[data-message-id="${message.id}"]`);
            if (messageElement) {
                messageElement.classList.add('read');
                const readIcon = messageElement.querySelector('.read-indicator');
                if (readIcon) {
                    readIcon.innerHTML = '<i class="fas fa-check-double"></i>';
                }
            }
        }
    }

    // تحديث المستخدمين المتصلين
    updateOnlineUsers(presenceState) {
        this.onlineUsers.clear();
        Object.keys(presenceState).forEach(key => {
            const presence = presenceState[key];
            if (presence && presence[0]) {
                this.onlineUsers.add(presence[0].user_id);
            }
        });
        
        // تحديث مؤشرات الاتصال في الواجهة
        this.updateOnlineIndicators();
    }

    // ========================================
    // تحميل المحادثات
    // ========================================
    
    async loadConversations() {
        try {
            const { data, error } = await this.supabase
                .from('matches')
                .select(`
                    id,
                    status,
                    created_at,
                    trip_id,
                    shipment_id,
                    trips!inner (
                        id,
                        from_city,
                        to_city,
                        travel_date,
                        user_id,
                        users!trips_user_id_fkey (
                            id,
                            name,
                            phone,
                            user_type
                        )
                    ),
                    shipments!inner (
                        id,
                        item_type,
                        item_description,
                        user_id,
                        users!shipments_user_id_fkey (
                            id,
                            name,
                            phone,
                            user_type
                        )
                    )
                `)
                .or(`trips.user_id.eq.${this.currentUser.id},shipments.user_id.eq.${this.currentUser.id}`)
                .eq('status', 'accepted')
                .order('created_at', { ascending: false });

            if (error) throw error;

            this.conversations = data || [];
            
            // جلب آخر رسالة لكل محادثة
            for (let conv of this.conversations) {
                const { data: lastMessage } = await this.supabase
                    .from('messages')
                    .select('*')
                    .eq('match_id', conv.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();
                
                conv.lastMessage = lastMessage;
                
                // حساب عدد الرسائل غير المقروءة
                const { count } = await this.supabase
                    .from('messages')
                    .select('*', { count: 'exact', head: true })
                    .eq('match_id', conv.id)
                    .eq('receiver_id', this.currentUser.id)
                    .eq('is_read', false);
                
                conv.unreadCount = count || 0;
            }

            this.displayConversations();
            
        } catch (error) {
            console.error('خطأ في تحميل المحادثات:', error);
        }
    }

    // عرض قائمة المحادثات
    displayConversations() {
        const conversationsList = document.getElementById('conversationsList');
        if (!conversationsList) return;

        const currentLang = document.documentElement.lang || 'ar';

        if (this.conversations.length === 0) {
            conversationsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-comments fa-3x"></i>
                    <p>${currentLang === 'ar' ? 'لا توجد محادثات بعد' : 'No conversations yet'}</p>
                    <p class="text-muted">${currentLang === 'ar' ? 'ابدأ بقبول مطابقة من لوحة التحكم' : 'Start by accepting a match from dashboard'}</p>
                </div>
            `;
            return;
        }

        conversationsList.innerHTML = this.conversations.map(conv => {
            const otherUser = this.getOtherUser(conv);
            const isOnline = this.onlineUsers.has(otherUser.id);
            const route = `${conv.trips.from_city} → ${conv.trips.to_city}`;
            
            return `
                <div class="conversation-item ${conv.id === this.currentConversation?.id ? 'active' : ''}" 
                     data-conversation-id="${conv.id}"
                     onclick="chatSystem.openConversation('${conv.id}')">
                    <div class="conversation-avatar">
                        <div class="avatar-wrapper">
                            <img src="${otherUser.avatar || '../../assets/images/default-avatar.png'}" 
                                 alt="${otherUser.name}">
                            <span class="online-indicator ${isOnline ? 'online' : 'offline'}"></span>
                        </div>
                    </div>
                    <div class="conversation-content">
                        <div class="conversation-header">
                            <h4 class="conversation-name">${otherUser.name}</h4>
                            <span class="conversation-time">
                                ${conv.lastMessage ? this.formatMessageTime(conv.lastMessage.created_at) : ''}
                            </span>
                        </div>
                        <p class="conversation-preview ${conv.unreadCount > 0 ? 'unread' : ''}">
                            ${conv.lastMessage ? this.truncateText(conv.lastMessage.content, 40) : 
                              (currentLang === 'ar' ? 'لا توجد رسائل' : 'No messages')}
                        </p>
                        <div class="conversation-meta">
                            <span class="route-badge">
                                <i class="fas fa-route"></i> ${route}
                            </span>
                            ${conv.unreadCount > 0 ? `<span class="unread-badge">${conv.unreadCount}</span>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // الحصول على المستخدم الآخر في المحادثة
    getOtherUser(conversation) {
        if (conversation.trips.user_id !== this.currentUser.id) {
            return conversation.trips.users;
        } else {
            return conversation.shipments.users;
        }
    }

    // ========================================
    // فتح محادثة
    // ========================================
    
    async openConversation(conversationId) {
        try {
            const conversation = this.conversations.find(c => c.id === conversationId);
            if (!conversation) return;

            this.currentConversation = conversation;
            
            // تحديث الواجهة
            document.querySelectorAll('.conversation-item').forEach(item => {
                item.classList.remove('active');
            });
            const selectedItem = document.querySelector(`[data-conversation-id="${conversationId}"]`);
            if (selectedItem) {
                selectedItem.classList.add('active');
            }

            // تحديث رأس المحادثة
            this.updateChatHeader(conversation);
            
            // تحميل الرسائل
            await this.loadMessages(conversationId);
            
            // إظهار منطقة الدردشة
            const chatWindow = document.getElementById('chatWindow');
            const emptyState = document.getElementById('emptyChatState');
            if (chatWindow) chatWindow.style.display = 'flex';
            if (emptyState) emptyState.style.display = 'none';
            
            // تحديد حقل الإدخال
            const messageInput = document.getElementById('messageInput');
            if (messageInput) messageInput.focus();
            
        } catch (error) {
            console.error('خطأ في فتح المحادثة:', error);
        }
    }

    // تحديث رأس المحادثة
    updateChatHeader(conversation) {
        const chatHeader = document.getElementById('chatHeader');
        if (!chatHeader) return;

        const otherUser = this.getOtherUser(conversation);
        const isOnline = this.onlineUsers.has(otherUser.id);
        const currentLang = document.documentElement.lang || 'ar';

        chatHeader.innerHTML = `
            <div class="chat-user-info">
                <div class="chat-avatar">
                    <img src="${otherUser.avatar || '../../assets/images/default-avatar.png'}" 
                         alt="${otherUser.name}">
                    <span class="online-dot ${isOnline ? 'online' : ''}"></span>
                </div>
                <div class="chat-user-details">
                    <h3>${otherUser.name}</h3>
                    <span class="user-status">
                        ${isOnline ? 
                            (currentLang === 'ar' ? 'متصل الآن' : 'Online now') : 
                            (currentLang === 'ar' ? 'غير متصل' : 'Offline')}
                    </span>
                </div>
            </div>
            <div class="chat-actions">
                <button class="btn-icon" onclick="chatSystem.callUser('${otherUser.phone}')" 
                        title="${currentLang === 'ar' ? 'اتصال هاتفي' : 'Phone call'}">
                    <i class="fas fa-phone"></i>
                </button>
                <button class="btn-icon" onclick="chatSystem.openWhatsApp('${otherUser.phone}')" 
                        title="WhatsApp">
                    <i class="fab fa-whatsapp"></i>
                </button>
                <button class="btn-icon" onclick="chatSystem.viewMatchDetails('${conversation.id}')" 
                        title="${currentLang === 'ar' ? 'تفاصيل المطابقة' : 'Match details'}">
                    <i class="fas fa-info-circle"></i>
                </button>
            </div>
        `;
    }

    // ========================================
    // تحميل وعرض الرسائل
    // ========================================
    
    async loadMessages(conversationId) {
        try {
            const { data, error } = await this.supabase
                .from('messages')
                .select(`
                    *,
                    sender:users!messages_sender_id_fkey(name, user_type),
                    receiver:users!messages_receiver_id_fkey(name)
                `)
                .eq('match_id', conversationId)
                .order('created_at', { ascending: true });

            if (error) throw error;

            this.messages = data || [];
            this.displayMessages();
            this.scrollToBottom();
            
            // تحديث حالة القراءة
            await this.markConversationAsRead(conversationId);
            
        } catch (error) {
            console.error('خطأ في تحميل الرسائل:', error);
        }
    }

    // عرض الرسائل
    displayMessages() {
        const messagesContainer = document.getElementById('messagesContainer');
        if (!messagesContainer) return;

        if (this.messages.length === 0) {
            messagesContainer.innerHTML = `
                <div class="empty-messages">
                    <i class="fas fa-comment-dots fa-3x"></i>
                    <p>${document.documentElement.lang === 'ar' ? 
                        'ابدأ المحادثة بإرسال رسالة' : 
                        'Start conversation by sending a message'}</p>
                </div>
            `;
            return;
        }

        messagesContainer.innerHTML = this.messages.map(message => {
            const isSent = message.sender_id === this.currentUser.id;
            const messageDate = new Date(message.created_at);
            
            return `
                <div class="message ${isSent ? 'message-sent' : 'message-received'} ${message.is_read ? 'read' : ''}"
                     data-message-id="${message.id}">
                    ${!isSent ? `
                        <div class="message-avatar">
                            <img src="../../assets/images/default-avatar.png" alt="${message.sender.name}">
                        </div>
                    ` : ''}
                    <div class="message-bubble">
                        <div class="message-content">
                            ${this.formatMessageContent(message.content)}
                        </div>
                        <div class="message-footer">
                            <span class="message-time">${this.formatMessageTime(message.created_at)}</span>
                            ${isSent ? `
                                <span class="read-indicator">
                                    <i class="fas ${message.is_read ? 'fa-check-double' : 'fa-check'}"></i>
                                </span>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // إضافة رسالة جديدة إلى النهاية
    appendMessage(message) {
        const messagesContainer = document.getElementById('messagesContainer');
        if (!messagesContainer) return;

        // حذف حالة الفراغ إذا كانت موجودة
        const emptyState = messagesContainer.querySelector('.empty-messages');
        if (emptyState) emptyState.remove();

        const isSent = message.sender_id === this.currentUser.id;
        
        const messageHTML = `
            <div class="message ${isSent ? 'message-sent' : 'message-received'} message-new"
                 data-message-id="${message.id}">
                ${!isSent ? `
                    <div class="message-avatar">
                        <img src="../../assets/images/default-avatar.png" alt="User">
                    </div>
                ` : ''}
                <div class="message-bubble">
                    <div class="message-content">
                        ${this.formatMessageContent(message.content)}
                    </div>
                    <div class="message-footer">
                        <span class="message-time">${this.formatMessageTime(message.created_at)}</span>
                        ${isSent ? `
                            <span class="read-indicator">
                                <i class="fas fa-check"></i>
                            </span>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
        
        messagesContainer.insertAdjacentHTML('beforeend', messageHTML);
        
        // إضافة تأثير الظهور
        setTimeout(() => {
            const newMessage = messagesContainer.querySelector('.message-new');
            if (newMessage) {
                newMessage.classList.remove('message-new');
                newMessage.classList.add('message-appear');
            }
        }, 50);
    }

    // ========================================
    // إرسال رسالة
    // ========================================
    
    async sendMessage(content) {
        if (!content || !content.trim() || !this.currentConversation) {
            return;
        }

        try {
            const otherUser = this.getOtherUser(this.currentConversation);
            
            const messageData = {
                sender_id: this.currentUser.id,
                receiver_id: otherUser.id,
                match_id: this.currentConversation.id,
                content: content.trim(),
                is_read: false,
                created_at: new Date().toISOString()
            };

            const { data, error } = await this.supabase
                .from('messages')
                .insert([messageData])
                .select()
                .single();

            if (error) throw error;

            // إضافة الرسالة إلى القائمة
            this.messages.push(data);
            this.appendMessage(data);
            this.scrollToBottom();
            
            // مسح حقل الإدخال
            const messageInput = document.getElementById('messageInput');
            if (messageInput) {
                messageInput.value = '';
                messageInput.style.height = 'auto';
            }
            
            // تحديث معاينة المحادثة
            this.updateConversationPreview(data);
            
            console.log('✅ تم إرسال الرسالة');
            
        } catch (error) {
            console.error('خطأ في إرسال الرسالة:', error);
            this.showAlert('خطأ في إرسال الرسالة', 'error');
        }
    }

    // ========================================
    // وظائف مساعدة
    // ========================================
    
    // تحديد الرسائل كمقروءة
    async markConversationAsRead(conversationId) {
        try {
            const { error } = await this.supabase
                .from('messages')
                .update({ is_read: true })
                .eq('match_id', conversationId)
                .eq('receiver_id', this.currentUser.id)
                .eq('is_read', false);

            if (error) throw error;

            // تحديث العداد
            this.updateUnreadCount();
            
        } catch (error) {
            console.error('خطأ في تحديث حالة القراءة:', error);
        }
    }

    // تحديد رسالة واحدة كمقروءة
    async markMessageAsRead(messageId) {
        try {
            const { error } = await this.supabase
                .from('messages')
                .update({ is_read: true })
                .eq('id', messageId);

            if (error) throw error;
        } catch (error) {
            console.error('خطأ في تحديث حالة القراءة:', error);
        }
    }

    // تحديث معاينة المحادثة
    updateConversationPreview(message) {
        const conv = this.conversations.find(c => c.id === message.match_id);
        if (conv) {
            conv.lastMessage = message;
            
            // إعادة ترتيب المحادثات
            this.conversations = this.conversations.sort((a, b) => {
                const aTime = a.lastMessage ? new Date(a.lastMessage.created_at) : new Date(a.created_at);
                const bTime = b.lastMessage ? new Date(b.lastMessage.created_at) : new Date(b.created_at);
                return bTime - aTime;
            });
            
            this.displayConversations();
        }
    }

    // تحديث عدد الرسائل غير المقروءة
    async updateUnreadCount() {
        try {
            const { count } = await this.supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('receiver_id', this.currentUser.id)
                .eq('is_read', false);

            const badge = document.getElementById('unreadBadge');
            if (badge) {
                if (count > 0) {
                    badge.textContent = count;
                    badge.style.display = 'inline-block';
                } else {
                    badge.style.display = 'none';
                }
            }
            
        } catch (error) {
            console.error('خطأ في تحديث العداد:', error);
        }
    }

    // تحديث مؤشرات الاتصال
    updateOnlineIndicators() {
        document.querySelectorAll('.online-indicator, .online-dot').forEach(indicator => {
            const userId = indicator.closest('[data-user-id]')?.dataset.userId;
            if (userId && this.onlineUsers.has(userId)) {
                indicator.classList.add('online');
                indicator.classList.remove('offline');
            } else {
                indicator.classList.remove('online');
                indicator.classList.add('offline');
            }
        });
    }

    // تنسيق محتوى الرسالة
    formatMessageContent(content) {
        // تحويل الروابط إلى عناصر قابلة للنقر
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        content = content.replace(urlRegex, '<a href="$1" target="_blank">$1</a>');
        
        // تحويل أسطر جديدة
        content = content.replace(/\n/g, '<br>');
        
        return content;
    }

    // تنسيق وقت الرسالة
    formatMessageTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (minutes < 1) return 'الآن';
        if (minutes < 60) return `قبل ${minutes} د`;
        if (hours < 24) return `قبل ${hours} س`;
        if (days < 7) return `قبل ${days} يوم`;
        
        return date.toLocaleDateString('ar-SA', { 
            month: 'short', 
            day: 'numeric' 
        });
    }

    // اختصار النص
    truncateText(text, maxLength) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    // التمرير إلى الأسفل
    scrollToBottom(smooth = true) {
        const container = document.getElementById('messagesContainer');
        if (container) {
            container.scrollTo({
                top: container.scrollHeight,
                behavior: smooth ? 'smooth' : 'auto'
            });
        }
    }

    // تشغيل صوت الإشعار
    playNotificationSound() {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBzSJ0fPTgjMGHm7A7+OZURE=');
        audio.volume = 0.3;
        audio.play().catch(() => {}); // تجاهل الأخطاء
    }

    // إظهار إشعار
    showNotification(message) {
        if (!('Notification' in window)) return;

        if (Notification.permission === 'granted') {
            new Notification('رسالة جديدة', {
                body: this.truncateText(message.content, 50),
                icon: '../../assets/images/logo.png',
                tag: 'chat-notification'
            });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission();
        }
    }

    // ========================================
    // إعداد مستمعي الأحداث
    // ========================================
    
    setupEventListeners() {
        // زر الإرسال
        const sendBtn = document.getElementById('sendMessageBtn');
        if (sendBtn) {
            sendBtn.addEventListener('click', () => {
                const input = document.getElementById('messageInput');
                if (input && input.value.trim()) {
                    this.sendMessage(input.value);
                }
            });
        }

        // Enter للإرسال
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (messageInput.value.trim()) {
                        this.sendMessage(messageInput.value);
                    }
                }
            });

            // تحجيم تلقائي لحقل الإدخال
            messageInput.addEventListener('input', () => {
                messageInput.style.height = 'auto';
                messageInput.style.height = messageInput.scrollHeight + 'px';
            });
        }

        // عند مغادرة الصفحة
        window.addEventListener('beforeunload', () => {
            this.updateUserStatus('offline');
            if (this.realtimeChannel) {
                this.realtimeChannel.unsubscribe();
            }
        });
    }

    // ========================================
    // وظائف إضافية
    // ========================================
    
    // اتصال هاتفي
    callUser(phone) {
        if (phone) {
            window.location.href = `tel:${phone}`;
        }
    }

    // فتح واتساب
    openWhatsApp(phone) {
        if (phone) {
            const cleanPhone = phone.replace(/\D/g, '');
            window.open(`https://wa.me/${cleanPhone}`, '_blank');
        }
    }

    // عرض تفاصيل المطابقة
    viewMatchDetails(matchId) {
        // الانتقال إلى صفحة التفاصيل
        window.location.href = `../carrier/matches.html?match=${matchId}`;
    }

    // تحديث حالة المستخدم
    async updateUserStatus(status) {
        try {
            const { error } = await this.supabase
                .from('users')
                .update({ 
                    last_seen: new Date().toISOString(),
                    is_online: status === 'online'
                })
                .eq('id', this.currentUser.id);

            if (error) throw error;
        } catch (error) {
            console.error('خطأ في تحديث الحالة:', error);
        }
    }

    // إظهار تنبيه
    showAlert(message, type = 'info') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        alertDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            background: ${type === 'error' ? '#f44336' : '#4CAF50'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
            alertDiv.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => alertDiv.remove(), 300);
        }, 3000);
    }

    // تنظيف الموارد
    destroy() {
        if (this.realtimeChannel) {
            this.realtimeChannel.unsubscribe();
        }
        this.updateUserStatus('offline');
    }
}

// ========================================
// تهيئة النظام عند تحميل الصفحة
// ========================================

let chatSystem;

document.addEventListener('DOMContentLoaded', () => {
    chatSystem = new RealtimeChatSystem();
    chatSystem.init();
});

// تصدير للاستخدام العام
window.chatSystem = chatSystem;
