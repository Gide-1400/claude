/**
 * Smart Matching Engine - خوارزمية المطابقة الذكية
 * تربط الشحنات مع الرحلات المناسبة وتحسب درجة التطابق
 */

class MatchingEngine {
    constructor() {
        this.supabase = window.supabaseClient;
        this.currentUser = null;
        this.cities = this.loadCities();
        this.initialized = false;
        this.init();
    }

    async init() {
        try {
            // انتظار تحميل Supabase
            if (!window.supabaseClient) {
                await this.waitForSupabase();
                this.supabase = window.supabaseClient;
            }
            this.initialized = true;
            console.log('MatchingEngine: تم تهيئة محرك المطابقة بنجاح');
        } catch (error) {
            console.error('MatchingEngine: خطأ في التهيئة:', error);
        }
    }

    /**
     * البحث عن رحلات مناسبة للشحنة
     */
    async findMatchingTrips(shipmentId) {
        try {
            if (!this.initialized) await this.init();

            // جلب تفاصيل الشحنة
            const { data: shipment, error: shipmentError } = await this.supabase
                .from('shipments')
                .select('*')
                .eq('id', shipmentId)
                .single();

            if (shipmentError || !shipment) {
                throw new Error('لم يتم العثور على الشحنة');
            }

            // البحث عن الرحلات المناسبة
            const { data: trips, error: tripsError } = await this.supabase
                .from('trips')
                .select(`
                    *,
                    users (
                        id,
                        name,
                        phone,
                        carrier_type
                    )
                `)
                .eq('from_city', shipment.from_city)
                .eq('to_city', shipment.to_city)
                .eq('status', 'available')
                .gte('available_weight', shipment.weight)
                .gte('trip_date', shipment.needed_date);

            if (tripsError) {
                throw new Error('خطأ في البحث عن الرحلات');
            }

            // حساب درجة التطابق لكل رحلة
            const matchedTrips = trips.map(trip => {
                const matchScore = this.calculateMatchScore(shipment, trip);
                return {
                    ...trip,
                    matchScore,
                    compatibility: this.getCompatibilityLevel(matchScore)
                };
            });

            // ترتيب حسب درجة التطابق
            matchedTrips.sort((a, b) => b.matchScore - a.matchScore);

            console.log(`تم العثور على ${matchedTrips.length} رحلة مناسبة للشحنة ${shipmentId}`);
            return matchedTrips;

        } catch (error) {
            console.error('خطأ في البحث عن الرحلات المطابقة:', error);
            return [];
        }
    }

