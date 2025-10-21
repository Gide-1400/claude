import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MessageCircle, MapPin, Calendar, Weight, User, Phone } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'

export default function Matches({ user, userType }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const tripId = searchParams.get('tripId')
  const shipmentId = searchParams.get('shipmentId')
  
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userType === 'carrier' && tripId) {
      findMatchesForTrip(tripId)
    } else if (userType === 'shipper' && shipmentId) {
      findMatchesForShipment(shipmentId)
    } else {
      findAllMatches()
    }
  }, [tripId, shipmentId, userType])

  const findMatchesForTrip = async (tripId) => {
    setLoading(true)
    
    // Get trip details
    const { data: trip } = await supabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .single()

    if (!trip) {
      setLoading(false)
      return
    }

    // Find matching shipments
    const { data: shipments } = await supabase
      .from('shipments')
      .select(`
        *,
        users:user_id (name, phone, email)
      `)
      .eq('from_city', trip.from_city)
      .eq('to_city', trip.to_city)
      .lte('weight', trip.available_weight)
      .eq('status', 'pending')

    if (shipments) {
      const matchesWithScore = shipments.map(shipment => ({
        ...shipment,
        match_score: calculateMatchScore(trip, shipment),
        type: 'shipment'
      }))
      setMatches(matchesWithScore.sort((a, b) => b.match_score - a.match_score))
    }
    
    setLoading(false)
  }

  const findMatchesForShipment = async (shipmentId) => {
    setLoading(true)
    
    // Get shipment details
    const { data: shipment } = await supabase
      .from('shipments')
      .select('*')
      .eq('id', shipmentId)
      .single()

    if (!shipment) {
      setLoading(false)
      return
    }

    // Find matching trips
    const { data: trips } = await supabase
      .from('trips')
      .select(`
        *,
        users:user_id (name, phone, email)
      `)
      .eq('from_city', shipment.from_city)
      .eq('to_city', shipment.to_city)
      .gte('available_weight', shipment.weight)
      .eq('status', 'available')

    if (trips) {
      const matchesWithScore = trips.map(trip => ({
        ...trip,
        match_score: calculateMatchScore(trip, shipment),
        type: 'trip'
      }))
      setMatches(matchesWithScore.sort((a, b) => b.match_score - a.match_score))
    }
    
    setLoading(false)
  }

  const findAllMatches = async () => {
    setLoading(true)
    
    if (userType === 'carrier') {
      // Get all trips for carrier
      const { data: trips } = await supabase
        .from('trips')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'available')

      if (trips && trips.length > 0) {
        await findMatchesForTrip(trips[0].id)
      }
    } else {
      // Get all shipments for shipper
      const { data: shipments } = await supabase
        .from('shipments')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'pending')

      if (shipments && shipments.length > 0) {
        await findMatchesForShipment(shipments[0].id)
      }
    }
    
    setLoading(false)
  }

  const calculateMatchScore = (trip, shipment) => {
    let score = 50 // Base score

    // Date proximity (max 30 points)
    const tripDate = new Date(trip.trip_date)
    const neededDate = new Date(shipment.needed_date)
    const daysDiff = Math.abs((tripDate - neededDate) / (1000 * 60 * 60 * 24))
    
    if (daysDiff === 0) score += 30
    else if (daysDiff <= 2) score += 20
    else if (daysDiff <= 5) score += 10

    // Weight compatibility (max 20 points)
    const weightRatio = shipment.weight / trip.available_weight
    if (weightRatio <= 0.5) score += 20
    else if (weightRatio <= 0.75) score += 15
    else if (weightRatio <= 1) score += 10

    return Math.min(score, 100)
  }

  const createMatch = async (matchItem) => {
    const matchData = {
      trip_id: userType === 'carrier' ? tripId : matchItem.id,
      shipment_id: userType === 'shipper' ? shipmentId : matchItem.id,
      match_score: matchItem.match_score,
      status: 'suggested'
    }

    const { data, error } = await supabase
      .from('matches')
      .insert([matchData])
      .select()
      .single()

    if (data) {
      navigate(`/chat/${data.id}`)
    }
  }

  const openWhatsApp = (phone) => {
    const cleanPhone = phone.replace(/\D/g, '')
    window.open(`https://wa.me/${cleanPhone}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="glass rounded-2xl p-6 mb-8 animate-fade-in">
          <h1 className="text-3xl font-black bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
            {t('matches.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {userType === 'carrier' ? t('matches.forTrip') : t('matches.forShipment')}
          </p>
        </div>

        {/* Matches List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary-600 mx-auto"></div>
          </div>
        ) : matches.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold mb-2">{t('matches.noMatches')}</h3>
            <p className="text-gray-600 dark:text-gray-400">
              سنخبرك عندما نجد مطابقات مناسبة
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {matches.map((match, index) => (
              <div
                key={match.id}
                className="glass rounded-2xl p-6 hover:shadow-2xl transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Match Score */}
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                      {match.match_score}%
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {t('matches.score')}
                      </div>
                      <div className="font-bold">{match.users?.name}</div>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    match.match_score >= 80 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : match.match_score >= 60
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                      : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                  }`}>
                    {match.match_score >= 80 ? 'مطابقة ممتازة' : match.match_score >= 60 ? 'مطابقة جيدة' : 'مطابقة مقبولة'}
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center space-x-3 space-x-reverse text-gray-700 dark:text-gray-300">
                    <MapPin className="w-5 h-5 text-primary-600" />
                    <span className="font-semibold">
                      {match.from_city} → {match.to_city}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 space-x-reverse text-gray-600 dark:text-gray-400">
                    <Calendar className="w-5 h-5" />
                    <span>
                      {format(new Date(match.trip_date || match.needed_date), 'yyyy-MM-dd')}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 space-x-reverse text-gray-600 dark:text-gray-400">
                    <Weight className="w-5 h-5" />
                    <span>
                      {match.weight || match.available_weight} كجم
                    </span>
                  </div>
                  {match.users?.phone && (
                    <div className="flex items-center space-x-3 space-x-reverse text-gray-600 dark:text-gray-400">
                      <Phone className="w-5 h-5" />
                      <span>{match.users.phone}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => createMatch(match)}
                    className="flex-1 btn-primary flex items-center justify-center space-x-2 space-x-reverse"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>{t('matches.chat')}</span>
                  </button>
                  {match.users?.phone && (
                    <button
                      onClick={() => openWhatsApp(match.users.phone)}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}