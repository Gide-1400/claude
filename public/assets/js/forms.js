// Forms JavaScript for Fast Shipment Platform

document.addEventListener('DOMContentLoaded', function() {
    initForms();
});

function initForms() {
    // Initialize trip form
    const tripForm = document.getElementById('tripForm');
    if (tripForm) {
        initTripForm();
    }
    
    // Initialize form validation
    initFormValidation();
    
    // Initialize dynamic form behavior
    initDynamicFormBehavior();
}

// Initialize trip form functionality
function initTripForm() {
    const tripForm = document.getElementById('tripForm');
    const carrierTypeSelect = document.getElementById('carrierType');
    const weightInput = document.getElementById('availableWeight');
    const weightUnit = document.getElementById('weightUnit');
    const weightUnitEn = document.getElementById('weightUnitEn');
    
    // Carrier type change handler
    if (carrierTypeSelect) {
        carrierTypeSelect.addEventListener('change', function() {
            updateWeightLimits(this.value);
        });
        
        // Set initial state
        updateWeightLimits(carrierTypeSelect.value);
    }
    
    // Form submission handler
    tripForm.addEventListener('submit', handleTripFormSubmit);
}

// Update weight limits based on carrier type
function updateWeightLimits(carrierType) {
    const weightInput = document.getElementById('availableWeight');
    const weightUnit = document.getElementById('weightUnit');
    const weightUnitEn = document.getElementById('weightUnitEn');
    const currentLang = document.documentElement.lang || 'ar';
    
    if (!weightInput) return;
    
    switch(carrierType) {
        case 'individual':
            weightInput.max = 20;
            weightInput.placeholder = currentLang === 'ar' ? 'حد أقصى 20 كجم' : 'Max 20 kg';
            weightUnit.textContent = 'كجم';
            if (weightUnitEn) weightUnitEn.textContent = 'kg';
            break;
        case 'car_owner':
            weightInput.max = 1500;
            weightInput.placeholder = currentLang === 'ar' ? 'حد أقصى 1500 كجم' : 'Max 1500 kg';
            weightUnit.textContent = 'كجم';
            if (weightUnitEn) weightUnitEn.textContent = 'kg';
            break;
        case 'truck_owner':
            weightInput.max = 50000;
            weightInput.placeholder = currentLang === 'ar' ? 'حد أقصى 50 طن' : 'Max 50 tons';
            weightUnit.textContent = 'طن';
            if (weightUnitEn) weightUnitEn.textContent = 'tons';
            break;
        case 'fleet_owner':
            weightInput.max = 1000000;
            weightInput.placeholder = currentLang === 'ar' ? 'حد أقصى 1000 طن' : 'Max 1000 tons';
            weightUnit.textContent = 'طن';
            if (weightUnitEn) weightUnitEn.textContent = 'tons';
            break;
        default:
            weightInput.max = 1500;
            weightInput.placeholder = currentLang === 'ar' ? 'أدخل الوزن المتاح' : 'Enter available weight';
            weightUnit.textContent = 'كجم';
            if (weightUnitEn) weightUnitEn.textContent = 'kg';
    }
}

