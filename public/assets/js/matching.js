// Matching Algorithm for Fast Shipment Platform

class MatchingAlgorithm {
    constructor() {
        this.weights = {
            route: 0.4,      // 40% for route matching
            date: 0.3,       // 30% for date matching
            capacity: 0.2,   // 20% for capacity matching
            price: 0.1       // 10% for price matching
        };
        this.minMatchScore = 70; // Minimum score to suggest a match
    }

    // Find matches for a trip
    async findMatchesForTrip(tripId) {
        try {
            const trip = await this.getTrip(tripId);
            const potentialShipments = await this.getPotentialShipments(trip);
            
            const matches = [];
            
            for (const shipment of potentialShipments) {
                const score = this.calculateMatchScore(trip, shipment);
                
                if (score >= this.minMatchScore) {
                    matches.push({
                        trip_id: tripId,
                        shipment_id: shipment.id,
                        match_score: score,
                        status: 'suggested',
                        reasons: this.getMatchReasons(trip, shipment, score)
                    });
                }
            }
            
            // Sort by match score descending
            matches.sort((a, b) => b.match_score - a.match_score);
            
            return matches.slice(0, 10); // Return top 10 matches
        } catch (error) {
            console.error('Error finding matches for trip:', error);
            return [];
        }
    }

    // Find matches for a shipment
    async findMatchesForShipment(shipmentId) {
        try {
            const shipment = await this.getShipment(shipmentId);
            const potentialTrips = await this.getPotentialTrips(shipment);
            
            const matches = [];
            
            for (const trip of potentialTrips) {
                const score = this.calculateMatchScore(trip, shipment);
                
                if (score >= this.minMatchScore) {
                    matches.push({
                        trip_id: trip.id,
                        shipment_id: shipmentId,
                        match_score: score,
                        status: 'suggested',
                        reasons: this.getMatchReasons(trip, shipment, score)
                    });
                }
            }
            
            // Sort by match score descending
            matches.sort((a, b) => b.match_score - a.match_score);
            
            return matches.slice(0, 10); // Return top 10 matches
        } catch (error) {
            console.error('Error finding matches for shipment:', error);
            return [];
        }
    }

    // Calculate match score between trip and shipment
    calculateMatchScore(trip, shipment) {
        let totalScore = 0;

        // Route matching (40%)
        const routeScore = this.calculateRouteScore(trip, shipment);
        totalScore += routeScore * this.weights.route;

        // Date matching (30%)
        const dateScore = this.calculateDateScore(trip, shipment);
        totalScore += dateScore * this.weights.date;

        // Capacity matching (20%)
        const capacityScore = this.calculateCapacityScore(trip, shipment);
        totalScore += capacityScore * this.weights.capacity;

        // Price matching (10%)
        const priceScore = this.calculatePriceScore(trip, shipment);
        totalScore += priceScore * this.weights.price;

        return Math.min(Math.round(totalScore), 100);
    }

    // Calculate route compatibility score
    calculateRouteScore(trip, shipment) {
        let score = 0;

        // Exact match (same cities)
        if (trip.from_city === shipment.from_city && trip.to_city === shipment.to_city) {
            score = 100;
        }
        // Same country, different cities but compatible route
        else if (trip.from_country === shipment.from_country && 
                 trip.to_country === shipment.to_country) {
            
            // Check if trip route can accommodate shipment
            if (this.isRouteCompatible(trip, shipment)) {
                score = 80;
            } else {
                score = 40;
            }
        }
        // International but compatible
        else if (this.isInternationalCompatible(trip, shipment)) {
            score = 60;
        }

        return score;
    }

    // Calculate date compatibility score
    calculateDateScore(trip, shipment) {
        const tripDate = new Date(trip.trip_date);
        const shipmentDate = new Date(shipment.needed_date);
        const dateDiff = Math.abs(tripDate - shipmentDate) / (1000 * 60 * 60 * 24);

        if (dateDiff === 0) return 100;        // Same day
        if (dateDiff <= 1) return 90;          // 1 day difference
        if (dateDiff <= 3) return 75;          // 3 days difference
        if (dateDiff <= 7) return 50;          // 1 week difference
        if (dateDiff <= 14) return 25;         // 2 weeks difference
        return 0;                              // More than 2 weeks
    }

    // Calculate capacity compatibility score
    calculateCapacityScore(trip, shipment) {
        const availableWeight = trip.available_weight;
        const neededWeight = shipment.weight;
        
        if (neededWeight <= availableWeight) {
            // Perfect fit or partial fit
            const utilization = (neededWeight / availableWeight) * 100;
            return Math.min(utilization, 100);
        } else {
            // Over capacity - calculate how much over
            const overCapacityRatio = (availableWeight / neededWeight) * 100;
            return Math.max(overCapacityRatio, 0);
        }
    }

