// Real-time Chat System for Fast Shipment Platform
// Handles messaging between carriers and shippers with WhatsApp integration

class ChatSystem {
    constructor() {
        this.supabase = window.supabaseClient;
        this.currentUser = null;
        this.activeChat = null;
        this.messageSubscription = null;
    }

    /**
     * Initialize chat system
     */
    async init(userId) {
        try {
            this.currentUser = userId;
            await this.loadContacts();
            this.setupRealtimeSubscription();
        } catch (error) {
            console.error('Error initializing chat system:', error);
        }
    }

    /**
     * Load user's contacts from matches
     */
    async loadContacts() {
        try {
            const userProfile = window.authManager?.getUserProfile();
            if (!userProfile) return [];

            const userType = userProfile.user_type;

            // Get matches where user is involved
            let query = this.supabase
                .from('matches')
                .select(`
                    *,
                    trips!inner(*, users!inner(id, name, phone, email, carrier_type)),
                    shipments!inner(*, users!inner(id, name, phone, email, shipper_type))
                `)
                .in('status', ['accepted', 'in_progress', 'completed']);

            if (userType === 'carrier') {
                query = query.eq('trips.user_id', userProfile.id);
            } else {
                query = query.eq('shipments.user_id', userProfile.id);
            }

            const { data: matches, error } = await query;

            if (error) throw error;

            // Extract unique contacts
            const contacts = [];
            const seenUsers = new Set();

            for (const match of matches || []) {
                let contactUser;
                
                if (userType === 'carrier') {
                    // For carrier, show shipper's info
                    contactUser = match.shipments?.users;
                    if (contactUser && !seenUsers.has(contactUser.id)) {
                        contacts.push({
                            userId: contactUser.id,
                            name: contactUser.name,
                            phone: contactUser.phone,
                            email: contactUser.email,
                            userType: 'shipper',
                            matchId: match.id,
                            lastMessage: null,
                            unreadCount: 0
                        });
                        seenUsers.add(contactUser.id);
                    }
                } else {
                    // For shipper, show carrier's info
                    contactUser = match.trips?.users;
                    if (contactUser && !seenUsers.has(contactUser.id)) {
                        contacts.push({
                            userId: contactUser.id,
                            name: contactUser.name,
                            phone: contactUser.phone,
                            email: contactUser.email,
                            userType: 'carrier',
                            carrierType: contactUser.carrier_type,
                            matchId: match.id,
                            lastMessage: null,
                            unreadCount: 0
                        });
                        seenUsers.add(contactUser.id);
                    }
                }
            }

            // Load last messages for each contact
            for (const contact of contacts) {
                const lastMessage = await this.getLastMessage(contact.userId);
                if (lastMessage) {
                    contact.lastMessage = lastMessage;
                }
                contact.unreadCount = await this.getUnreadCount(contact.userId);
            }

            return contacts.sort((a, b) => {
                const dateA = a.lastMessage?.created_at || '';
                const dateB = b.lastMessage?.created_at || '';
                return dateB.localeCompare(dateA);
            });

        } catch (error) {
            console.error('Error loading contacts:', error);
            return [];
        }
    }

    /**
     * Get last message with a specific user
     */
    async getLastMessage(userId) {
        try {
            const userProfile = window.authManager?.getUserProfile();
            if (!userProfile) return null;

            const { data, error } = await this.supabase
                .from('messages')
                .select('*')
                .or(`and(sender_id.eq.${userProfile.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${userProfile.id})`)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            return data;

        } catch (error) {
            console.error('Error getting last message:', error);
            return null;
        }
    }

    /**
     * Get unread message count
     */
    async getUnreadCount(userId) {
        try {
            const userProfile = window.authManager?.getUserProfile();
            if (!userProfile) return 0;

            const { count, error } = await this.supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('sender_id', userId)
                .eq('receiver_id', userProfile.id)
                .eq('is_read', false);

            if (error) throw error;

            return count || 0;

        } catch (error) {
            console.error('Error getting unread count:', error);
            return 0;
        }
    }

    /**
     * Load conversation with a specific user
     */
    async loadConversation(userId, matchId = null) {
        try {
            const userProfile = window.authManager?.getUserProfile();
            if (!userProfile) return [];

            this.activeChat = userId;

            const { data: messages, error } = await this.supabase
                .from('messages')
                .select('*')
                .or(`and(sender_id.eq.${userProfile.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${userProfile.id})`)
                .order('created_at', { ascending: true });

            if (error) throw error;

            // Mark messages as read
            await this.markAsRead(userId);

            return messages || [];

        } catch (error) {
            console.error('Error loading conversation:', error);
            return [];
        }
    }

