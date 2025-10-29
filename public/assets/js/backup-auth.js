// Backup Authentication System
// Works without database - stores everything in localStorage

class BackupAuth {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('backup_users') || '{}');
        this.sessions = JSON.parse(localStorage.getItem('backup_sessions') || '{}');
    }

    // Save data to localStorage
    save() {
        localStorage.setItem('backup_users', JSON.stringify(this.users));
        localStorage.setItem('backup_sessions', JSON.stringify(this.sessions));
    }

    // Register user
    register(email, password, userType = 'shipper') {
        if (this.users[email]) {
            return { success: false, error: 'User already exists' };
        }

        this.users[email] = {
            id: 'user_' + Date.now(),
            email: email,
            password: password, // In production, hash this!
            name: email.split('@')[0],
            user_type: userType,
            created_at: new Date().toISOString()
        };

        this.save();
        return { success: true, user: this.users[email] };
    }

    // Login user
    login(email, password) {
        const user = this.users[email];
        
        if (!user || user.password !== password) {
            return { success: false, error: 'Invalid credentials' };
        }

        // Create session
        const sessionId = 'session_' + Date.now();
        this.sessions[sessionId] = {
            user_id: user.id,
            email: user.email,
            user_type: user.user_type,
            name: user.name,
            created_at: new Date().toISOString()
        };

        this.save();

        // Store in sessionStorage for quick access
        sessionStorage.setItem('backup_session_id', sessionId);
        sessionStorage.setItem('user_email', user.email);
        sessionStorage.setItem('user_id', user.id);
        sessionStorage.setItem('user_type', user.user_type);
        sessionStorage.setItem('user_name', user.name);
        sessionStorage.setItem('justLoggedIn', 'true');

        return { success: true, user: user, session: this.sessions[sessionId] };
    }

    // Check if user is logged in
    isLoggedIn() {
        const sessionId = sessionStorage.getItem('backup_session_id');
        if (!sessionId || !this.sessions[sessionId]) {
            return false;
        }
        return true;
    }

    // Get current user
    getCurrentUser() {
        const sessionId = sessionStorage.getItem('backup_session_id');
        if (!sessionId || !this.sessions[sessionId]) {
            return null;
        }
        return this.sessions[sessionId];
    }

    // Logout
    logout() {
        const sessionId = sessionStorage.getItem('backup_session_id');
        if (sessionId) {
            delete this.sessions[sessionId];
            this.save();
        }
        
        sessionStorage.clear();
    }

    // Create some demo users for testing
    createDemoUsers() {
        if (Object.keys(this.users).length === 0) {
            this.register('carrier@test.com', '123456', 'carrier');
            this.register('shipper@test.com', '123456', 'shipper');
            this.register('test@test.com', '123456', 'shipper');
            console.log('BackupAuth: Demo users created');
        }
    }
}

// Initialize backup auth
window.backupAuth = new BackupAuth();
window.backupAuth.createDemoUsers();

console.log('BackupAuth: System initialized');
console.log('Demo accounts: carrier@test.com / shipper@test.com / test@test.com (password: 123456)');