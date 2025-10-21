import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Send, ArrowLeft, Phone } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'

export default function Chat({ user }) {
  const { t } = useTranslation()
  const { matchId } = useParams()
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [matchData, setMatchData] = useState(null)
  const [otherUser, setOtherUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    fetchMatchData()
    fetchMessages()
    subscribeToMessages()
  }, [matchId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchMatchData = async () => {
    const { data: match } = await supabase
      .from('matches')
      .select(`
        *,
        trips:trip_id (*, users:user_id (name, phone, email)),
        shipments:shipment_id (*, users:user_id (name, phone, email))
      `)
      .eq('id', matchId)
      .single()

    if (match) {
      setMatchData(match)
      
      // Determine other user
      const tripUser = match.trips?.users
      const shipmentUser = match.shipments?.users
      
      if (tripUser?.id === user.id) {
        setOtherUser(shipmentUser)
      } else {
        setOtherUser(tripUser)
      }
    }
    setLoading(false)
  }

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true })

    if (data) setMessages(data)
  }

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`messages:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    const receiverId = otherUser?.id

    const { error } = await supabase
      .from('messages')
      .insert([
        {
          sender_id: user.id,
          receiver_id: receiverId,
          match_id: matchId,
          message: newMessage
        }
      ])

    if (!error) {
      setNewMessage('')
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const openWhatsApp = () => {
    if (otherUser?.phone) {
      const cleanPhone = otherUser.phone.replace(/\D/g, '')
      window.open(`https://wa.me/${cleanPhone}`, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="glass border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-xl font-bold">{otherUser?.name}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {matchData?.trips?.from_city} → {matchData?.trips?.to_city}
                </p>
              </div>
            </div>
            <button
              onClick={openWhatsApp}
              className="flex items-center space-x-2 space-x-reverse bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span className="hidden sm:inline">{t('chat.openWhatsApp')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-gray-600 dark:text-gray-400">
                {t('chat.noMessages')}
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs md:max-w-md px-4 py-3 rounded-2xl ${
                    message.sender_id === user.id
                      ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white'
                      : 'glass'
                  }`}
                >
                  <p className="break-words">{message.message}</p>
                  <p className={`text-xs mt-1 ${
                    message.sender_id === user.id ? 'text-primary-100' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {format(new Date(message.created_at), 'HH:mm')}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="glass border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <form onSubmit={sendMessage} className="flex space-x-2 space-x-reverse">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={t('chat.typePlaceholder')}
              className="flex-1 input-field"
            />
            <button
              type="submit"
              className="bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white p-3 rounded-xl transition-all duration-300"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}