    /**
     * Send a message
     */
    async sendMessage(receiverId, message, matchId = null) {
        try {
            const userProfile = window.authManager?.getUserProfile();
            if (!userProfile) {
                throw new Error('User not authenticated');
            }

            const messageData = {
                sender_id: userProfile.id,
                receiver_id: receiverId,
                message: message.trim(),
                match_id: matchId,
                is_read: false
            };

            const { data, error } = await this.supabase
                .from('messages')
                .insert([messageData])
                .select()
                .single();

            if (error) throw error;

            return data;

        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    }

    /**
     * Mark messages as read
     */
    async markAsRead(senderId) {
        try {
            const userProfile = window.authManager?.getUserProfile();
            if (!userProfile) return;

            const { error } = await this.supabase
                .from('messages')
                .update({ is_read: true })
                .eq('sender_id', senderId)
                .eq('receiver_id', userProfile.id)
                .eq('is_read', false);

            if (error) throw error;

        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    }

    /**
     * Setup realtime subscription for new messages
     */
    setupRealtimeSubscription() {
        try {
            const userProfile = window.authManager?.getUserProfile();
            if (!userProfile) return;

            // Clean up existing subscription
            if (this.messageSubscription) {
                this.messageSubscription.unsubscribe();
            }

            // Subscribe to new messages
            this.messageSubscription = this.supabase
                .channel('messages-changes')
                .on('postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'messages',
                        filter: `receiver_id=eq.${userProfile.id}`
                    },
                    (payload) => {
                        this.handleNewMessage(payload.new);
                    }
                )
                .subscribe();

        } catch (error) {
            console.error('Error setting up realtime subscription:', error);
        }
    }

    /**
     * Handle new incoming message
     */
    handleNewMessage(message) {
        // Trigger custom event for UI to handle
        const event = new CustomEvent('newMessage', { detail: message });
        window.dispatchEvent(event);

        // Show notification if not in active chat
        if (this.activeChat !== message.sender_id) {
            this.showMessageNotification(message);
        }

        // Play notification sound
        this.playNotificationSound();
    }

    /**
     * Show message notification
     */
    showMessageNotification(message) {
        // Check if browser supports notifications
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('رسالة جديدة', {
                body: message.message,
                icon: '/assets/images/logo.png'
            });
        }
    }

    /**
     * Play notification sound
     */
    playNotificationSound() {
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBD2W1vHSeS0GLIzS8tmQQAoRW7Tr6qNTEgpDnuHyvmwhBD+Y2/HReS0GLY/T9duSOwoSXrDq66hXEwpFn+LyvmwgBD+Z3PLSeisFLY7S9duSOwoSXLTr66hYFApGn+LyvmwhBD+Z3PLSeiwGLY/T9duSOwoSW7Tr6qdWEwpHoOHyvmwhBD+Z3PLSeisFLY7S9duSOwoRW7Tr66hXEwpHoOLyvmwhBD+Z3PLSeiwGLY/T9duSOwoRW7Tr66hXEwpHoOLyvmwhBD+Z3PLSeiwGLY/T9duSPAoRW7Tr66hYEwpGn+Lyvmw');
            audio.volume = 0.3;
            audio.play().catch(e => console.log('Could not play sound'));
        } catch (error) {
            console.log('Notification sound error:', error);
        }
    }

    /**
     * Get WhatsApp chat link
     */
    getWhatsAppLink(phoneNumber, message = '') {
        // Remove any non-numeric characters
        const cleanPhone = phoneNumber.replace(/\D/g, '');
        
        // Add country code if not present (assuming Saudi Arabia +966)
        let formattedPhone = cleanPhone;
        if (!formattedPhone.startsWith('966')) {
            if (formattedPhone.startsWith('0')) {
                formattedPhone = '966' + formattedPhone.substring(1);
            } else {
                formattedPhone = '966' + formattedPhone;
            }
        }

        const encodedMessage = encodeURIComponent(message);
        return `https://wa.me/${formattedPhone}${message ? '?text=' + encodedMessage : ''}`;
    }

    /**
     * Get total unread messages count
     */
    async getTotalUnreadCount() {
        try {
            const userProfile = window.authManager?.getUserProfile();
            if (!userProfile) return 0;

            const { count, error } = await this.supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('receiver_id', userProfile.id)
                .eq('is_read', false);

            if (error) throw error;

            return count || 0;

        } catch (error) {
            console.error('Error getting total unread count:', error);
            return 0;
        }
    }

    /**
     * Delete a message
     */
    async deleteMessage(messageId) {
        try {
            const { error } = await this.supabase
                .from('messages')
                .delete()
                .eq('id', messageId);

            if (error) throw error;

            return true;

        } catch (error) {
            console.error('Error deleting message:', error);
            return false;
        }
    }

    /**
     * Search messages
     */
    async searchMessages(query) {
        try {
            const userProfile = window.authManager?.getUserProfile();
            if (!userProfile) return [];

            const { data, error } = await this.supabase
                .from('messages')
                .select('*')
                .or(`sender_id.eq.${userProfile.id},receiver_id.eq.${userProfile.id}`)
                .ilike('message', `%${query}%`)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;

            return data || [];

        } catch (error) {
            console.error('Error searching messages:', error);
            return [];
        }
    }

    /**
     * Request notification permission
     */
    async requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        return Notification.permission === 'granted';
    }

    /**
     * Clean up subscriptions
     */
    destroy() {
        if (this.messageSubscription) {
            this.messageSubscription.unsubscribe();
        }
    }
}

// Initialize and export
window.ChatSystem = ChatSystem;
window.chatSystem = new ChatSystem();

// Helper function to format message time
window.formatMessageTime = function(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `قبل ${minutes} دقيقة`;
    if (hours < 24) return `قبل ${hours} ساعة`;
    if (days < 7) return `قبل ${days} يوم`;
    
    return date.toLocaleDateString('ar-SA', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
};

// Helper function to format message date
window.formatMessageDate = function(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    
    // If today
    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString('ar-SA', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }
    
    // If this week
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    if (date > weekAgo) {
        return date.toLocaleDateString('ar-SA', { weekday: 'long' });
    }
    
    // Otherwise show date
    return date.toLocaleDateString('ar-SA', { 
        month: 'short', 
        day: 'numeric' 
    });
};