// Handle trip form submission
async function handleTripFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const currentLang = document.documentElement.lang || 'ar';
    
    // Basic validation
    if (!validateTripForm(formData)) {
        return;
    }
    
    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ' + 
        (currentLang === 'ar' ? 'جاري إضافة الرحلة...' : 'Adding trip...');
    submitBtn.disabled = true;
    
    try {
        // Get current user
        const user = checkAuth();
        if (!user) {
            throw new Error(currentLang === 'ar' ? 'يجب تسجيل الدخول أولاً' : 'Please login first');
        }
        
        // Prepare trip data
        const tripData = {
            user_id: user.id,
            carrier_type: formData.get('carrierType'),
            available_weight: parseFloat(formData.get('availableWeight')),
            from_country: formData.get('fromCountry'),
            from_city: formData.get('fromCity'),
            to_country: formData.get('toCountry'),
            to_city: formData.get('toCity'),
            trip_date: formData.get('tripDate'),
            price: formData.get('pricePerKg') ? parseFloat(formData.get('pricePerKg')) : null,
            description: formData.get('tripDescription'),
            flexible_date: formData.get('flexibleDate') === 'on',
            return_trip: formData.get('returnTrip') === 'on',
            multiple_stops: formData.get('multipleStops') === 'on',
            status: 'available'
        };
        
        // Insert trip into database
        const { data, error } = await window.supabase
            .from('trips')
            .insert([tripData]);
        
        if (error) throw error;
        
        // Success
        const successMessage = currentLang === 'ar' 
            ? 'تم إضافة الرحلة بنجاح!'
            : 'Trip added successfully!';
        
        showAlert('success', successMessage, successMessage);
        
        // Redirect to trips page after delay
        setTimeout(() => {
            window.location.href = 'my-trips.html';
        }, 2000);
        
    } catch (error) {
        console.error('Error adding trip:', error);
        const errorMessage = currentLang === 'ar'
            ? 'خطأ في إضافة الرحلة: ' + error.message
            : 'Error adding trip: ' + error.message;
        
        showAlert('error', errorMessage, errorMessage);
    } finally {
        // Reset button state
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Validate trip form
function validateTripForm(formData) {
    const currentLang = document.documentElement.lang || 'ar';
    const carrierType = formData.get('carrierType');
    const availableWeight = parseFloat(formData.get('availableWeight'));
    const fromCountry = formData.get('fromCountry');
    const fromCity = formData.get('fromCity');
    const toCountry = formData.get('toCountry');
    const toCity = formData.get('toCity');
    const tripDate = formData.get('tripDate');
    
    // Check required fields
    if (!carrierType || !availableWeight || !fromCountry || !fromCity || !toCountry || !toCity || !tripDate) {
        showAlert('error', 
            currentLang === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields',
            currentLang === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields'
        );
        return false;
    }
    
    // Check weight limits based on carrier type
    let maxWeight = 1500;
    switch(carrierType) {
        case 'individual': maxWeight = 20; break;
        case 'car_owner': maxWeight = 1500; break;
        case 'truck_owner': maxWeight = 50000; break;
        case 'fleet_owner': maxWeight = 1000000; break;
    }
    
    if (availableWeight > maxWeight) {
        showAlert('error',
            currentLang === 'ar' ? `الوزن المتاح يتجاوز الحد المسموح لنوع الموصل (${maxWeight})` : `Available weight exceeds limit for carrier type (${maxWeight})`,
            currentLang === 'ar' ? `الوزن المتاح يتجاوز الحد المسموح لنوع الموصل (${maxWeight})` : `Available weight exceeds limit for carrier type (${maxWeight})`
        );
        return false;
    }
    
    // Check if trip date is in the future
    const today = new Date().toISOString().split('T')[0];
    if (tripDate < today) {
        showAlert('error',
            currentLang === 'ar' ? 'يجب أن يكون تاريخ الرحلة في المستقبل' : 'Trip date must be in the future',
            currentLang === 'ar' ? 'يجب أن يكون تاريخ الرحلة في المستقبل' : 'Trip date must be in the future'
        );
        return false;
    }
    
    // Check if from and to cities are different
    if (fromCountry === toCountry && fromCity === toCity) {
        showAlert('error',
            currentLang === 'ar' ? 'يجب أن تكون المدينة المبدئية والوجهة مختلفتين' : 'From and to cities must be different',
            currentLang === 'ar' ? 'يجب أن تكون المدينة المبدئية والوجهة مختلفتين' : 'From and to cities must be different'
        );
        return false;
    }
    
    return true;
}

// Initialize form validation
function initFormValidation() {
    // Add real-time validation to form fields
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
        
        inputs.forEach(input => {
            input.addEventListener('blur', function() {
                validateField(this);
            });
            
            input.addEventListener('input', function() {
                clearFieldError(this);
            });
        });
    });
}