    /**
     * Find matching shipments for a carrier's trip
     * @param {Object} trip - The carrier's trip details
     * @returns {Array} - Array of matching shipments with scores
     */
    async findMatchingShipments(tripId) {
        try {
            if (!this.initialized) await this.init();

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
                        shipper_type
                    )
                `)
                .eq('from_city', trip.from_city)
                .eq('to_city', trip.to_city)
                .eq('status', 'pending')
                .lte('weight', trip.available_weight)
                .lte('needed_date', trip.trip_date);

            if (shipmentsError) {
                throw new Error('خطأ في البحث عن الشحنات');
            }

            // حساب درجة التطابق لكل شحنة
            const matchedShipments = shipments.map(shipment => {
                const matchScore = this.calculateMatchScore(shipment, trip);
                return {
                    ...shipment,
                    matchScore,
                    compatibility: this.getCompatibilityLevel(matchScore)
                };
            });

            // ترتيب حسب درجة التطابق
            matchedShipments.sort((a, b) => b.matchScore - a.matchScore);

            console.log(`تم العثور على ${matchedShipments.length} شحنة مناسبة للرحلة ${tripId}`);
            return matchedShipments;

            // Calculate match score for each shipment
            const matches = shipments
                .map(shipment => ({
                    ...shipment,
                    matchScore: this.calculateMatchScore(trip, shipment),
                    distance: this.calculateDistance(trip, shipment)
                }))
                .filter(match => match.matchScore > 30) // Minimum score threshold
                .sort((a, b) => b.matchScore - a.matchScore);

            return matches;

        } catch (error) {
            console.error('Error finding matching shipments:', error);
            return [];
        }
    }

    /**
     * Find matching trips for a shipper's shipment
     * @param {Object} shipment - The shipper's shipment details
     * @returns {Array} - Array of matching trips with scores
     */
    async findMatchingTrips(shipment) {
        try {
            if (!shipment) return [];

            // Get all available trips
            const { data: trips, error } = await this.supabase
                .from('trips')
                .select('*, users!inner(name, phone, email, carrier_type)')
                .eq('status', 'published')
                .eq('is_dummy', false)
                .gte('trip_date', new Date().toISOString().split('T')[0]);

            if (error) throw error;

            if (!trips || trips.length === 0) {
                return [];
            }

            // Calculate match score for each trip
            const matches = trips
                .map(trip => ({
                    ...trip,
                    matchScore: this.calculateMatchScore(trip, shipment),
                    distance: this.calculateDistance(trip, shipment)
                }))
                .filter(match => match.matchScore > 30) // Minimum score threshold
                .sort((a, b) => b.matchScore - a.matchScore);

            return matches;

        } catch (error) {
            console.error('Error finding matching trips:', error);
            return [];
        }
    }

    /**
     * Calculate match score between a trip and shipment
     * @param {Object} trip - Trip details
     * @param {Object} shipment - Shipment details
     * @returns {number} - Match score (0-100)
     */
    calculateMatchScore(trip, shipment) {
        let score = 0;

        // 1. Route Match (40 points)
        const routeScore = this.calculateRouteScore(trip, shipment);
        score += routeScore * 0.4;

        // 2. Date Match (30 points)
        const dateScore = this.calculateDateScore(trip, shipment);
        score += dateScore * 0.3;

        // 3. Capacity Match (20 points)
        const capacityScore = this.calculateCapacityScore(trip, shipment);
        score += capacityScore * 0.2;

        // 4. Carrier Type Match (10 points)
        const typeScore = this.calculateTypeScore(trip, shipment);
        score += typeScore * 0.1;

        return Math.round(score);
    }

    /**
     * Calculate route compatibility score
     */
    calculateRouteScore(trip, shipment) {
        const fromMatch = this.citySimilarity(trip.from_city, shipment.from_city);
        const toMatch = this.citySimilarity(trip.to_city, shipment.to_city);

        // Perfect match
        if (fromMatch >= 80 && toMatch >= 80) {
            return 100;
        }

        // Partial match (same destination or origin)
        if (toMatch >= 80) {
            return 70;
        }

        if (fromMatch >= 80) {
            return 60;
        }

        // Check if shipment route is within trip route
        if (this.isRouteCompatible(trip, shipment)) {
            return 50;
        }

        return 0;
    }

    /**
     * Calculate date compatibility score
     */
    calculateDateScore(trip, shipment) {
        const tripDate = new Date(trip.trip_date);
        const shipmentDate = new Date(shipment.needed_date);

        const diffDays = Math.abs((tripDate - shipmentDate) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 100; // Same day
        if (diffDays <= 1) return 90;   // 1 day difference
        if (diffDays <= 3) return 70;   // 3 days difference
        if (diffDays <= 7) return 50;   // 1 week difference
        if (diffDays <= 14) return 30;  // 2 weeks difference

        return 0;
    }

    /**
     * Calculate capacity compatibility score
     */
    calculateCapacityScore(trip, shipment) {
        const availableWeight = trip.available_weight || 0;
        const neededWeight = shipment.weight || 0;

        if (neededWeight > availableWeight) {
            return 0; // Cannot accommodate
        }

        // Perfect fit (80-100% utilization)
        const utilization = (neededWeight / availableWeight) * 100;
        
        if (utilization >= 80) return 100;
        if (utilization >= 60) return 90;
        if (utilization >= 40) return 80;
        if (utilization >= 20) return 70;
        
        return 50; // Low utilization but still possible
    }

    /**
     * Calculate carrier type compatibility score
     */
    calculateTypeScore(trip, shipment) {
        const carrierType = trip.carrier_type || trip.users?.carrier_type;
        const shipperType = shipment.shipper_type;

        // Type compatibility matrix
        const compatibility = {
            'individual': ['individual', 'small_business'],
            'car_owner': ['individual', 'small_business', 'medium_business'],
            'truck_owner': ['small_business', 'medium_business', 'large_business'],
            'fleet_owner': ['medium_business', 'large_business', 'enterprise']
        };

        if (compatibility[carrierType]?.includes(shipperType)) {
            return 100;
        }

        return 50; // Still possible but not ideal
    }

    /**
     * Calculate city name similarity
     */
    citySimilarity(city1, city2) {
        if (!city1 || !city2) return 0;

        const c1 = city1.toLowerCase().trim();
        const c2 = city2.toLowerCase().trim();

        if (c1 === c2) return 100;

        // Check if one contains the other
        if (c1.includes(c2) || c2.includes(c1)) return 80;

        // Levenshtein distance for fuzzy matching
        const distance = this.levenshteinDistance(c1, c2);
        const maxLen = Math.max(c1.length, c2.length);
        const similarity = ((maxLen - distance) / maxLen) * 100;

        return Math.round(similarity);
    }

    /**
     * Check if shipment route is compatible with trip route
     */
    isRouteCompatible(trip, shipment) {
        // In a real implementation, this would use a map API
        // For now, we'll do a simple check
        
        // If trip passes through shipment's origin and destination
        // This is a simplified version
        const tripPath = [trip.from_city, trip.to_city];
        const shipmentPath = [shipment.from_city, shipment.to_city];

        // Check if shipment's cities are on the trip's route
        return tripPath.some(city => 
            this.citySimilarity(city, shipmentPath[0]) > 70 ||
            this.citySimilarity(city, shipmentPath[1]) > 70
        );
    }

    /**
     * Calculate Levenshtein distance between two strings
     */
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
                        dp[i - 1][j] + 1,
                        dp[i][j - 1] + 1,
                        dp[i - 1][j - 1] + 1
                    );
                }
            }
        }

        return dp[m][n];
    }

    /**
     * Calculate approximate distance between two cities
     * In production, use a real distance calculation API
     */
    /**
     * حساب درجة التطابق بين الشحنة والرحلة
     */
    calculateMatchScore(shipment, trip) {
        let score = 0;

        // تطابق المدن (50 نقطة)
        if (shipment.from_city === trip.from_city && shipment.to_city === trip.to_city) {
            score += 50;
        }

        // تطابق التاريخ (25 نقطة)
        const shipmentDate = new Date(shipment.needed_date);
        const tripDate = new Date(trip.trip_date);
        const daysDiff = Math.abs((tripDate - shipmentDate) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 0) {
            score += 25; // نفس اليوم
        } else if (daysDiff <= 3) {
            score += 20; // خلال 3 أيام
        } else if (daysDiff <= 7) {
            score += 15; // خلال أسبوع
        } else if (daysDiff <= 14) {
            score += 10; // خلال أسبوعين
        }

        // تطابق الوزن (15 نقطة)
        if (trip.available_weight >= shipment.weight) {
            const weightRatio = shipment.weight / trip.available_weight;
            if (weightRatio >= 0.8) {
                score += 15; // استغلال ممتاز للمساحة
            } else if (weightRatio >= 0.5) {
                score += 12; // استغلال جيد
            } else if (weightRatio >= 0.2) {
                score += 8; // استغلال مقبول
            } else {
                score += 5; // استغلال ضعيف
            }
        }

        // تطابق نوع الناقل/الشاحن (10 نقاط)
        if (this.isCompatibleType(shipment.shipper_type, trip.carrier_type)) {
            score += 10;
        }

        return Math.min(score, 100); // الحد الأقصى 100
    }

    /**
     * تحديد مستوى التوافق بناءً على الدرجة
     */
    getCompatibilityLevel(score) {
        if (score >= 80) return { level: 'excellent', text: 'ممتاز', color: '#28a745' };
        if (score >= 60) return { level: 'good', text: 'جيد', color: '#007bff' };
        if (score >= 40) return { level: 'fair', text: 'مقبول', color: '#ffc107' };
        return { level: 'poor', text: 'ضعيف', color: '#dc3545' };
    }

    /**
     * فحص توافق أنواع الناقل والشاحن
     */
    isCompatibleType(shipperType, carrierType) {
        const compatibility = {
            'individual': ['individual', 'car_owner'],
            'small_business': ['car_owner', 'truck_owner'],
            'medium_business': ['truck_owner', 'fleet_owner'],
            'large_business': ['fleet_owner'],
            'enterprise': ['fleet_owner']
        };

        return compatibility[shipperType]?.includes(carrierType) || false;
    }

    /**
     * إنشاء مطابقة جديدة في قاعدة البيانات
     */
    async createMatch(tripId, shipmentId, matchScore) {
        try {
            const { data, error } = await this.supabase
                .from('matches')
                .insert([{
                    trip_id: tripId,
                    shipment_id: shipmentId,
                    match_score: matchScore,
                    status: 'suggested'
                }])
                .select()
                .single();

            if (error) {
                if (error.code === '23505') { // Unique constraint violation
                    console.log('المطابقة موجودة بالفعل');
                    return { success: true, exists: true };
                }
                throw error;
            }

            console.log('تم إنشاء مطابقة جديدة:', data.id);
            return { success: true, match: data };

        } catch (error) {
            console.error('خطأ في إنشاء المطابقة:', error);
            return { success: false, error };
        }
    }

    /**
     * جلب جميع المطابقات للمستخدم
     */
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
                            users (name, phone)
                        ),
                        shipments (
                            *,
                            users (name, phone)
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
                            users (name, phone)
                        ),
                        shipments!inner (
                            *,
                            users (name, phone)
                        )
                    `)
                    .eq('shipments.user_id', userId);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;

            return data;

        } catch (error) {
            console.error('خطأ في جلب مطابقات المستخدم:', error);
            return [];
        }
    }

    // وظائف مساعدة
    async waitForSupabase(timeout = 5000) {
        const start = Date.now();
        while (!window.supabaseClient && (Date.now() - start) < timeout) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return !!window.supabaseClient;
    }

    loadCities() {
        // قائمة بالمدن العالمية
        return [
            'الرياض', 'جدة', 'الدمام', 'مكة المكرمة', 'المدينة المنورة',
            'دبي', 'أبوظبي', 'الكويت', 'الدوحة', 'المنامة', 'مسقط',
            'لندن', 'باريس', 'برلين', 'روما', 'مدريد',
            'نيويورك', 'لوس أنجلوس', 'تورونتو', 'طوكيو', 'بكين'
        ];
    }
}

// Initialize and export
window.MatchingEngine = MatchingEngine;
window.matchingEngine = new MatchingEngine();
