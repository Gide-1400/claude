// ========================================
// محرك المطابقة الذكي - Fast Ship SA
// Smart Matching Engine with Intelligent Scoring
// ========================================

/**
 * محرك المطابقة الذكي
 * يربط الشحنات مع الرحلات المناسبة باستخدام خوارزمية متقدمة
 */
class MatchingEngine {
    constructor() {
        this.supabase = window.supabaseClient;
        this.currentUser = null;
        this.cities = [];
        this.initialized = false;
        this.matchCache = new Map(); // تخزين مؤقت للنتائج
        this.cacheTimeout = 5 * 60 * 1000; // 5 دقائق
        this.init();
    }

    async init() {
        try {
            // انتظار تحميل Supabase
            if (!window.supabaseClient) {
                await this.waitForSupabase();
                this.supabase = window.supabaseClient;
            }
            
            // تحميل قائمة المدن
            await this.loadCitiesFromDB();
            
            this.initialized = true;
            console.log('✅ محرك المطابقة جاهز للعمل');
        } catch (error) {
            console.error('❌ خطأ في تهيئة محرك المطابقة:', error);
        }
    }

    // ========================================
    // تحميل المدن من قاعدة البيانات
    // ========================================
    async loadCitiesFromDB() {
        try {
            const { data, error } = await this.supabase
                .from('cities')
                .select('name_ar, name_en, country_ar, country_en, latitude, longitude');

            if (error) throw error;

            this.cities = data || [];
            console.log(`تم تحميل ${this.cities.length} مدينة`);
        } catch (error) {
            console.error('خطأ في تحميل المدن:', error);
            // استخدام قائمة افتراضية
            this.cities = this.getDefaultCities();
        }
    }


    // ========================================
    // البحث عن رحلات مناسبة للشحنة
    // ========================================
    async findMatchingTripsForShipment(shipmentId) {
        try {
            if (!this.initialized) await this.init();

            // التحقق من التخزين المؤقت
            const cacheKey = `shipment_${shipmentId}`;
            const cached = this.getCachedResult(cacheKey);
            if (cached) return cached;

            // جلب تفاصيل الشحنة
            const { data: shipment, error: shipmentError } = await this.supabase
                .from('shipments')
                .select('*')
                .eq('id', shipmentId)
                .single();

            if (shipmentError || !shipment) {
                throw new Error('لم يتم العثور على الشحنة');
            }

            // البحث عن الرحلات المتاحة
            const { data: trips, error: tripsError } = await this.supabase
                .from('trips')
                .select(`
                    *,
                    users (
                        id,
                        name,
                        phone,
                        email,
                        carrier_type,
                        rating,
                        completed_trips
                    )
                `)
                .eq('status', 'available')
                .gte('available_weight', shipment.weight)
                .gte('trip_date', new Date().toISOString().split('T')[0]);

            if (tripsError) throw tripsError;

            if (!trips || trips.length === 0) {
                return [];
            }

            // تصفية الرحلات المناسبة وحساب الدرجات
            const matchedTrips = trips
                .map(trip => {
                    const matchScore = this.calculateAdvancedMatchScore(shipment, trip);
                    return {
                        ...trip,
                        matchScore,
                        compatibility: this.getCompatibilityLevel(matchScore),
                        distance: this.calculateDistance(
                            shipment.from_city,
                            shipment.to_city,
                            trip.from_city,
                            trip.to_city
                        ),
                        pricePerKg: trip.price_per_kg || 0,
                        estimatedCost: (trip.price_per_kg || 0) * shipment.weight,
                        estimatedProfit: (shipment.price_offer || 0) - ((trip.price_per_kg || 0) * shipment.weight)
                    };
                })
                .filter(match => match.matchScore >= 30) // الحد الأدنى للقبول
                .sort((a, b) => b.matchScore - a.matchScore);

            // حفظ في التخزين المؤقت
            this.setCachedResult(cacheKey, matchedTrips);

            console.log(`✅ تم العثور على ${matchedTrips.length} رحلة مناسبة للشحنة ${shipmentId}`);
            return matchedTrips;

        } catch (error) {
            console.error('❌ خطأ في البحث عن الرحلات المطابقة:', error);
            return [];
        }
    }

