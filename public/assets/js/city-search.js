/**
 * Global City Search Functionality
 * Provides real-time city search with autocomplete
 */

class CitySearchManager {
    constructor() {
        this.cities = [];
        this.initializeEventListeners();
        this.isLoading = false;
        this.lastQuery = '';
        this.searchTimeout = null;
    }

    /**
     * Search cities from Supabase database with optimized indexes
     */
    async searchFromDatabase(query) {
        try {
            if (!window.supabaseClient) {
                console.warn('⚠️ Supabase client not initialized, using fallback data');
                return [];
            }

            this.isLoading = true;
            
            const { data, error } = await window.supabaseClient
                .from('cities')
                .select('*')
                .or(`name_ar.ilike.%${query}%,name_en.ilike.%${query}%,country_ar.ilike.%${query}%,country_en.ilike.%${query}%`)
                .order('is_major_city', { ascending: false })
                .order('is_capital', { ascending: false })
                .limit(15);

            this.isLoading = false;

            if (error) {
                console.error('❌ Error searching cities:', error);
                return [];
            }

            if (data && data.length > 0) {
                console.log(`✅ Found ${data.length} cities from database`);
            } else {
                console.log('⚠️ No cities found in database, using fallback');
            }

            return data || [];
        } catch (error) {
            console.error('❌ Error in searchFromDatabase:', error);
            this.isLoading = false;
            return [];
        }
    }

    /**
     * Fallback: Initialize sample cities data if database is unavailable
     */
    loadCities() {
        this.cities = [
            // Middle East
            { name: 'الرياض', name_en: 'Riyadh', country: 'Saudi Arabia', country_ar: 'السعودية' },
            { name: 'جدة', name_en: 'Jeddah', country: 'Saudi Arabia', country_ar: 'السعودية' },
            { name: 'الدمام', name_en: 'Dammam', country: 'Saudi Arabia', country_ar: 'السعودية' },
            { name: 'مكة المكرمة', name_en: 'Makkah', country: 'Saudi Arabia', country_ar: 'السعودية' },
            { name: 'المدينة المنورة', name_en: 'Madinah', country: 'Saudi Arabia', country_ar: 'السعودية' },
            { name: 'دبي', name_en: 'Dubai', country: 'UAE', country_ar: 'الإمارات' },
            { name: 'أبوظبي', name_en: 'Abu Dhabi', country: 'UAE', country_ar: 'الإمارات' },
            { name: 'الكويت', name_en: 'Kuwait City', country: 'Kuwait', country_ar: 'الكويت' },
            { name: 'الدوحة', name_en: 'Doha', country: 'Qatar', country_ar: 'قطر' },
            { name: 'المنامة', name_en: 'Manama', country: 'Bahrain', country_ar: 'البحرين' },
            { name: 'مسقط', name_en: 'Muscat', country: 'Oman', country_ar: 'عمان' },
            { name: 'عمان', name_en: 'Amman', country: 'Jordan', country_ar: 'الأردن' },
            { name: 'بيروت', name_en: 'Beirut', country: 'Lebanon', country_ar: 'لبنان' },
            { name: 'بغداد', name_en: 'Baghdad', country: 'Iraq', country_ar: 'العراق' },
            { name: 'طهران', name_en: 'Tehran', country: 'Iran', country_ar: 'إيران' },
            
            // Europe
            { name: 'لندن', name_en: 'London', country: 'United Kingdom', country_ar: 'بريطانيا' },
            { name: 'باريس', name_en: 'Paris', country: 'France', country_ar: 'فرنسا' },
            { name: 'برلين', name_en: 'Berlin', country: 'Germany', country_ar: 'ألمانيا' },
            { name: 'روما', name_en: 'Rome', country: 'Italy', country_ar: 'إيطاليا' },
            { name: 'مدريد', name_en: 'Madrid', country: 'Spain', country_ar: 'إسبانيا' },
            { name: 'أمستردام', name_en: 'Amsterdam', country: 'Netherlands', country_ar: 'هولندا' },
            { name: 'زيوريخ', name_en: 'Zurich', country: 'Switzerland', country_ar: 'سويسرا' },
            { name: 'فيينا', name_en: 'Vienna', country: 'Austria', country_ar: 'النمسا' },
            
            // Asia
            { name: 'بكين', name_en: 'Beijing', country: 'China', country_ar: 'الصين' },
            { name: 'شنغهاي', name_en: 'Shanghai', country: 'China', country_ar: 'الصين' },
            { name: 'طوكيو', name_en: 'Tokyo', country: 'Japan', country_ar: 'اليابان' },
            { name: 'سيول', name_en: 'Seoul', country: 'South Korea', country_ar: 'كوريا الجنوبية' },
            { name: 'نيودلهي', name_en: 'New Delhi', country: 'India', country_ar: 'الهند' },
            { name: 'مومباي', name_en: 'Mumbai', country: 'India', country_ar: 'الهند' },
            { name: 'سنغافورة', name_en: 'Singapore', country: 'Singapore', country_ar: 'سنغافورة' },
            { name: 'بانكوك', name_en: 'Bangkok', country: 'Thailand', country_ar: 'تايلاند' },
            { name: 'كوالالمبور', name_en: 'Kuala Lumpur', country: 'Malaysia', country_ar: 'ماليزيا' },
            { name: 'جاكرتا', name_en: 'Jakarta', country: 'Indonesia', country_ar: 'إندونيسيا' },
            { name: 'مانيلا', name_en: 'Manila', country: 'Philippines', country_ar: 'الفلبين' },
            
            // Americas
            { name: 'نيويورك', name_en: 'New York', country: 'United States', country_ar: 'أمريكا' },
            { name: 'لوس أنجلوس', name_en: 'Los Angeles', country: 'United States', country_ar: 'أمريكا' },
            { name: 'شيكاغو', name_en: 'Chicago', country: 'United States', country_ar: 'أمريكا' },
            { name: 'تورونتو', name_en: 'Toronto', country: 'Canada', country_ar: 'كندا' },
            { name: 'فانكوفر', name_en: 'Vancouver', country: 'Canada', country_ar: 'كندا' },
            { name: 'مكسيكو سيتي', name_en: 'Mexico City', country: 'Mexico', country_ar: 'المكسيك' },
            { name: 'ساو باولو', name_en: 'São Paulo', country: 'Brazil', country_ar: 'البرازيل' },
            { name: 'بوينس آيرس', name_en: 'Buenos Aires', country: 'Argentina', country_ar: 'الأرجنتين' },
            
            // Africa
            { name: 'القاهرة', name_en: 'Cairo', country: 'Egypt', country_ar: 'مصر' },
            { name: 'الإسكندرية', name_en: 'Alexandria', country: 'Egypt', country_ar: 'مصر' },
            { name: 'لاغوس', name_en: 'Lagos', country: 'Nigeria', country_ar: 'نيجيريا' },
            { name: 'كيب تاون', name_en: 'Cape Town', country: 'South Africa', country_ar: 'جنوب أفريقيا' },
            { name: 'الدار البيضاء', name_en: 'Casablanca', country: 'Morocco', country_ar: 'المغرب' },
            { name: 'نيروبي', name_en: 'Nairobi', country: 'Kenya', country_ar: 'كينيا' },
            { name: 'أديس أبابا', name_en: 'Addis Ababa', country: 'Ethiopia', country_ar: 'إثيوبيا' },
            
            // Oceania
            { name: 'سيدني', name_en: 'Sydney', country: 'Australia', country_ar: 'أستراليا' },
            { name: 'ملبورن', name_en: 'Melbourne', country: 'Australia', country_ar: 'أستراليا' },
            { name: 'أوكلاند', name_en: 'Auckland', country: 'New Zealand', country_ar: 'نيوزيلندا' }
        ];
    }

