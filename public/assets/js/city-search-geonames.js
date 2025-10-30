/**
 * City Search with GeoNames API Integration
 * البحث عن المدن العالمية (11 مليون مكان)
 */

// ⚠️ ملاحظة أمنية: في الإنتاج، احفظ username في متغير بيئي
const GEONAMES_USERNAME = 'gide1979';
const GEONAMES_API_URL = 'http://api.geonames.org/searchJSON';

class CitySearchGeoNames {
    constructor() {
        this.searchTimeout = null;
        this.cache = new Map(); // Cache للنتائج
    }

    /**
     * البحث عن المدن من GeoNames API
     */
    async searchCities(query) {
        try {
            if (!query || query.trim().length < 2) {
                return [];
            }

            // التحقق من الـ Cache أولاً
            if (this.cache.has(query)) {
                console.log('✅ جلب النتائج من الـ Cache');
                return this.cache.get(query);
            }

            console.log(`🔍 البحث عن: "${query}" في GeoNames...`);

            // بناء معاملات الـ API
            const params = new URLSearchParams({
                q: query,
                maxRows: 15,
                featureClass: 'P', // P = المدن والقرى
                username: GEONAMES_USERNAME,
                style: 'FULL',
                orderby: 'population', // ترتيب حسب عدد السكان
                lang: 'ar' // الأسماء بالعربي إن وُجدت
            });

            const response = await fetch(`${GEONAMES_API_URL}?${params}`);
            
            if (!response.ok) {
                throw new Error(`GeoNames API Error: ${response.status}`);
            }

            const data = await response.json();

            // التحقق من وجود أخطاء في الاستجابة
            if (data.status) {
                console.error('❌ GeoNames API Error:', data.status.message);
                return this.getFallbackCities(query);
            }

            if (data.geonames && data.geonames.length > 0) {
                // تحويل البيانات لصيغتنا
                const cities = data.geonames.map(city => ({
                    id: city.geonameId,
                    name_ar: city.name,
                    name_en: city.name,
                    country: city.countryName,
                    country_code: city.countryCode,
                    latitude: parseFloat(city.lat),
                    longitude: parseFloat(city.lng),
                    population: city.population || 0,
                    timezone: city.timezone?.timeZoneId || '',
                    admin_name: city.adminName1 || '', // اسم المنطقة/المحافظة
                    is_major_city: city.population > 500000,
                    is_capital: city.fcode === 'PPLC'
                }));

                // حفظ في الـ Cache
                this.cache.set(query, cities);

                console.log(`✅ تم العثور على ${cities.length} مدينة`);
                return cities;
            }

            console.log('⚠️ لم يتم العثور على نتائج');
            return this.getFallbackCities(query);

        } catch (error) {
            console.error('❌ خطأ في البحث عن المدن:', error);
            return this.getFallbackCities(query);
        }
    }

    /**
     * بحث مع Debouncing (تأخير)
     */
    searchWithDebounce(query, callback, delay = 300) {
        clearTimeout(this.searchTimeout);
        
        this.searchTimeout = setTimeout(async () => {
            const results = await this.searchCities(query);
            callback(results);
        }, delay);
    }

    /**
     * مدن احتياطية شائعة (في حالة فشل API)
     */
    getFallbackCities(query) {
        const fallbackCities = [
            // السعودية
            { name_ar: 'الرياض', name_en: 'Riyadh', country: 'Saudi Arabia' },
            { name_ar: 'جدة', name_en: 'Jeddah', country: 'Saudi Arabia' },
            { name_ar: 'مكة المكرمة', name_en: 'Makkah', country: 'Saudi Arabia' },
            { name_ar: 'المدينة المنورة', name_en: 'Madinah', country: 'Saudi Arabia' },
            { name_ar: 'الدمام', name_en: 'Dammam', country: 'Saudi Arabia' },
            { name_ar: 'الخبر', name_en: 'Khobar', country: 'Saudi Arabia' },
            { name_ar: 'الطائف', name_en: 'Taif', country: 'Saudi Arabia' },
            { name_ar: 'تبوك', name_en: 'Tabuk', country: 'Saudi Arabia' },
            { name_ar: 'أبها', name_en: 'Abha', country: 'Saudi Arabia' },
            { name_ar: 'القطيف', name_en: 'Qatif', country: 'Saudi Arabia' },
            
            // الإمارات
            { name_ar: 'دبي', name_en: 'Dubai', country: 'UAE' },
            { name_ar: 'أبوظبي', name_en: 'Abu Dhabi', country: 'UAE' },
            { name_ar: 'الشارقة', name_en: 'Sharjah', country: 'UAE' },
            
            // مصر
            { name_ar: 'القاهرة', name_en: 'Cairo', country: 'Egypt' },
            { name_ar: 'الإسكندرية', name_en: 'Alexandria', country: 'Egypt' },
            
            // مدن عالمية
            { name_ar: 'لندن', name_en: 'London', country: 'UK' },
            { name_ar: 'نيويورك', name_en: 'New York', country: 'USA' },
            { name_ar: 'باريس', name_en: 'Paris', country: 'France' },
            { name_ar: 'طوكيو', name_en: 'Tokyo', country: 'Japan' }
        ];

        const lowerQuery = query.toLowerCase();
        return fallbackCities.filter(city => 
            city.name_ar.includes(query) ||
            city.name_en.toLowerCase().includes(lowerQuery)
        );
    }

