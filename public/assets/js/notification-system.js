/**
 * نظام الإشعارات - Notification System
 * يدير إشعارات المستخدمين في الوقت الفعلي
 */

class NotificationSystem {
    constructor() {
        this.notifications = [];
        this.unreadCount = 0;
        this.user = null;
        this.realtimeChannel = null;
        this.isInitialized = false;
    }

    // تهيئة نظام الإشعارات
    async initialize() {
        try {
            // الحصول على معلومات المستخدم
            this.user = JSON.parse(
                localStorage.getItem('fastship_user') || 
                sessionStorage.getItem('fastship_user')
            );

            if (!this.user) {
                console.log('User not logged in, skipping notifications');
                return false;
            }

            console.log('Initializing notification system for user:', this.user.id);

            // جلب الإشعارات الحالية
            await this.loadNotifications();

            // الاشتراك في الإشعارات الفورية
            this.subscribeToRealtime();

            // تحديث واجهة المستخدم
            this.updateUI();

            this.isInitialized = true;
            return true;

        } catch (error) {
            console.error('Error initializing notification system:', error);
            return false;
        }
    }

    // جلب الإشعارات من قاعدة البيانات
    async loadNotifications(limit = 20) {
        try {
            const { data, error } = await window.supabaseClient
                .from('notifications')
                .select('*')
                .eq('user_id', this.user.id)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) {
                console.error('Error loading notifications:', error);
                return;
            }

            this.notifications = data || [];
            this.unreadCount = this.notifications.filter(n => !n.is_read).length;

            console.log(`Loaded ${this.notifications.length} notifications (${this.unreadCount} unread)`);

        } catch (error) {
            console.error('Error in loadNotifications:', error);
        }
    }

    // الاشتراك في الإشعارات الفورية
    subscribeToRealtime() {
        if (!window.supabaseClient) {
            console.error('Supabase client not available');
            return;
        }

        // إلغاء الاشتراك القديم إذا كان موجوداً
        if (this.realtimeChannel) {
            window.supabaseClient.removeChannel(this.realtimeChannel);
        }

        // إنشاء قناة جديدة
        this.realtimeChannel = window.supabaseClient
            .channel(`notifications:${this.user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${this.user.id}`
                },
                (payload) => {
                    console.log('New notification received:', payload);
                    this.handleNewNotification(payload.new);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${this.user.id}`
                },
                (payload) => {
                    console.log('Notification updated:', payload);
                    this.handleUpdatedNotification(payload.new);
                }
            )
            .subscribe((status) => {
                console.log('Notification realtime status:', status);
            });
    }

    // معالجة إشعار جديد
    handleNewNotification(notification) {
        // إضافة الإشعار للقائمة
        this.notifications.unshift(notification);
        this.unreadCount++;

        // عرض الإشعار
        this.showNotificationToast(notification);

        // تحديث واجهة المستخدم
        this.updateUI();

        // تشغيل صوت (اختياري)
        this.playNotificationSound();
    }

    // معالجة تحديث إشعار
    handleUpdatedNotification(notification) {
        const index = this.notifications.findIndex(n => n.id === notification.id);
        
        if (index !== -1) {
            const wasUnread = !this.notifications[index].is_read;
            const isNowRead = notification.is_read;

            this.notifications[index] = notification;

            // تحديث عداد غير المقروءة
            if (wasUnread && isNowRead) {
                this.unreadCount = Math.max(0, this.unreadCount - 1);
            }

            this.updateUI();
        }
    }

    // عرض إشعار منبثق
    showNotificationToast(notification) {
        // التحقق من دعم المتصفح للإشعارات
        if ('Notification' in window && Notification.permission === 'granted') {
            const browserNotification = new Notification(notification.title, {
                body: notification.message,
                icon: '/assets/images/logo.png',
                badge: '/assets/images/badge.png',
                tag: notification.id
            });

            browserNotification.onclick = () => {
                window.focus();
                if (notification.action_url) {
                    window.location.href = notification.action_url;
                }
                browserNotification.close();
            };
        }

        // إشعار داخل الصفحة
        const toast = document.createElement('div');
        toast.className = 'notification-toast';
        toast.innerHTML = `
            <div class="notification-toast-content">
                <div class="notification-icon ${this.getNotificationIconClass(notification.notification_type)}">
                    ${this.getNotificationIcon(notification.notification_type)}
                </div>
                <div class="notification-text">
                    <h4>${notification.title}</h4>
                    <p>${notification.message}</p>
                </div>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        document.body.appendChild(toast);

        // إزالة الإشعار بعد 5 ثواني
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 5000);

        // النقر على الإشعار
        toast.addEventListener('click', (e) => {
            if (!e.target.closest('.notification-close')) {
                if (notification.action_url) {
                    window.location.href = notification.action_url;
                }
                toast.remove();
            }
        });
    }

    // تحديث واجهة المستخدم
    updateUI() {
        // تحديث Badge العداد
        const badge = document.querySelector('.notification-badge');
        if (badge) {
            badge.textContent = this.unreadCount;
            badge.style.display = this.unreadCount > 0 ? 'flex' : 'none';
        }

        // تحديث قائمة الإشعارات
        const container = document.getElementById('notificationsList');
        if (container) {
            this.renderNotificationsList(container);
        }
    }

    // عرض قائمة الإشعارات
    renderNotificationsList(container) {
        if (this.notifications.length === 0) {
            container.innerHTML = `
                <div class="no-notifications">
                    <i class="fas fa-bell-slash"></i>
                    <p>لا توجد إشعارات بعد</p>
                </div>
            `;
            return;
        }

        const notificationsHTML = this.notifications.map(notification => `
            <div class="notification-item ${notification.is_read ? 'read' : 'unread'}" 
                 data-id="${notification.id}"
                 onclick="notificationSystem.handleNotificationClick('${notification.id}', '${notification.action_url || ''}')">
                <div class="notification-icon ${this.getNotificationIconClass(notification.notification_type)}">
                    ${this.getNotificationIcon(notification.notification_type)}
                </div>
                <div class="notification-content">
                    <h4>${notification.title}</h4>
                    <p>${notification.message}</p>
                    <span class="notification-time">${this.formatTime(notification.created_at)}</span>
                </div>
                ${!notification.is_read ? '<div class="unread-indicator"></div>' : ''}
            </div>
        `).join('');

        container.innerHTML = notificationsHTML;
    }

    // معالجة النقر على إشعار
    async handleNotificationClick(notificationId, actionUrl) {
        try {
            // وضع علامة مقروء
            await this.markAsRead(notificationId);

            // الانتقال إلى الرابط
            if (actionUrl && actionUrl !== 'null') {
                window.location.href = actionUrl;
            }

        } catch (error) {
            console.error('Error handling notification click:', error);
        }
    }

    // وضع علامة مقروء على إشعار
    async markAsRead(notificationId) {
        try {
            const { error } = await window.supabaseClient
                .from('notifications')
                .update({ is_read: true })
                .eq('id', notificationId);

            if (error) {
                console.error('Error marking notification as read:', error);
                return;
            }

            // تحديث محلياً
            const notification = this.notifications.find(n => n.id === notificationId);
            if (notification && !notification.is_read) {
                notification.is_read = true;
                this.unreadCount = Math.max(0, this.unreadCount - 1);
                this.updateUI();
            }

        } catch (error) {
            console.error('Error in markAsRead:', error);
        }
    }

    // وضع علامة مقروء على جميع الإشعارات
    async markAllAsRead() {
        try {
            const { error } = await window.supabaseClient
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', this.user.id)
                .eq('is_read', false);

            if (error) {
                console.error('Error marking all as read:', error);
                return;
            }

            // تحديث محلياً
            this.notifications.forEach(n => n.is_read = true);
            this.unreadCount = 0;
            this.updateUI();

            this.showToast('تم وضع علامة مقروء على جميع الإشعارات', 'success');

        } catch (error) {
            console.error('Error in markAllAsRead:', error);
        }
    }

    // حذف إشعار
    async deleteNotification(notificationId) {
        try {
            const { error } = await window.supabaseClient
                .from('notifications')
                .delete()
                .eq('id', notificationId);

            if (error) {
                console.error('Error deleting notification:', error);
                return;
            }

            // حذف محلياً
            const index = this.notifications.findIndex(n => n.id === notificationId);
            if (index !== -1) {
                if (!this.notifications[index].is_read) {
                    this.unreadCount = Math.max(0, this.unreadCount - 1);
                }
                this.notifications.splice(index, 1);
                this.updateUI();
            }

        } catch (error) {
            console.error('Error in deleteNotification:', error);
        }
    }

    // حذف جميع الإشعارات المقروءة
    async deleteAllRead() {
        try {
            const { error } = await window.supabaseClient
                .from('notifications')
                .delete()
                .eq('user_id', this.user.id)
                .eq('is_read', true);

            if (error) {
                console.error('Error deleting read notifications:', error);
                return;
            }

            // حذف محلياً
            this.notifications = this.notifications.filter(n => !n.is_read);
            this.updateUI();

            this.showToast('تم حذف جميع الإشعارات المقروءة', 'success');

        } catch (error) {
            console.error('Error in deleteAllRead:', error);
        }
    }

    // إرسال إشعار جديد (للاستخدام الداخلي)
    async sendNotification(userId, title, message, type, relatedId = null, actionUrl = null) {
        try {
            const notificationData = {
                user_id: userId,
                title: title,
                message: message,
                notification_type: type,
                related_id: relatedId,
                action_url: actionUrl,
                is_read: false
            };

            const { data, error } = await window.supabaseClient
                .from('notifications')
                .insert([notificationData])
                .select();

            if (error) {
                console.error('Error sending notification:', error);
                return null;
            }

            console.log('Notification sent successfully:', data);
            return data[0];

        } catch (error) {
            console.error('Error in sendNotification:', error);
            return null;
        }
    }

    // طلب إذن الإشعارات من المتصفح
    async requestPermission() {
        if (!('Notification' in window)) {
            console.log('Browser does not support notifications');
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }

        return false;
    }

    // تشغيل صوت الإشعار
    playNotificationSound() {
        try {
            const audio = new Audio('/assets/sounds/notification.mp3');
            audio.volume = 0.3;
            audio.play().catch(e => console.log('Could not play notification sound:', e));
        } catch (error) {
            // تجاهل الأخطاء إذا لم يكن الصوت متوفراً
        }
    }

    // الحصول على أيقونة الإشعار
    getNotificationIcon(type) {
        const icons = {
            'match': '<i class="fas fa-handshake"></i>',
            'message': '<i class="fas fa-envelope"></i>',
            'review': '<i class="fas fa-star"></i>',
            'system': '<i class="fas fa-info-circle"></i>',
            'payment': '<i class="fas fa-credit-card"></i>',
            'trip': '<i class="fas fa-route"></i>',
            'shipment': '<i class="fas fa-box"></i>'
        };
        return icons[type] || icons['system'];
    }

    // الحصول على class الأيقونة
    getNotificationIconClass(type) {
        const classes = {
            'match': 'icon-match',
            'message': 'icon-message',
            'review': 'icon-review',
            'system': 'icon-system',
            'payment': 'icon-payment',
            'trip': 'icon-trip',
            'shipment': 'icon-shipment'
        };
        return classes[type] || classes['system'];
    }

    // تنسيق الوقت
    formatTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) {
            return 'الآن';
        } else if (diffMins < 60) {
            return `منذ ${diffMins} دقيقة`;
        } else if (diffHours < 24) {
            return `منذ ${diffHours} ساعة`;
        } else if (diffDays < 7) {
            return `منذ ${diffDays} يوم`;
        } else {
            return date.toLocaleDateString('ar-SA', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
        }
    }

    // عرض رسالة Toast
    showToast(message, type = 'info') {
        if (typeof window.showAlert === 'function') {
            window.showAlert(message, type);
            return;
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#4CAF50' : '#2196F3'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideUp 0.3s ease;
        `;

        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'slideDown 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // تنظيف الموارد
    cleanup() {
        if (this.realtimeChannel) {
            window.supabaseClient.removeChannel(this.realtimeChannel);
            this.realtimeChannel = null;
        }
        this.isInitialized = false;
    }
}

// إنشاء نسخة عامة
const notificationSystem = new NotificationSystem();

// تهيئة تلقائية عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing notification system...');
    await notificationSystem.initialize();
    
    // طلب إذن الإشعارات
    await notificationSystem.requestPermission();
});

// تصدير للاستخدام العام
window.notificationSystem = notificationSystem;

console.log('Notification system module loaded');