    /**
     * Initialize event listeners
     */
    initializeEventListeners() {
        const searchInput = document.getElementById('citySearch');
        const resultsContainer = document.getElementById('cityResults');

        if (!searchInput) return;

        // Input event for real-time search
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            if (query.length >= 2) {
                this.searchCities(query);
            } else {
                this.hideResults();
            }
        });

        // Focus event to show recent searches or suggestions
        searchInput.addEventListener('focus', () => {
            const query = searchInput.value.trim();
            if (query.length >= 2) {
                this.searchCities(query);
            } else {
                this.showPopularCities();
            }
        });

        // Click outside to hide results
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !resultsContainer.contains(e.target)) {
                this.hideResults();
            }
        });

        // Update placeholder text based on language
        this.updatePlaceholder();
    }

    /**
     * Search cities based on query with debouncing
     */
    async searchCities(query) {
        if (this.isLoading) return;
        
        // Clear previous timeout
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        // Debounce: wait 300ms before searching
        this.searchTimeout = setTimeout(async () => {
            const currentLang = window.currentLanguage || 'ar';
            
            console.log(`🔎 Searching for: "${query}"`);
            
            // Try database first
            let searchResults = await this.searchFromDatabase(query);
            
            // Fallback to local data if database fails or empty
            if (searchResults.length === 0) {
                console.log('📚 Using fallback local data');
                searchResults = this.cities.filter(city => {
                    const nameMatch = currentLang === 'ar' 
                        ? city.name.includes(query) || city.name_ar?.includes(query)
                        : city.name_en.toLowerCase().includes(query.toLowerCase());
                    
                    const countryMatch = currentLang === 'ar'
                        ? city.country_ar?.includes(query)
                        : city.country_en?.toLowerCase().includes(query.toLowerCase());

                    return nameMatch || countryMatch;
                }).slice(0, 15);
                
                console.log(`📋 Fallback found ${searchResults.length} results`);
            }

            this.displayResults(searchResults);
        }, 300); // 300ms debounce
    }

    /**
     * Show popular cities when focusing on empty input
     */
    async showPopularCities() {
        // Try to load from database first
        let popularCities = await this.searchFromDatabase('');
        
        // Fallback to local data
        if (popularCities.length === 0 && this.cities.length > 0) {
            popularCities = this.cities.slice(0, 10);
        } else {
            popularCities = popularCities.slice(0, 10);
        }
        
        this.displayResults(popularCities, true);
    }

    /**
     * Display search results
     */
    displayResults(cities, isPopular = false) {
        const resultsContainer = document.getElementById('cityResults');
        if (!resultsContainer) return;

        if (cities.length === 0) {
            this.hideResults();
            return;
        }

        const currentLang = window.currentLanguage || 'ar';
        const headerText = isPopular 
            ? (currentLang === 'ar' ? 'مدن شائعة:' : 'Popular Cities:')
            : (currentLang === 'ar' ? 'نتائج البحث:' : 'Search Results:');

        let html = `<div class="search-header">${headerText}</div>`;
        
        cities.forEach(city => {
            const cityName = currentLang === 'ar' ? (city.name_ar || city.name) : (city.name_en || city.name);
            const countryName = currentLang === 'ar' ? (city.country_ar || city.country) : (city.country_en || city.country);
            
            html += `
                <div class="city-result-item" onclick="citySearchManager.selectCity('${city.name_ar || city.name}', '${city.name_en || city.name_en}', '${city.country_en || city.country}', '${city.country_ar || city.country_ar}')">
                    <i class="fas fa-map-marker-alt"></i>
                    <div class="city-info">
                        <div class="city-name">${cityName}</div>
                        <div class="city-country">${countryName}</div>
                    </div>
                </div>
            `;
        });

        resultsContainer.innerHTML = html;
        resultsContainer.style.display = 'block';
    }

    /**
     * Handle city selection
     */
    selectCity(nameAr, nameEn, country, countryAr) {
        const searchInput = document.getElementById('citySearch');
        const currentLang = window.currentLanguage || 'ar';
        
        const selectedCity = currentLang === 'ar' ? nameAr : nameEn;
        searchInput.value = selectedCity;
        
        this.hideResults();
        
        // Store selected city data
        window.selectedCity = {
            name: nameAr,
            name_en: nameEn,
            country: country,
            country_ar: countryAr
        };

        // Trigger custom event for other components
        document.dispatchEvent(new CustomEvent('citySelected', {
            detail: window.selectedCity
        }));

        // Visual feedback
        searchInput.style.background = '#e8f5e8';
        setTimeout(() => {
            searchInput.style.background = 'white';
        }, 1000);
    }

    /**
     * Hide search results
     */
    hideResults() {
        const resultsContainer = document.getElementById('cityResults');
        if (resultsContainer) {
            resultsContainer.style.display = 'none';
        }
    }

    /**
     * Update placeholder text based on current language
     */
    updatePlaceholder() {
        const searchInput = document.getElementById('citySearch');
        if (!searchInput) return;

        const currentLang = window.currentLanguage || 'ar';
        const placeholder = currentLang === 'ar' 
            ? 'ابحث عن مدينتك (الرياض، دبي، لندن، نيويورك...)'
            : 'Search your city (Riyadh, Dubai, London, New York...)';
        
        searchInput.placeholder = placeholder;
    }

    /**
     * Add new city (for user-generated content)
     */
    async addUserCity(cityData) {
        try {
            // In production, this would send to Supabase
            console.log('Adding user city:', cityData);
            
            // Add to local array for immediate search
            this.cities.push({
                name: cityData.name,
                name_en: cityData.name_en,
                country: cityData.country,
                country_ar: cityData.country_ar,
                user_generated: true,
                verified: false
            });

            return { success: true, message: 'City added successfully' };
        } catch (error) {
            console.error('Error adding city:', error);
            return { success: false, message: 'Failed to add city' };
        }
    }
}

// Initialize city search manager
let citySearchManager;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Wait for Supabase to be ready
    if (window.supabaseConfigReady) {
        await window.supabaseConfigReady;
    }
    
    console.log('🔍 City Search initialized');
    console.log('✅ Supabase Client:', window.supabaseClient ? 'Connected' : 'Not connected');
    
    citySearchManager = new CitySearchManager();
    
    // Load fallback cities for offline mode
    citySearchManager.loadCities();
});

// Update on language change
document.addEventListener('languageChanged', () => {
    if (citySearchManager) {
        citySearchManager.updatePlaceholder();
    }
});

// Export for use in other modules
window.CitySearchManager = CitySearchManager;