    // Calculate price compatibility score
    calculatePriceScore(trip, shipment) {
        if (!trip.price || !shipment.max_price) return 50; // Neutral if no price info

        const tripPrice = trip.price;
        const maxPrice = shipment.max_price;

        if (tripPrice <= maxPrice) {
            // Within budget - better score for better deals
            const priceRatio = (tripPrice / maxPrice) * 100;
            return 100 - (priceRatio - 50); // Higher score for lower prices
        } else {
            // Over budget - penalize based on how much over
            const overBudgetRatio = (maxPrice / tripPrice) * 100;
            return Math.max(overBudgetRatio, 0);
        }
    }

    // Check if routes are compatible
    isRouteCompatible(trip, shipment) {
        // Simple implementation - can be enhanced with mapping API
        const tripRoute = `${trip.from_city}-${trip.to_city}`;
        const shipmentRoute = `${shipment.from_city}-${shipment.to_city}`;
        
        // For now, consider routes compatible if they're in the same country
        // In production, this would use a routing API
        return trip.from_country === shipment.from_country && 
               trip.to_country === shipment.to_country;
    }

    // Check international compatibility
    isInternationalCompatible(trip, shipment) {
        // Check if the trip passes through or near shipment locations
        // This is a simplified version
        return (trip.from_country === shipment.from_country || 
                trip.to_country === shipment.to_country);
    }

    // Get match reasons for explanation
    getMatchReasons(trip, shipment, score) {
        const reasons = [];

        if (score >= 90) {
            reasons.push('مطابقة ممتازة - المسار والتاريخ متطابقان تماماً');
        } else if (score >= 80) {
            reasons.push('مطابقة قوية - المسار متطابق مع فرق بسيط في التواريخ');
        } else if (score >= 70) {
            reasons.push('مطابقة جيدة - المسار متوافق مع تواريخ مناسبة');
        }

        // Add specific reasons
        if (trip.from_city === shipment.from_city && trip.to_city === shipment.to_city) {
            reasons.push('نفس المسار بالضبط');
        }

        const tripDate = new Date(trip.trip_date);
        const shipmentDate = new Date(shipment.needed_date);
        const dateDiff = Math.abs(tripDate - shipmentDate) / (1000 * 60 * 60 * 24);
        
        if (dateDiff === 0) {
            reasons.push('نفس اليوم');
        } else if (dateDiff <= 3) {
            reasons.push('تواريخ قريبة');
        }

        if (shipment.weight <= trip.available_weight) {
            reasons.push('السعة مناسبة');
        }

        return reasons;
    }

    // Get trip from database
    async getTrip(tripId) {
        const { data, error } = await window.supabase
            .from('trips')
            .select('*')
            .eq('id', tripId)
            .single();

        if (error) throw error;
        return data;
    }

    // Get shipment from database
    async getShipment(shipmentId) {
        const { data, error } = await window.supabase
            .from('shipments')
            .select('*')
            .eq('id', shipmentId)
            .single();

        if (error) throw error;
        return data;
    }

    // Get potential shipments for a trip
    async getPotentialShipments(trip) {
        const { data, error } = await window.supabase
            .from('shipments')
            .select('*')
            .eq('status', 'pending')
            .eq('from_country', trip.from_country)
            .eq('to_country', trip.to_country)
            .gte('needed_date', new Date().toISOString().split('T')[0]);

        if (error) throw error;
        return data || [];
    }

    // Get potential trips for a shipment
    async getPotentialTrips(shipment) {
        const { data, error } = await window.supabase
            .from('trips')
            .select('*')
            .eq('status', 'available')
            .eq('from_country', shipment.from_country)
            .eq('to_country', shipment.to_country)
            .gte('trip_date', new Date().toISOString().split('T')[0]);

        if (error) throw error;
        return data || [];
    }

    // Save match to database
    async saveMatch(matchData) {
        const { data, error } = await window.supabase
            .from('matches')
            .insert([matchData])
            .select();

        if (error) throw error;
        return data;
    }

    // Update match status
    async updateMatchStatus(matchId, status) {
        const { data, error } = await window.supabase
            .from('matches')
            .update({ status: status })
            .eq('id', matchId)
            .select();

        if (error) throw error;
        return data;
    }

    // Get matches for user
    async getUserMatches(userId, userType) {
        let query;

        if (userType === 'carrier') {
            query = window.supabase
                .from('matches')
                .select(`
                    *,
                    trips (*),
                    shipments (
                        *,
                        users (name, phone, email)
                    )
                `)
                .eq('trips.user_id', userId);
        } else {
            query = window.supabase
                .from('matches')
                .select(`
                    *,
                    shipments (*),
                    trips (
                        *,
                        users (name, phone, email)
                    )
                `)
                .eq('shipments.user_id', userId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    }
}

// Initialize matching algorithm
window.matchingAlgorithm = new MatchingAlgorithm();