// Shipment Form JavaScript for Fast Ship Platform

document.addEventListener('DOMContentLoaded', function() {
    initShipmentForm();
});

function initShipmentForm() {
    const shipmentForm = document.getElementById('shipmentForm');
    if (!shipmentForm) return;
    
    // Set minimum date to today
    const neededDate = document.getElementById('neededDate');
    if (neededDate) {
        const today = new Date().toISOString().split('T')[0];
        neededDate.min = today;
    }
    
    // Form submission handler
    shipmentForm.addEventListener('submit', handleShipmentFormSubmit);
}

// Handle shipment form submission
async function handleShipmentFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const currentLang = document.documentElement.lang || 'ar';
    
    // Basic validation
    if (!validateShipmentForm(formData)) {
        return;
    }
    
    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ' + 
        (currentLang === 'ar' ? 'جاري إضافة الشحنة...' : 'Adding shipment...');
    submitBtn.disabled = true;
    
    try {
        // Get current user
        const storedUser = localStorage.getItem('fastship_user') || sessionStorage.getItem('fastship_user');
        if (!storedUser) {
            throw new Error(currentLang === 'ar' ? 'يجب تسجيل الدخول أولاً' : 'Please login first');
        }
        
        const user = JSON.parse(storedUser);
        
        // Check if Supabase is initialized
        if (!window.supabaseClient) {
            throw new Error(currentLang === 'ar' ? 'خطأ في الاتصال بقاعدة البيانات' : 'Database connection error');
        }
        
        // Prepare shipment data
        const shipmentData = {
            user_id: user.id,
            shipper_type: formData.get('shipperType'),
            item_type: formData.get('itemType'),
            weight: parseFloat(formData.get('weight')),
            price_offer: parseFloat(formData.get('priceOffer')),
            from_country: formData.get('fromCountry'),
            from_city: formData.get('fromCity'),
            to_country: formData.get('toCountry'),
            to_city: formData.get('toCity'),
            needed_date: formData.get('neededDate'),
            urgency: formData.get('urgency') || 'normal',
            item_description: formData.get('itemDescription'),
            special_requirements: formData.get('specialRequirements') || null,
            fragile: formData.get('fragile') === 'on',
            insurance: formData.get('insurance') === 'on',
            tracking_required: formData.get('trackingRequired') === 'on',
            signature_required: formData.get('signatureRequired') === 'on',
            status: 'pending',
            created_at: new Date().toISOString()
        };
        
        console.log('Submitting shipment data:', shipmentData);
        
        // Insert shipment into database
        const { data, error } = await window.supabaseClient
            .from('shipments')
            .insert([shipmentData])
            .select();
        
        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }
        
        console.log('Shipment added successfully:', data);
        
        // Success
        const successMessage = currentLang === 'ar' 
            ? 'تم إضافة الشحنة بنجاح! سيتم البحث عن ناقلين مناسبين.'
            : 'Shipment added successfully! We will search for suitable carriers.';
        
        showAlert('success', successMessage, successMessage);
        
        // Redirect to shipments page after delay
        setTimeout(() => {
            window.location.href = 'my-shipments.html';
        }, 2000);
        
    } catch (error) {
        console.error('Error adding shipment:', error);
        const errorMessage = currentLang === 'ar'
            ? 'خطأ في إضافة الشحنة: ' + (error.message || 'حدث خطأ غير متوقع')
            : 'Error adding shipment: ' + (error.message || 'An unexpected error occurred');
        
        showAlert('error', errorMessage, errorMessage);
    } finally {
        // Reset button state
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Validate shipment form
function validateShipmentForm(formData) {
    const currentLang = document.documentElement.lang || 'ar';
    const shipperType = formData.get('shipperType');
    const itemType = formData.get('itemType');
    const weight = parseFloat(formData.get('weight'));
    const priceOffer = parseFloat(formData.get('priceOffer'));
    const fromCountry = formData.get('fromCountry');
    const fromCity = formData.get('fromCity');
    const toCountry = formData.get('toCountry');
    const toCity = formData.get('toCity');
    const neededDate = formData.get('neededDate');
    const itemDescription = formData.get('itemDescription');
    
    // Check required fields
    if (!shipperType || !itemType || !weight || !priceOffer || !fromCountry || !fromCity || 
        !toCountry || !toCity || !neededDate || !itemDescription) {
        showAlert('error', 
            currentLang === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields',
            currentLang === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields'
        );
        return false;
    }
    
    // Check weight
    if (weight <= 0 || weight > 50000) {
        showAlert('error',
            currentLang === 'ar' ? 'الوزن يجب أن يكون بين 0.1 و 50000 كجم' : 'Weight must be between 0.1 and 50000 kg',
            currentLang === 'ar' ? 'الوزن يجب أن يكون بين 0.1 و 50000 كجم' : 'Weight must be between 0.1 and 50000 kg'
        );
        return false;
    }
    
    // Check price
    if (priceOffer <= 0) {
        showAlert('error',
            currentLang === 'ar' ? 'السعر المقترح يجب أن يكون أكبر من صفر' : 'Price offer must be greater than zero',
            currentLang === 'ar' ? 'السعر المقترح يجب أن يكون أكبر من صفر' : 'Price offer must be greater than zero'
        );
        return false;
    }
    
    // Check if needed date is in the future
    const today = new Date().toISOString().split('T')[0];
    if (neededDate < today) {
        showAlert('error',
            currentLang === 'ar' ? 'يجب أن يكون التاريخ المطلوب في المستقبل' : 'Needed date must be in the future',
            currentLang === 'ar' ? 'يجب أن يكون التاريخ المطلوب في المستقبل' : 'Needed date must be in the future'
        );
        return false;
    }
    
    // Check if from and to cities are different
    if (fromCountry === toCountry && fromCity.toLowerCase() === toCity.toLowerCase()) {
        showAlert('error',
            currentLang === 'ar' ? 'يجب أن تكون المدينة المصدر والوجهة مختلفتين' : 'From and to cities must be different',
            currentLang === 'ar' ? 'يجب أن تكون المدينة المصدر والوجهة مختلفتين' : 'From and to cities must be different'
        );
        return false;
    }
    
    // Check description length
    if (itemDescription.length < 10) {
        showAlert('error',
            currentLang === 'ar' ? 'الوصف يجب أن يكون 10 أحرف على الأقل' : 'Description must be at least 10 characters',
            currentLang === 'ar' ? 'الوصف يجب أن يكون 10 أحرف على الأقل' : 'Description must be at least 10 characters'
        );
        return false;
    }
    
    return true;
}

// Show alert function (should be defined globally in your app)
function showAlert(type, messageAr, messageEn) {
    // Remove existing alert if any
    const existingAlert = document.querySelector('.alert-message');
    if (existingAlert) {
        existingAlert.remove();
    }

    const currentLang = document.documentElement.lang || 'ar';
    const message = currentLang === 'ar' ? messageAr : messageEn;

    const alert = document.createElement('div');
    alert.className = `alert-message alert-${type}`;
    alert.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        left: 20px;
        padding: 15px 20px;
        border-radius: 10px;
        color: white;
        font-weight: 600;
        z-index: 10000;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease;
    `;

    if (type === 'success') {
        alert.style.background = '#10b981';
    } else if (type === 'error') {
        alert.style.background = '#ef4444';
    } else {
        alert.style.background = '#FF6B35';
    }

    const alertContent = document.createElement('div');
    alertContent.style.display = 'flex';
    alertContent.style.alignItems = 'center';
    alertContent.style.justifyContent = 'space-between';

    const messageSpan = document.createElement('span');
    messageSpan.innerHTML = message;

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.innerHTML = '×';
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.color = 'white';
    closeButton.style.fontSize = '1.2rem';
    closeButton.style.cursor = 'pointer';
    closeButton.onclick = function() {
        alert.remove();
    };

    alertContent.appendChild(messageSpan);
    alertContent.appendChild(closeButton);
    alert.appendChild(alertContent);

    document.body.appendChild(alert);

    setTimeout(() => {
        if (alert.parentElement) {
            alert.remove();
        }
    }, 5000);
}

// Make functions available globally
window.handleShipmentFormSubmit = handleShipmentFormSubmit;
window.validateShipmentForm = validateShipmentForm;