    // ========================================
    // البحث عن شحنات مناسبة للرحلة
    // ========================================
    async findMatchingShipmentsForTrip(tripId) {
        try {
            if (!this.initialized) await this.init();

            // التحقق من التخزين المؤقت
            const cacheKey = `trip_${tripId}`;
            const cached = this.getCachedResult(cacheKey);
            if (cached) return cached;

            // جلب تفاصيل الرحلة
            const { data: trip, error: tripError } = await this.supabase
                .from('trips')
                .select('*')
                .eq('id', tripId)
                .single();

            if (tripError || !trip) {
                throw new Error('لم يتم العثور على الرحلة');
            }

            // البحث عن الشحنات المناسبة
            const { data: shipments, error: shipmentsError } = await this.supabase
                .from('shipments')
                .select(`
                    *,
                    users (
                        id,
                        name,
                        phone,
                        email,
                        shipper_type,
                        rating,
                        completed_shipments
                    )
                `)
                .eq('status', 'pending')
                .lte('weight', trip.available_weight)
                .lte('needed_date', trip.trip_date);

            if (shipmentsError) throw shipmentsError;

            if (!shipments || shipments.length === 0) {
                return [];
            }

            // تصفية الشحنات المناسبة وحساب الدرجات
            const matchedShipments = shipments
                .map(shipment => {
                    const matchScore = this.calculateAdvancedMatchScore(shipment, trip);
                    return {
                        ...shipment,
                        matchScore,
                        compatibility: this.getCompatibilityLevel(matchScore),
                        distance: this.calculateDistance(
                            trip.from_city,
                            trip.to_city,
                            shipment.from_city,
                            shipment.to_city
                        ),
                        pricePerKg: trip.price_per_kg || 0,
                        estimatedRevenue: (shipment.price_offer || 0),
                        estimatedProfit: (shipment.price_offer || 0) - ((trip.price_per_kg || 0) * shipment.weight)
                    };
                })
                .filter(match => match.matchScore >= 30) // الحد الأدنى للقبول
                .sort((a, b) => b.matchScore - a.matchScore);

            // حفظ في التخزين المؤقت
            this.setCachedResult(cacheKey, matchedShipments);

            console.log(`✅ تم العثور على ${matchedShipments.length} شحنة مناسبة للرحلة ${tripId}`);
            return matchedShipments;

        } catch (error) {
            console.error('❌ خطأ في البحث عن الشحنات المطابقة:', error);
            return [];
        }
    }

    // ========================================
    // حساب درجة التطابق المتقدمة
    // ========================================
    calculateAdvancedMatchScore(shipment, trip) {
        let totalScore = 0;
        const weights = {
            route: 35,      // أهمية المسار
            date: 25,       // أهمية التاريخ
            capacity: 15,   // أهمية السعة
            price: 10,      // أهمية السعر
            type: 8,        // أهمية النوع
            rating: 7       // أهمية التقييم
        };

        // 1. درجة المسار (35 نقطة)
        const routeScore = this.calculateRouteScore(shipment, trip);
        totalScore += (routeScore / 100) * weights.route;

        // 2. درجة التاريخ (25 نقطة)
        const dateScore = this.calculateDateScore(shipment, trip);
        totalScore += (dateScore / 100) * weights.date;

        // 3. درجة السعة (15 نقطة)
        const capacityScore = this.calculateCapacityScore(shipment, trip);
        totalScore += (capacityScore / 100) * weights.capacity;

        // 4. درجة السعر (10 نقاط)
        const priceScore = this.calculatePriceScore(shipment, trip);
        totalScore += (priceScore / 100) * weights.price;

        // 5. درجة التوافق بين الأنواع (8 نقاط)
        const typeScore = this.calculateTypeCompatibility(shipment, trip);
        totalScore += (typeScore / 100) * weights.type;

        // 6. درجة التقييم (7 نقاط)
        const ratingScore = this.calculateRatingScore(trip);
        totalScore += (ratingScore / 100) * weights.rating;

        return Math.round(totalScore);
    }

    // ========================================
    // حساب درجة المسار
    // ========================================
    calculateRouteScore(shipment, trip) {
        const fromMatch = this.citySimilarity(shipment.from_city, trip.from_city);
        const toMatch = this.citySimilarity(shipment.to_city, trip.to_city);

        // تطابق كامل
        if (fromMatch >= 90 && toMatch >= 90) {
            return 100;
        }

        // تطابق جزئي
        if (fromMatch >= 70 && toMatch >= 70) {
            return 85;
        }

        // نفس الوجهة فقط
        if (toMatch >= 80) {
            return 70;
        }

        // نفس المنشأ فقط
        if (fromMatch >= 80) {
            return 60;
        }

        // فحص المسار المتوسط
        if (this.isOnRoute(shipment, trip)) {
            return 50;
        }

        return 0;
    }

