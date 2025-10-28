// Smart Matching Engine for Fast Shipment Platform
// Matches carriers with shippers based on route, date, and capacity

class MatchingEngine {
    constructor() {
        this.supabase = window.supabaseClient;
        this.currentUser = null;
    }

    /**
     * Find matching shipments for a carrier's trip
     * @param {Object} trip - The carrier's trip details
     * @returns {Array} - Array of matching shipments with scores
     */
    async findMatchingShipments(trip) {
        try {
            if (!trip) return [];

            // Get all available shipments
            const { data: shipments, error } = await this.supabase
                .from('shipments')
                .select('*, users!inner(name, phone, email)')
                .eq('status', 'pending')
                .eq('is_dummy', false)
                .gte('needed_date', new Date().toISOString().split('T')[0]);

            if (error) throw error;

            if (!shipments || shipments.length === 0) {
                return [];
            }

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
    calculateDistance(trip, shipment) {
        // This is a placeholder
        // In production, integrate with Google Maps Distance Matrix API or similar
        return Math.floor(Math.random() * 500) + 100; // km
    }

    /**
     * Save a match to the database
     */
    async saveMatch(tripId, shipmentId, matchScore) {
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

            if (error) throw error;

            return data;

        } catch (error) {
            // Check if match already exists
            if (error.code === '23505') {
                console.log('Match already exists');
                return null;
            }
            console.error('Error saving match:', error);
            throw error;
        }
    }

    /**
     * Get all matches for a user
     */
    async getUserMatches(userId, userType) {
        try {
            let query = this.supabase
                .from('matches')
                .select(`
                    *,
                    trips!inner(*, users!inner(name, phone, email)),
                    shipments!inner(*, users!inner(name, phone, email))
                `);

            if (userType === 'carrier') {
                query = query.eq('trips.user_id', userId);
            } else {
                query = query.eq('shipments.user_id', userId);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;

            return data || [];

        } catch (error) {
            console.error('Error getting user matches:', error);
            return [];
        }
    }

    /**
     * Update match status
     */
    async updateMatchStatus(matchId, status) {
        try {
            const { data, error } = await this.supabase
                .from('matches')
                .update({ status: status })
                .eq('id', matchId)
                .select()
                .single();

            if (error) throw error;

            return data;

        } catch (error) {
            console.error('Error updating match status:', error);
            throw error;
        }
    }

    /**
     * Auto-generate matches for a new trip
     */
    async autoMatchTrip(tripId) {
        try {
            // Get trip details
            const { data: trip, error: tripError } = await this.supabase
                .from('trips')
                .select('*')
                .eq('id', tripId)
                .single();

            if (tripError) throw tripError;

            // Find matching shipments
            const matches = await this.findMatchingShipments(trip);

            // Save top 10 matches
            const topMatches = matches.slice(0, 10);
            
            for (const match of topMatches) {
                await this.saveMatch(tripId, match.id, match.matchScore);
            }

            return topMatches.length;

        } catch (error) {
            console.error('Error auto-matching trip:', error);
            return 0;
        }
    }

    /**
     * Auto-generate matches for a new shipment
     */
    async autoMatchShipment(shipmentId) {
        try {
            // Get shipment details
            const { data: shipment, error: shipmentError } = await this.supabase
                .from('shipments')
                .select('*')
                .eq('id', shipmentId)
                .single();

            if (shipmentError) throw shipmentError;

            // Find matching trips
            const matches = await this.findMatchingTrips(shipment);

            // Save top 10 matches
            const topMatches = matches.slice(0, 10);
            
            for (const match of topMatches) {
                await this.saveMatch(match.id, shipmentId, match.matchScore);
            }

            return topMatches.length;

        } catch (error) {
            console.error('Error auto-matching shipment:', error);
            return 0;
        }
    }
}

// Initialize and export
window.MatchingEngine = MatchingEngine;
window.matchingEngine = new MatchingEngine();
