// Common helper functions for the application

export function formatCurrency(amount) {
    return new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(amount);
}

export function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('ar-SA', options);
}

export function isValidEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@\"A-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[^<>()[\]\\.,;:\s@\"A-Z0-9!#$%&'*+/=?^_`{|}~-]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