    // ========================================
    // حساب درجة التاريخ
    // ========================================
    calculateDateScore(shipment, trip) {
        const shipmentDate = new Date(shipment.needed_date);
        const tripDate = new Date(trip.trip_date);
        const diffDays = Math.abs((tripDate - shipmentDate) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 100;        // نفس اليوم
        if (diffDays <= 1) return 95;          // يوم واحد
        if (diffDays <= 2) return 85;          // يومان
        if (diffDays <= 3) return 75;          // 3 أيام
        if (diffDays <= 5) return 65;          // 5 أيام
        if (diffDays <= 7) return 50;          // أسبوع
        if (diffDays <= 14) return 30;         // أسبوعان
        if (diffDays <= 21) return 15;         // 3 أسابيع

        return 0; // أكثر من 3 أسابيع
    }

    // ========================================
    // حساب درجة السعة
    // ========================================
    calculateCapacityScore(shipment, trip) {
        const availableWeight = trip.available_weight || 0;
        const neededWeight = shipment.weight || 0;

        if (neededWeight > availableWeight) {
            return 0; // لا يمكن استيعاب الوزن
        }

        // نسبة الاستغلال
        const utilization = (neededWeight / availableWeight) * 100;

        if (utilization >= 80 && utilization <= 100) return 100;  // استغلال ممتاز
        if (utilization >= 60 && utilization < 80) return 90;     // استغلال جيد جداً
        if (utilization >= 40 && utilization < 60) return 80;     // استغلال جيد
        if (utilization >= 20 && utilization < 40) return 70;     // استغلال مقبول
        if (utilization >= 10 && utilization < 20) return 50;     // استغلال ضعيف

        return 30; // استغلال ضعيف جداً
    }

    // ========================================
    // حساب درجة السعر
    // ========================================
    calculatePriceScore(shipment, trip) {
        const offerPrice = shipment.price_offer || 0;
        const tripPrice = (trip.price_per_kg || 0) * shipment.weight;

        if (!offerPrice || !tripPrice) return 50; // لا يوجد بيانات كافية

        const profitMargin = ((offerPrice - tripPrice) / offerPrice) * 100;

        if (profitMargin >= 30) return 100;        // ربح ممتاز
        if (profitMargin >= 20) return 90;         // ربح جيد جداً
        if (profitMargin >= 10) return 80;         // ربح جيد
        if (profitMargin >= 5) return 70;          // ربح مقبول
        if (profitMargin >= 0) return 50;          // ربح ضئيل
        if (profitMargin >= -10) return 30;        // خسارة بسيطة
        
        return 0; // خسارة كبيرة
    }

    // ========================================
    // حساب درجة توافق الأنواع
    // ========================================
    calculateTypeCompatibility(shipment, trip) {
        const shipperType = shipment.shipper_type || shipment.users?.shipper_type;
        const carrierType = trip.carrier_type || trip.users?.carrier_type;

        if (!shipperType || !carrierType) return 50;

        // مصفوفة التوافق المحسّنة
        const compatibility = {
            'individual': {
                'individual': 100,
                'car_owner': 90,
                'truck_owner': 70,
                'fleet_owner': 50
            },
            'small_business': {
                'individual': 70,
                'car_owner': 100,
                'truck_owner': 90,
                'fleet_owner': 80
            },
            'medium_business': {
                'individual': 40,
                'car_owner': 70,
                'truck_owner': 100,
                'fleet_owner': 95
            },
            'large_business': {
                'individual': 20,
                'car_owner': 50,
                'truck_owner': 90,
                'fleet_owner': 100
            },
            'enterprise': {
                'individual': 10,
                'car_owner': 30,
                'truck_owner': 80,
                'fleet_owner': 100
            }
        };

        return compatibility[shipperType]?.[carrierType] || 50;
    }

    // ========================================
    // حساب درجة التقييم
    // ========================================
    calculateRatingScore(trip) {
        const rating = trip.users?.rating || trip.rating || 0;
        const completedTrips = trip.users?.completed_trips || 0;

        let score = 0;

        // درجة التقييم (70%)
        if (rating >= 4.5) score += 70;
        else if (rating >= 4.0) score += 60;
        else if (rating >= 3.5) score += 50;
        else if (rating >= 3.0) score += 40;
        else score += 20;

        // عدد الرحلات المكتملة (30%)
        if (completedTrips >= 50) score += 30;
        else if (completedTrips >= 20) score += 25;
        else if (completedTrips >= 10) score += 20;
        else if (completedTrips >= 5) score += 15;
        else if (completedTrips >= 1) score += 10;

        return score;
    }

    // ========================================
    // حساب التشابه بين أسماء المدن
    // ========================================
    citySimilarity(city1, city2) {
        if (!city1 || !city2) return 0;

        const c1 = city1.toLowerCase().trim();
        const c2 = city2.toLowerCase().trim();

        // تطابق كامل
        if (c1 === c2) return 100;

        // إذا كانت إحداهما تحتوي على الأخرى
        if (c1.includes(c2) || c2.includes(c1)) return 85;

        // حساب Levenshtein distance للتطابق التقريبي
        const distance = this.levenshteinDistance(c1, c2);
        const maxLen = Math.max(c1.length, c2.length);
        const similarity = ((maxLen - distance) / maxLen) * 100;

        return Math.round(similarity);
    }

    // ========================================
    // فحص إذا كانت الشحنة على نفس المسار
    // ========================================
    isOnRoute(shipment, trip) {
        // في التطبيق الحقيقي، استخدم Google Maps API
        // هنا نستخدم منطقاً مبسطاً
        
        const tripPath = [trip.from_city, trip.to_city];
        const shipmentPath = [shipment.from_city, shipment.to_city];

        // فحص إذا كانت مدن الشحنة على مسار الرحلة
        return tripPath.some(city => 
            this.citySimilarity(city, shipmentPath[0]) > 70 ||
            this.citySimilarity(city, shipmentPath[1]) > 70
        );
    }

    // ========================================
    // حساب Levenshtein Distance
    // ========================================
    levenshteinDistance(str1, str2) {
        const m = str1.length;
        const n = str2.length;
        const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

        for (let i = 0; i <= m; i++) dp[i][0] = i;
        for (let j = 0; j <= n; j++) dp[0][j] = j;

        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                if (str1[i - 1] === str2[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1];
                } else {
                    dp[i][j] = Math.min(
                        dp[i - 1][j] + 1,      // حذف
                        dp[i][j - 1] + 1,      // إضافة
                        dp[i - 1][j - 1] + 1   // استبدال
                    );
                }
            }
        }