    /**
     * تنظيف الـ Cache
     */
    clearCache() {
        this.cache.clear();
        console.log('🗑️ تم تنظيف الـ Cache');
    }
}

// إنشاء نسخة عامة
const citySearchGeoNames = new CitySearchGeoNames();

/**
 * تهيئة حقول البحث عن المدن
 */
function initializeCitySearch(inputElement, resultsElement) {
    if (!inputElement || !resultsElement) {
        console.error('❌ عناصر البحث غير موجودة');
        return;
    }

    // عند الكتابة في حقل البحث
    inputElement.addEventListener('input', (e) => {
        const query = e.target.value.trim();

        if (query.length < 2) {
            resultsElement.innerHTML = '';
            resultsElement.style.display = 'none';
            return;
        }

        // عرض رسالة تحميل
        resultsElement.innerHTML = '<div class="search-loading">🔍 جاري البحث...</div>';
        resultsElement.style.display = 'block';

        // البحث مع Debouncing
        citySearchGeoNames.searchWithDebounce(query, (cities) => {
            displayCityResults(cities, resultsElement, inputElement);
        });
    });

    // إخفاء النتائج عند النقر خارج الحقل
    document.addEventListener('click', (e) => {
        if (!inputElement.contains(e.target) && !resultsElement.contains(e.target)) {
            resultsElement.style.display = 'none';
        }
    });
}

/**
 * عرض نتائج البحث
 */
function displayCityResults(cities, resultsElement, inputElement) {
    if (!cities || cities.length === 0) {
        resultsElement.innerHTML = '<div class="no-results">❌ لم يتم العثور على نتائج</div>';
        return;
    }

    const html = cities.map(city => {
        const displayName = `${city.name_ar || city.name_en}${city.admin_name ? ', ' + city.admin_name : ''}, ${city.country}`;
        const population = city.population > 0 ? ` (${formatPopulation(city.population)})` : '';
        const icon = city.is_capital ? '⭐' : city.is_major_city ? '🏙️' : '📍';
        
        return `
            <div class="city-result-item" data-city='${JSON.stringify(city)}'>
                <span class="city-icon">${icon}</span>
                <div class="city-info">
                    <div class="city-name">${displayName}</div>
                    ${population ? `<div class="city-population">${population}</div>` : ''}
                </div>
            </div>
        `;
    }).join('');

    resultsElement.innerHTML = html;
    resultsElement.style.display = 'block';

    // إضافة event listeners للنتائج
    resultsElement.querySelectorAll('.city-result-item').forEach(item => {
        item.addEventListener('click', () => {
            const city = JSON.parse(item.dataset.city);
            inputElement.value = `${city.name_ar || city.name_en}, ${city.country}`;
            
            // حفظ البيانات في حقل مخفي أو data attribute
            inputElement.dataset.cityData = JSON.stringify(city);
            
            resultsElement.style.display = 'none';
            
            // إطلاق حدث مخصص
            inputElement.dispatchEvent(new CustomEvent('citySelected', { detail: city }));
        });
    });
}

/**
 * تنسيق عدد السكان
 */
function formatPopulation(population) {
    if (population >= 1000000) {
        return `${(population / 1000000).toFixed(1)} مليون نسمة`;
    } else if (population >= 1000) {
        return `${(population / 1000).toFixed(0)} ألف نسمة`;
    }
    return `${population} نسمة`;
}

/**
 * تهيئة تلقائية عند تحميل الصفحة
 */
document.addEventListener('DOMContentLoaded', () => {
    // البحث عن جميع حقول المدن في الصفحة
    const cityInputs = document.querySelectorAll('[data-city-search]');
    
    cityInputs.forEach(input => {
        const resultsId = input.dataset.citySearch || input.id + '-results';
        let resultsElement = document.getElementById(resultsId);
        
        // إنشاء عنصر النتائج إذا لم يكن موجوداً
        if (!resultsElement) {
            resultsElement = document.createElement('div');
            resultsElement.id = resultsId;
            resultsElement.className = 'city-search-results';
            input.parentElement.appendChild(resultsElement);
        }
        
        initializeCitySearch(input, resultsElement);
    });

    console.log('✅ تم تهيئة نظام البحث عن المدن (GeoNames)');
});

// تصدير للاستخدام العام
window.citySearchGeoNames = citySearchGeoNames;
window.initializeCitySearch = initializeCitySearch;

console.log('🌍 GeoNames City Search Module Loaded - 11 مليون مكان متاح!');
