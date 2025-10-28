// Advanced Matching Engine for Fast Shipment Platform
// محرك المطابقة المتقدم لمنصة الشحنة السريعة

class MatchingEngine {
    constructor() {
        this.supabase = window.supabaseClient;
        
        // Advanced scoring weights
        this.weights = {
            route: 0.35,          // 35% for route matching
            date: 0.25,           // 25% for date compatibility
            capacity: 0.20,       // 20% for capacity utilization
            price: 0.10,          // 10% for price competitiveness
            rating: 0.05,         // 5% for user rating
            verification: 0.05    // 5% for verification status
        };
        
        // Configuration
        this.config = {
            minMatchScore: 65,           // Minimum score for suggestion
            excellentMatchScore: 90,     // Score for excellent match
            goodMatchScore: 75,          // Score for good match
            maxDistanceDeviation: 50,    // Max deviation in km for route
            maxDateDifference: 7,        // Max days difference
            optimalCapacityUtilization: 0.8  // 80% capacity is optimal
        };
        
        // Cache for performance
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }
    
    // Main matching function for trips
    async findMatchesForTrip(tripId, options = {}) {
        try {
            // Check cache first
            const cacheKey = `trip_${tripId}_${JSON.stringify(options)}`;
            if (this.cache.has(cacheKey)) {
                const cached = this.cache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.cacheTimeout) {
                    return cached.data;
                }
            }
            
            // Load trip data with user info
            const trip = await this.getTripWithDetails(tripId);
            if (!trip) {
                throw new Error('Trip not found');
            }
            
            // Get potential shipments
            const potentialShipments = await this.getPotentialShipments(trip, options);
            
            // Calculate matches with parallel processing
            const matches = await Promise.all(
                potentialShipments.map(async (shipment) => {
                    const score = await this.calculateAdvancedScore(trip, shipment);
                    
                    if (score >= this.config.minMatchScore) {
                        return {
                            id: `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                            trip_id: tripId,
                            shipment_id: shipment.id,
                            match_score: score,
                            match_quality: this.getMatchQuality(score),
                            status: 'suggested',
                            reasons: this.getDetailedMatchReasons(trip, shipment, score),
                            estimated_profit: this.calculateEstimatedProfit(trip, shipment),
                            compatibility_details: await this.getCompatibilityDetails(trip, shipment),
                            created_at: new Date().toISOString()
                        };
                    }
                    return null;
                })
            );
            
            // Filter and sort matches
            const validMatches = matches
                .filter(m => m !== null)
                .sort((a, b) => b.match_score - a.match_score)
                .slice(0, options.limit || 20);
            
            // Cache the results
            this.cache.set(cacheKey, {
                timestamp: Date.now(),
                data: validMatches
            });
            
            // Save top matches to database if requested
            if (options.saveToDatabase && validMatches.length > 0) {
                await this.saveMatchesToDatabase(validMatches.slice(0, 5));
            }
            
            return validMatches;
            
        } catch (error) {
            console.error('Error finding matches for trip:', error);
            return [];
        }
    }
    
    // Main matching function for shipments
    async findMatchesForShipment(shipmentId, options = {}) {
        try {
            // Similar implementation for shipments
            const shipment = await this.getShipmentWithDetails(shipmentId);
            if (!shipment) {
                throw new Error('Shipment not found');
            }
            
            const potentialTrips = await this.getPotentialTrips(shipment, options);
            
            const matches = await Promise.all(
                potentialTrips.map(async (trip) => {
                    const score = await this.calculateAdvancedScore(trip, shipment);
                    
                    if (score >= this.config.minMatchScore) {
                        return {
                            id: `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                            trip_id: trip.id,
                            shipment_id: shipmentId,
                            match_score: score,
                            match_quality: this.getMatchQuality(score),
                            status: 'suggested',
                            reasons: this.getDetailedMatchReasons(trip, shipment, score),
                            estimated_delivery_time: this.calculateEstimatedDeliveryTime(trip, shipment),
                            compatibility_details: await this.getCompatibilityDetails(trip, shipment),
                            created_at: new Date().toISOString()
                        };
                    }
                    return null;
                })
            );
            
            return matches
                .filter(m => m !== null)
                .sort((a, b) => b.match_score - a.match_score)
                .slice(0, options.limit || 20);
                
        } catch (error) {
            console.error('Error finding matches for shipment:', error);
            return [];
        }
    }
    
    // Advanced scoring algorithm
    async calculateAdvancedScore(trip, shipment) {
        let totalScore = 0;
        
        // Route matching with geographic calculation
        const routeScore = await this.calculateRouteScore(trip, shipment);
        totalScore += routeScore * this.weights.route;
        
        // Date compatibility with flexibility analysis
        const dateScore = this.calculateDateScore(trip, shipment);
        totalScore += dateScore * this.weights.date;
        
        // Capacity optimization
        const capacityScore = this.calculateCapacityScore(trip, shipment);
        totalScore += capacityScore * this.weights.capacity;
        
        // Price competitiveness
        const priceScore = this.calculatePriceScore(trip, shipment);
        totalScore += priceScore * this.weights.price;
        
        // User rating bonus
        const ratingScore = this.calculateRatingScore(trip, shipment);
        totalScore += ratingScore * this.weights.rating;
        
        // Verification status bonus
        const verificationScore = this.calculateVerificationScore(trip, shipment);
        totalScore += verificationScore * this.weights.verification;
        
        // Apply boost factors
        totalScore = this.applyBoostFactors(totalScore, trip, shipment);
        
        return Math.min(Math.round(totalScore), 100);
    }
    
    // Enhanced route scoring with geographic calculations
    async calculateRouteScore(trip, shipment) {
        // Exact city match
        if (trip.from_city === shipment.from_city && 
            trip.to_city === shipment.to_city) {
            return 100;
        }
        
        // Check if locations are available
        if (trip.start_location && trip.end_location &&
            shipment.origin_location && shipment.destination_location) {
            
            // Calculate geographic distances
            const originDistance = this.calculateDistance(
                trip.start_location,
                shipment.origin_location
            );
            
            const destinationDistance = this.calculateDistance(
                trip.end_location,
                shipment.destination_location
            );
            
            // Score based on proximity
            let score = 100;
            score -= (originDistance / this.config.maxDistanceDeviation) * 20;
            score -= (destinationDistance / this.config.maxDistanceDeviation) * 20;
            
            return Math.max(score, 0);
        }
        
        // Country-level matching
        if (trip.from_country === shipment.from_country &&
            trip.to_country === shipment.to_country) {
            
            // Same country, check if cities are on the route
            if (await this.checkCitiesOnRoute(trip, shipment)) {
                return 75;
            }
            return 50;
        }
        
        // International compatibility
        if (this.checkInternationalCompatibility(trip, shipment)) {
            return 40;
        }
        
        return 0;
    }
    
    // Enhanced date scoring with flexibility
    calculateDateScore(trip, shipment) {
        const tripDate = new Date(trip.trip_date);
        const shipmentDate = new Date(shipment.needed_date);
        const daysDiff = Math.abs(tripDate - shipmentDate) / (1000 * 60 * 60 * 24);
        
        // Consider flexibility if provided
        const flexibility = shipment.date_flexibility || 0;
        const effectiveDiff = Math.max(0, daysDiff - flexibility);
        
        if (effectiveDiff === 0) return 100;
        if (effectiveDiff <= 1) return 90;
        if (effectiveDiff <= 2) return 80;
        if (effectiveDiff <= 3) return 70;
        if (effectiveDiff <= 5) return 50;
        if (effectiveDiff <= 7) return 30;
        
        return 0;
    }
    
    // Optimized capacity scoring
    calculateCapacityScore(trip, shipment) {
        const availableWeight = trip.available_weight || 0;
        const neededWeight = shipment.weight || 0;
        
        if (neededWeight === 0 || availableWeight === 0) {
            return 50; // Neutral score if no weight info
        }
        
        const utilization = neededWeight / availableWeight;
        
        // Perfect utilization around 80%
        if (utilization >= 0.7 && utilization <= 0.9) {
            return 100;
        }
        
        // Good utilization
        if (utilization >= 0.5 && utilization < 0.7) {
            return 85;
        }
        
        if (utilization >= 0.9 && utilization <= 1.0) {
            return 85;
        }
        
        // Acceptable utilization
        if (utilization >= 0.3 && utilization < 0.5) {
            return 70;
        }
        
        // Low utilization
        if (utilization > 0 && utilization < 0.3) {
            return 50;
        }
        
        // Over capacity
        if (utilization > 1.0) {
            return Math.max(0, 100 - (utilization - 1) * 100);
        }
        
        return 0;
    }
    
    // Dynamic price scoring
    calculatePriceScore(trip, shipment) {
        if (!trip.price_per_kg || !shipment.max_price_per_kg) {
            return 70; // Neutral score if no price info
        }
        
        const tripPrice = trip.price_per_kg;
        const maxPrice = shipment.max_price_per_kg;
        
        if (tripPrice <= maxPrice) {
            // Better score for competitive prices
            const savings = ((maxPrice - tripPrice) / maxPrice) * 100;
            return Math.min(100, 70 + savings * 0.3);
        } else {
            // Penalize based on how much over budget
            const overBudget = ((tripPrice - maxPrice) / maxPrice) * 100;
            return Math.max(0, 70 - overBudget);
        }
    }
    
    // User rating score
    calculateRatingScore(trip, shipment) {
        const tripUserRating = trip.user?.rating || 0;
        const shipmentUserRating = shipment.user?.rating || 0;
        
        const avgRating = (tripUserRating + shipmentUserRating) / 2;
        
        // Convert 5-star rating to 100-point score
        return (avgRating / 5) * 100;
    }
    
    // Verification status score
    calculateVerificationScore(trip, shipment) {
        let score = 0;
        
        if (trip.user?.is_verified) score += 50;
        if (shipment.user?.is_verified) score += 50;
        
        return score;
    }
    
    // Apply boost factors for special conditions
    applyBoostFactors(baseScore, trip, shipment) {
        let boostedScore = baseScore;
        
        // Urgent shipment boost
        if (shipment.is_urgent) {
            boostedScore *= 1.1;
        }
        
        // Premium user boost
        if (trip.user?.is_premium || shipment.user?.is_premium) {
            boostedScore *= 1.05;
        }
        
        // Same company boost
        if (trip.user?.company_id === shipment.user?.company_id) {
            boostedScore *= 1.15;
        }
        
        // Repeat customer boost
        if (trip.previous_matches_with_shipper > 0) {
            boostedScore *= 1.1;
        }
        
        return Math.min(boostedScore, 100);
    }
    
    // Get match quality label
    getMatchQuality(score) {
        if (score >= this.config.excellentMatchScore) {
            return { label: 'ممتاز', color: '#2DCE89', icon: 'star' };
        } else if (score >= this.config.goodMatchScore) {
            return { label: 'جيد جداً', color: '#5E72E4', icon: 'thumbs-up' };
        } else if (score >= this.config.minMatchScore) {
            return { label: 'جيد', color: '#11CDEF', icon: 'check' };
        } else {
            return { label: 'مقبول', color: '#FB6340', icon: 'info' };
        }
    }
    
    // Get detailed match reasons with scores
    getDetailedMatchReasons(trip, shipment, score) {
        const reasons = [];
        const quality = this.getMatchQuality(score);
        
        reasons.push({
            type: 'overall',
            text: `مطابقة ${quality.label} بنسبة ${score}%`,
            icon: quality.icon,
            color: quality.color
        });
        
        // Route matching
        if (trip.from_city === shipment.from_city && 
            trip.to_city === shipment.to_city) {
            reasons.push({
                type: 'route',
                text: 'نفس المسار بالضبط',
                icon: 'route',
                color: '#2DCE89'
            });
        }
        
        // Date matching
        const tripDate = new Date(trip.trip_date);
        const shipmentDate = new Date(shipment.needed_date);
        const daysDiff = Math.abs(tripDate - shipmentDate) / (1000 * 60 * 60 * 24);
        
        if (daysDiff === 0) {
            reasons.push({
                type: 'date',
                text: 'نفس يوم التسليم',
                icon: 'calendar-check',
                color: '#2DCE89'
            });
        } else if (daysDiff <= 2) {
            reasons.push({
                type: 'date',
                text: `فرق ${Math.round(daysDiff)} يوم فقط`,
                icon: 'calendar',
                color: '#11CDEF'
            });
        }
        
        // Capacity matching
        if (shipment.weight <= trip.available_weight) {
            const utilization = (shipment.weight / trip.available_weight) * 100;
            reasons.push({
                type: 'capacity',
                text: `استخدام ${Math.round(utilization)}% من السعة`,
                icon: 'weight',
                color: utilization >= 70 ? '#2DCE89' : '#11CDEF'
            });
        }
        
        // Price advantage
        if (trip.price_per_kg && shipment.max_price_per_kg) {
            if (trip.price_per_kg < shipment.max_price_per_kg) {
                const savings = shipment.max_price_per_kg - trip.price_per_kg;
                reasons.push({
                    type: 'price',
                    text: `توفير ${savings} ريال لكل كجم`,
                    icon: 'dollar-sign',
                    color: '#2DCE89'
                });
            }
        }
        
        // User ratings
        if (trip.user?.rating >= 4.5 || shipment.user?.rating >= 4.5) {
            reasons.push({
                type: 'rating',
                text: 'تقييم عالي للمستخدمين',
                icon: 'star',
                color: '#FFD700'
            });
        }
        
        // Verification
        if (trip.user?.is_verified && shipment.user?.is_verified) {
            reasons.push({
                type: 'verification',
                text: 'كلا الطرفين موثقين',
                icon: 'check-circle',
                color: '#2DCE89'
            });
        }
        
        return reasons;
    }
    
    // Calculate compatibility details
    async getCompatibilityDetails(trip, shipment) {
        return {
            route: {
                compatible: trip.from_city === shipment.from_city && 
                           trip.to_city === shipment.to_city,
                distance_difference: await this.calculateRouteDeviation(trip, shipment)
            },
            schedule: {
                flexible: shipment.date_flexibility > 0,
                days_difference: Math.abs(
                    new Date(trip.trip_date) - new Date(shipment.needed_date)
                ) / (1000 * 60 * 60 * 24)
            },
            capacity: {
                sufficient: shipment.weight <= trip.available_weight,
                utilization_percentage: (shipment.weight / trip.available_weight) * 100
            },
            price: {
                within_budget: !trip.price_per_kg || !shipment.max_price_per_kg || 
                              trip.price_per_kg <= shipment.max_price_per_kg,
                price_difference: trip.price_per_kg && shipment.max_price_per_kg ? 
                                 shipment.max_price_per_kg - trip.price_per_kg : 0
            }
        };
    }
    
    // Calculate estimated profit for carrier
    calculateEstimatedProfit(trip, shipment) {
        if (!trip.price_per_kg || !shipment.weight) {
            return null;
        }
        
        const revenue = trip.price_per_kg * shipment.weight;
        const estimatedCost = revenue * 0.7; // Assume 70% cost
        const profit = revenue - estimatedCost;
        
        return {
            revenue,
            estimatedCost,
            profit,
            margin: (profit / revenue) * 100
        };
    }
    
    // Calculate estimated delivery time
    calculateEstimatedDeliveryTime(trip, shipment) {
        const tripDate = new Date(trip.trip_date);
        const distance = this.estimateDistance(trip.from_city, trip.to_city);
        const avgSpeed = trip.carrier_type === 'express' ? 80 : 60; // km/h
        const estimatedHours = distance / avgSpeed;
        const estimatedDays = Math.ceil(estimatedHours / 24);
        
        const deliveryDate = new Date(tripDate);
        deliveryDate.setDate(deliveryDate.getDate() + estimatedDays);
        
        return {
            estimatedDays,
            deliveryDate: deliveryDate.toISOString(),
            isOnTime: deliveryDate <= new Date(shipment.needed_date)
        };
    }
    
    // Helper: Calculate distance between two geographic points
    calculateDistance(point1, point2) {
        // Haversine formula for geographic distance
        const R = 6371; // Earth's radius in km
        const lat1 = point1.lat * Math.PI / 180;
        const lat2 = point2.lat * Math.PI / 180;
        const deltaLat = (point2.lat - point1.lat) * Math.PI / 180;
        const deltaLng = (point2.lng - point1.lng) * Math.PI / 180;
        
        const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
                  Math.cos(lat1) * Math.cos(lat2) *
                  Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return R * c;
    }
    
    // Helper: Estimate distance between cities
    estimateDistance(fromCity, toCity) {
        // In production, use actual distance data
        const distances = {
            'الرياض-جدة': 950,
            'الرياض-الدمام': 400,
            'جدة-مكة': 80,
            'مكة-المدينة': 450
        };
        
        const key = `${fromCity}-${toCity}`;
        const reverseKey = `${toCity}-${fromCity}`;
        
        return distances[key] || distances[reverseKey] || 500; // Default 500km
    }
    
    // Helper: Check if cities are on the route
    async checkCitiesOnRoute(trip, shipment) {
        // In production, use routing API
        // For now, simple check
        return trip.from_country === shipment.from_country &&
               trip.to_country === shipment.to_country;
    }
    
    // Helper: Calculate route deviation
    async calculateRouteDeviation(trip, shipment) {
        if (!trip.start_location || !shipment.origin_location) {
            return null;
        }
        
        const originDist = this.calculateDistance(
            trip.start_location,
            shipment.origin_location
        );
        
        const destDist = this.calculateDistance(
            trip.end_location,
            shipment.destination_location
        );
        
        return originDist + destDist;
    }
    
    // Helper: Check international compatibility
    checkInternationalCompatibility(trip, shipment) {
        return (trip.from_country === shipment.from_country ||
                trip.to_country === shipment.to_country) &&
                trip.accepts_international === true;
    }
    
    // Database operations
    async getTripWithDetails(tripId) {
        const { data, error } = await this.supabase
            .from('trips')
            .select(`
                *,
                user:users!trips_user_id_fkey(
                    id,
                    name,
                    rating,
                    is_verified,
                    is_premium,
                    company_id
                )
            `)
            .eq('id', tripId)
            .single();
        
        if (error) {
            console.error('Error fetching trip:', error);
            return null;
        }
        
        return data;
    }
    
    async getShipmentWithDetails(shipmentId) {
        const { data, error } = await this.supabase
            .from('shipments')
            .select(`
                *,
                user:users!shipments_user_id_fkey(
                    id,
                    name,
                    rating,
                    is_verified,
                    is_premium,
                    company_id
                )
            `)
            .eq('id', shipmentId)
            .single();
        
        if (error) {
            console.error('Error fetching shipment:', error);
            return null;
        }
        
        return data;
    }
    
    async getPotentialShipments(trip, options = {}) {
        let query = this.supabase
            .from('shipments')
            .select(`
                *,
                user:users!shipments_user_id_fkey(
                    id,
                    name,
                    rating,
                    is_verified,
                    is_premium
                )
            `)
            .eq('status', 'pending')
            .eq('is_dummy', false);
        
        // Apply filters
        if (options.strictRoute) {
            query = query
                .eq('from_city', trip.from_city)
                .eq('to_city', trip.to_city);
        } else {
            query = query
                .eq('from_country', trip.from_country)
                .eq('to_country', trip.to_country);
        }
        
        // Date range filter
        const dateRange = options.dateRange || 7;
        const tripDate = new Date(trip.trip_date);
        const minDate = new Date(tripDate);
        minDate.setDate(minDate.getDate() - dateRange);
        const maxDate = new Date(tripDate);
        maxDate.setDate(maxDate.getDate() + dateRange);
        
        query = query
            .gte('needed_date', minDate.toISOString())
            .lte('needed_date', maxDate.toISOString());
        
        // Weight filter
        if (trip.available_weight) {
            query = query.lte('weight', trip.available_weight);
        }
        
        // Limit results
        query = query.limit(options.maxResults || 100);
        
        const { data, error } = await query;
        
        if (error) {
            console.error('Error fetching potential shipments:', error);
            return [];
        }
        
        return data || [];
    }
    
    async getPotentialTrips(shipment, options = {}) {
        let query = this.supabase
            .from('trips')
            .select(`
                *,
                user:users!trips_user_id_fkey(
                    id,
                    name,
                    rating,
                    is_verified,
                    is_premium
                )
            `)
            .eq('status', 'published')
            .eq('is_dummy', false);
        
        // Apply filters
        if (options.strictRoute) {
            query = query
                .eq('from_city', shipment.from_city)
                .eq('to_city', shipment.to_city);
        } else {
            query = query
                .eq('from_country', shipment.from_country)
                .eq('to_country', shipment.to_country);
        }
        
        // Date filter
        const dateRange = options.dateRange || 7;
        const shipmentDate = new Date(shipment.needed_date);
        const minDate = new Date(shipmentDate);
        minDate.setDate(minDate.getDate() - dateRange);
        const maxDate = new Date(shipmentDate);
        maxDate.setDate(maxDate.getDate() + dateRange);
        
        query = query
            .gte('trip_date', minDate.toISOString())
            .lte('trip_date', maxDate.toISOString());
        
        // Weight filter
        if (shipment.weight) {
            query = query.gte('available_weight', shipment.weight);
        }
        
        // Limit results
        query = query.limit(options.maxResults || 100);
        
        const { data, error } = await query;
        
        if (error) {
            console.error('Error fetching potential trips:', error);
            return [];
        }
        
        return data || [];
    }
    
    async saveMatchesToDatabase(matches) {
        try {
            const { data, error } = await this.supabase
                .from('matches')
                .insert(matches.map(m => ({
                    trip_id: m.trip_id,
                    shipment_id: m.shipment_id,
                    match_score: m.match_score,
                    status: m.status,
                    metadata: {
                        quality: m.match_quality,
                        reasons: m.reasons,
                        compatibility: m.compatibility_details,
                        estimated_profit: m.estimated_profit
                    }
                })))
                .select();
            
            if (error) {
                console.error('Error saving matches:', error);
                return null;
            }
            
            return data;
        } catch (error) {
            console.error('Error in saveMatchesToDatabase:', error);
            return null;
        }
    }
    
    // Real-time match monitoring
    startRealtimeMatching(userId, userType) {
        if (!this.supabase) return;
        
        const channel = this.supabase
            .channel('matches-monitor')
            .on('postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: userType === 'carrier' ? 'shipments' : 'trips'
                },
                async (payload) => {
                    // Auto-match new entries
                    if (userType === 'carrier') {
                        // Find matches for user's trips with new shipment
                        const userTrips = await this.getUserActiveTrips(userId);
                        for (const trip of userTrips) {
                            const matches = await this.findMatchesForTrip(trip.id, {
                                specificShipment: payload.new.id
                            });
                            if (matches.length > 0) {
                                this.notifyNewMatches(matches);
                            }
                        }
                    } else {
                        // Find matches for user's shipments with new trip
                        const userShipments = await this.getUserActiveShipments(userId);
                        for (const shipment of userShipments) {
                            const matches = await this.findMatchesForShipment(shipment.id, {
                                specificTrip: payload.new.id
                            });
                            if (matches.length > 0) {
                                this.notifyNewMatches(matches);
                            }
                        }
                    }
                }
            )
            .subscribe();
        
        return channel;
    }
    
    // Helper: Get user's active trips
    async getUserActiveTrips(userId) {
        const { data } = await this.supabase
            .from('trips')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'published')
            .eq('is_dummy', false);
        
        return data || [];
    }
    
    // Helper: Get user's active shipments
    async getUserActiveShipments(userId) {
        const { data } = await this.supabase
            .from('shipments')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'pending')
            .eq('is_dummy', false);
        
        return data || [];
    }
    
    // Notify about new matches
    notifyNewMatches(matches) {
        // Trigger notification
        if (window.notificationSystem) {
            window.notificationSystem.showNotification({
                title: 'مطابقات جديدة!',
                message: `تم العثور على ${matches.length} مطابقة جديدة`,
                type: 'success',
                action: {
                    label: 'عرض',
                    callback: () => {
                        window.location.href = '/pages/matches.html';
                    }
                }
            });
        }
        
        // Update UI if on matches page
        if (window.matchesUI) {
            window.matchesUI.addNewMatches(matches);
        }
    }
    
    // Accept a match
    async acceptMatch(matchId) {
        try {
            const { data, error } = await this.supabase
                .from('matches')
                .update({ 
                    status: 'accepted',
                    accepted_at: new Date().toISOString()
                })
                .eq('id', matchId)
                .select();
            
            if (error) throw error;
            
            // Notify the other party
            if (data && data[0]) {
                await this.notifyMatchAccepted(data[0]);
            }
            
            return data;
        } catch (error) {
            console.error('Error accepting match:', error);
            return null;
        }
    }
    
    // Reject a match
    async rejectMatch(matchId, reason = '') {
        try {
            const { data, error } = await this.supabase
                .from('matches')
                .update({ 
                    status: 'rejected',
                    rejection_reason: reason,
                    rejected_at: new Date().toISOString()
                })
                .eq('id', matchId)
                .select();
            
            if (error) throw error;
            
            return data;
        } catch (error) {
            console.error('Error rejecting match:', error);
            return null;
        }
    }
    
    // Notify match accepted
    async notifyMatchAccepted(match) {
        // Send notification through Supabase
        const { error } = await this.supabase
            .from('notifications')
            .insert({
                user_id: match.shipment.user_id,
                type: 'match_accepted',
                title: 'تم قبول المطابقة',
                message: `تم قبول طلب الشحن الخاص بك من قبل الموصل`,
                metadata: {
                    match_id: match.id,
                    trip_id: match.trip_id,
                    shipment_id: match.shipment_id
                }
            });
        
        if (error) {
            console.error('Error sending notification:', error);
        }
    }
    
    // Get match statistics
    async getMatchStatistics(userId) {
        try {
            // Total matches
            const { count: totalMatches } = await this.supabase
                .from('matches')
                .select('*', { count: 'exact', head: true })
                .or(`trips.user_id.eq.${userId},shipments.user_id.eq.${userId}`);
            
            // Accepted matches
            const { count: acceptedMatches } = await this.supabase
                .from('matches')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'accepted')
                .or(`trips.user_id.eq.${userId},shipments.user_id.eq.${userId}`);
            
            // Average match score
            const { data: scoreData } = await this.supabase
                .from('matches')
                .select('match_score')
                .or(`trips.user_id.eq.${userId},shipments.user_id.eq.${userId}`);
            
            const avgScore = scoreData && scoreData.length > 0
                ? scoreData.reduce((sum, m) => sum + m.match_score, 0) / scoreData.length
                : 0;
            
            return {
                totalMatches: totalMatches || 0,
                acceptedMatches: acceptedMatches || 0,
                acceptanceRate: totalMatches > 0 
                    ? ((acceptedMatches / totalMatches) * 100).toFixed(1)
                    : 0,
                averageScore: avgScore.toFixed(1)
            };
        } catch (error) {
            console.error('Error getting match statistics:', error);
            return {
                totalMatches: 0,
                acceptedMatches: 0,
                acceptanceRate: 0,
                averageScore: 0
            };
        }
    }
}

// Initialize matching engine
window.matchingEngine = new MatchingEngine();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MatchingEngine;
}