// Validate individual field
function validateField(field) {
    const value = field.value.trim();
    const currentLang = document.documentElement.lang || 'ar';
    
    // Clear previous error
    clearFieldError(field);
    
    // Check required fields
    if (field.hasAttribute('required') && !value) {
        setFieldError(field, 
            currentLang === 'ar' ? 'هذا الحقل مطلوب' : 'This field is required',
            currentLang === 'ar' ? 'هذا الحقل مطلوب' : 'This field is required'
        );
        return false;
    }
    
    // Email validation
    if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            setFieldError(field,
                currentLang === 'ar' ? 'البريد الإلكتروني غير صالح' : 'Invalid email address',
                currentLang === 'ar' ? 'البريد الإلكتروني غير صالح' : 'Invalid email address'
            );
            return false;
        }
    }
    
    // Phone validation
    if (field.type === 'tel' && value) {
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
        if (!phoneRegex.test(value)) {
            setFieldError(field,
                currentLang === 'ar' ? 'رقم الهاتف غير صالح' : 'Invalid phone number',
                currentLang === 'ar' ? 'رقم الهاتف غير صالح' : 'Invalid phone number'
            );
            return false;
        }
    }
    
    // Number validation
    if (field.type === 'number' && value) {
        const min = field.getAttribute('min');
        const max = field.getAttribute('max');
        
        if (min && parseFloat(value) < parseFloat(min)) {
            setFieldError(field,
                currentLang === 'ar' ? `القيمة يجب أن تكون ${min} على الأقل` : `Value must be at least ${min}`,
                currentLang === 'ar' ? `القيمة يجب أن تكون ${min} على الأقل` : `Value must be at least ${min}`
            );
            return false;
        }
        
        if (max && parseFloat(value) > parseFloat(max)) {
            setFieldError(field,
                currentLang === 'ar' ? `القيمة يجب أن تكون ${max} على الأكثر` : `Value must be at most ${max}`,
                currentLang === 'ar' ? `القيمة يجب أن تكون ${max} على الأكثر` : `Value must be at most ${max}`
            );
            return false;
        }
    }
    
    return true;
}

// Set field error
function setFieldError(field, messageAr, messageEn) {
    const currentLang = document.documentElement.lang || 'ar';
    const message = currentLang === 'ar' ? messageAr : messageEn;
    
    // Remove existing error
    clearFieldError(field);
    
    // Add error class
    field.classList.add('error');
    
    // Create error message
    const errorElement = document.createElement('div');
    errorElement.className = 'field-error';
    errorElement.style.cssText = `
        color: var(--secondary);
        font-size: 0.8rem;
        margin-top: 5px;
        display: flex;
        align-items: center;
        gap: 5px;
    `;
    errorElement.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    
    field.parentNode.appendChild(errorElement);
}

// Clear field error
function clearFieldError(field) {
    field.classList.remove('error');
    
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
}

// Initialize dynamic form behavior
function initDynamicFormBehavior() {
    // Handle dependent field updates
    const countrySelects = document.querySelectorAll('select[name="fromCountry"], select[name="toCountry"]');
    
    countrySelects.forEach(select => {
        select.addEventListener('change', function() {
            updateCityOptions(this);
        });
    });
}

// Update city options based on country selection
function updateCityOptions(countrySelect) {
    const country = countrySelect.value;
    const cityInput = countrySelect.name === 'fromCountry' 
        ? document.getElementById('fromCity')
        : document.getElementById('toCity');
    
    if (!cityInput) return;
    
    // This would typically fetch cities from an API based on the selected country
    // For now, we'll just update the placeholder
    const currentLang = document.documentElement.lang || 'ar';
    
    switch(country) {
        case 'SA':
            cityInput.placeholder = currentLang === 'ar' ? 'مثال: الرياض، جدة، الدمام' : 'e.g., Riyadh, Jeddah, Dammam';
            break;
        case 'AE':
            cityInput.placeholder = currentLang === 'ar' ? 'مثال: دبي، أبوظبي، الشارقة' : 'e.g., Dubai, Abu Dhabi, Sharjah';
            break;
        default:
            cityInput.placeholder = currentLang === 'ar' ? 'أدخل اسم المدينة' : 'Enter city name';
    }
}

// Make functions available globally
window.validateTripForm = validateTripForm;