        return dp[m][n];
    }

    // ========================================
    // حساب المسافة التقريبية
    // ========================================
    calculateDistance(fromCity1, toCity1, fromCity2, toCity2) {
        // في الإنتاج، استخدم Google Distance Matrix API
        // هنا نستخدم حساباً تقريبياً بناءً على الإحداثيات إذا كانت متوفرة
        
        const city1From = this.getCityCoordinates(fromCity1);
        const city1To = this.getCityCoordinates(toCity1);
        const city2From = this.getCityCoordinates(fromCity2);
        const city2To = this.getCityCoordinates(toCity2);

        if (!city1From || !city1To || !city2From || !city2To) {
            return null; // لا تتوفر إحداثيات
        }

        // حساب المسافة باستخدام صيغة Haversine
        const distance = this.haversineDistance(
            city1From.latitude,
            city1From.longitude,
            city2From.latitude,
            city2From.longitude
        );

        return Math.round(distance);
    }

    // ========================================
    // الحصول على إحداثيات المدينة
    // ========================================
    getCityCoordinates(cityName) {
        const city = this.cities.find(c => 
            c.name_ar === cityName || c.name_en === cityName
        );
        return city ? { latitude: city.latitude, longitude: city.longitude } : null;
    }

    // ========================================
    // حساب المسافة باستخدام Haversine
    // ========================================
    haversineDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // نصف قطر الأرض بالكيلومتر
        
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return R * c;
    }

    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    // ========================================
    // تحديد مستوى التوافق بناءً على الدرجة
    // ========================================
    getCompatibilityLevel(score) {
        if (score >= 80) return { 
            level: 'excellent', 
            text: 'ممتاز', 
            textEn: 'Excellent',
            color: '#28a745',
            icon: 'fa-star'
        };
        if (score >= 60) return { 
            level: 'good', 
            text: 'جيد', 
            textEn: 'Good',
            color: '#007bff',
            icon: 'fa-thumbs-up'
        };
        if (score >= 40) return { 
            level: 'fair', 
            text: 'مقبول', 
            textEn: 'Fair',
            color: '#ffc107',
            icon: 'fa-check-circle'
        };
        return { 
            level: 'poor', 
            text: 'ضعيف', 
            textEn: 'Poor',
            color: '#dc3545',
            icon: 'fa-times-circle'
        };
    }


    // ========================================
    // إنشاء مطابقة جديدة في قاعدة البيانات
    // ========================================
    async createMatch(tripId, shipmentId, matchScore) {
        try {
            const { data, error } = await this.supabase
                .from('matches')
                .insert([{
                    trip_id: tripId,
                    shipment_id: shipmentId,
                    match_score: matchScore,
                    status: 'suggested',
                    created_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (error) {
                if (error.code === '23505') { // Unique constraint violation
                    console.log('✅ المطابقة موجودة بالفعل');
                    return { success: true, exists: true };
                }
                throw error;
            }

            console.log('✅ تم إنشاء مطابقة جديدة:', data.id);
            
            // إرسال إشعار للطرفين
            await this.sendMatchNotification(data);
            
            return { success: true, match: data };

        } catch (error) {
            console.error('❌ خطأ في إنشاء المطابقة:', error);
            return { success: false, error };
        }
    }

    // ========================================
    // إرسال إشعار بالمطابقة الجديدة
    // ========================================
    async sendMatchNotification(match) {
        try {
            // في الإنتاج، يمكن إرسال إشعارات عبر البريد الإلكتروني أو SMS
            // هنا سنخزنها في جدول الإشعارات
            
            console.log('📧 إرسال إشعار بالمطابقة:', match.id);
            
            // يمكن إضافة منطق إرسال الإشعارات هنا
            
        } catch (error) {
            console.error('خطأ في إرسال الإشعار:', error);
        }
    }

    // ========================================
    // جلب جميع المطابقات للمستخدم
    // ========================================
    async getUserMatches(userId, userType) {
        try {
            let query;
            
            if (userType === 'carrier') {
                query = this.supabase
                    .from('matches')
                    .select(`
                        *,
                        trips!inner (
                            *,
                            users!trips_user_id_fkey (name, phone, email, rating)
                        ),
                        shipments (
                            *,
                            users!shipments_user_id_fkey (name, phone, email, rating)
                        )
                    `)
                    .eq('trips.user_id', userId);
            } else {
                query = this.supabase
                    .from('matches')
                    .select(`
                        *,
                        trips (
                            *,
                            users!trips_user_id_fkey (name, phone, email, rating)
                        ),
                        shipments!inner (
                            *,
                            users!shipments_user_id_fkey (name, phone, email, rating)
                        )
                    `)
                    .eq('shipments.user_id', userId);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;

            return data || [];

        } catch (error) {
            console.error('خطأ في جلب مطابقات المستخدم:', error);
            return [];
        }
    }

    // ========================================
    // قبول مطابقة
    // ========================================
    async acceptMatch(matchId) {
        try {
            const { data, error } = await this.supabase
                .from('matches')
                .update({ 
                    status: 'accepted',
                    accepted_at: new Date().toISOString()
                })
                .eq('id', matchId)
                .select()
                .single();

            if (error) throw error;

            console.log('✅ تم قبول المطابقة:', matchId);
            return { success: true, match: data };

        } catch (error) {
            console.error('❌ خطأ في قبول المطابقة:', error);
            return { success: false, error };
        }
    }

    // ========================================
    // رفض مطابقة
    // ========================================
    async rejectMatch(matchId) {
        try {
            const { data, error } = await this.supabase
                .from('matches')
                .update({ 
                    status: 'rejected',
                    rejected_at: new Date().toISOString()
                })
                .eq('id', matchId)
                .select()
                .single();

            if (error) throw error;

            console.log('✅ تم رفض المطابقة:', matchId);
            return { success: true, match: data };

        } catch (error) {
            console.error('❌ خطأ في رفض المطابقة:', error);
            return { success: false, error };
        }
    }

    // ========================================
    // تشغيل المطابقة التلقائية
    // ========================================
    async runAutoMatching(type = 'all') {
        try {
            console.log('🤖 بدء المطابقة التلقائية...');
            
            let totalMatches = 0;

            if (type === 'all' || type === 'shipments') {
                // مطابقة الشحنات الجديدة
                const { data: shipments } = await this.supabase
                    .from('shipments')
                    .select('id')
                    .eq('status', 'pending');

                if (shipments) {
                    for (const shipment of shipments) {
                        const matches = await this.findMatchingTripsForShipment(shipment.id);
                        
                        // إنشاء أفضل 5 مطابقات
                        const topMatches = matches.slice(0, 5);
                        for (const match of topMatches) {
                            await this.createMatch(match.id, shipment.id, match.matchScore);
                            totalMatches++;
                        }
                    }
                }
            }

            if (type === 'all' || type === 'trips') {
                // مطابقة الرحلات الجديدة
                const { data: trips } = await this.supabase
                    .from('trips')
                    .select('id')
                    .eq('status', 'available');

                if (trips) {
                    for (const trip of trips) {
                        const matches = await this.findMatchingShipmentsForTrip(trip.id);
                        
                        // إنشاء أفضل 5 مطابقات
                        const topMatches = matches.slice(0, 5);
                        for (const match of topMatches) {
                            await this.createMatch(trip.id, match.id, match.matchScore);
                            totalMatches++;
                        }
                    }
                }
            }

            console.log(`✅ تم إنشاء ${totalMatches} مطابقة جديدة`);
            return { success: true, totalMatches };

        } catch (error) {
            console.error('❌ خطأ في المطابقة التلقائية:', error);
            return { success: false, error };
        }
    }

    // ========================================
    // وظائف التخزين المؤقت
    // ========================================
    getCachedResult(key) {
        const cached = this.matchCache.get(key);
        if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
            console.log('📦 استخدام النتيجة من التخزين المؤقت:', key);
            return cached.data;
        }
        return null;
    }

    setCachedResult(key, data) {
        this.matchCache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    clearCache() {
        this.matchCache.clear();
        console.log('🗑️ تم مسح التخزين المؤقت');
    }

    // ========================================
    // الحصول على قائمة المدن الافتراضية
    // ========================================
    getDefaultCities() {
        return [
            { name_ar: 'الرياض', name_en: 'Riyadh', latitude: 24.7136, longitude: 46.6753 },
            { name_ar: 'جدة', name_en: 'Jeddah', latitude: 21.5433, longitude: 39.1728 },
            { name_ar: 'الدمام', name_en: 'Dammam', latitude: 26.4207, longitude: 50.0888 },
            { name_ar: 'مكة المكرمة', name_en: 'Makkah', latitude: 21.4225, longitude: 39.8262 },
            { name_ar: 'المدينة المنورة', name_en: 'Madinah', latitude: 24.5247, longitude: 39.5692 },
            { name_ar: 'دبي', name_en: 'Dubai', latitude: 25.2048, longitude: 55.2708 },
            { name_ar: 'أبوظبي', name_en: 'Abu Dhabi', latitude: 24.4539, longitude: 54.3773 },
            { name_ar: 'الكويت', name_en: 'Kuwait City', latitude: 29.3759, longitude: 47.9774 },
            { name_ar: 'الدوحة', name_en: 'Doha', latitude: 25.2854, longitude: 51.5310 },
            { name_ar: 'المنامة', name_en: 'Manama', latitude: 26.2235, longitude: 50.5876 }
        ];
    }

    // ========================================
    // وظائف مساعدة
    // ========================================
    async waitForSupabase(timeout = 5000) {
        const start = Date.now();
        while (!window.supabaseClient && (Date.now() - start) < timeout) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        if (!window.supabaseClient) {
            throw new Error('Supabase client not available');
        }
        return true;
    }

    // إحصائيات المحرك
    getStats() {
        return {
            cacheSize: this.matchCache.size,
            citiesLoaded: this.cities.length,
            initialized: this.initialized
        };
    }
}

// ========================================
// تصدير وتهيئة
// ========================================
window.MatchingEngine = MatchingEngine;
window.matchingEngine = new MatchingEngine();

console.log('🚀 محرك المطابقة الذكي جاهز للعمل!');

