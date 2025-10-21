import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2, Eye, MapPin, Calendar, Weight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'

export default function ShipperDashboard({ user }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [shipments, setShipments] = useState([])
  const [userData, setUserData] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    from_city: '',
    to_city: '',
    needed_date: '',
    weight: '',
    shipper_type: ''
  })

  useEffect(() => {
    fetchUserData()
    fetchShipments()
  }, [])

  const fetchUserData = async () => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (data) {
      setUserData(data)
      setFormData(prev => ({ ...prev, shipper_type: data.shipper_type }))
    }
  }

  const fetchShipments = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('shipments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (data) setShipments(data)
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const { error } = await supabase
      .from('shipments')
      .insert([
        {
          user_id: user.id,
          from_city: formData.from_city,
          to_city: formData.to_city,
          needed_date: formData.needed_date,
          weight: parseInt(formData.weight),
          shipper_type: formData.shipper_type
        }
      ])

    if (!error) {
      setShowForm(false)
      setFormData({
        from_city: '',
        to_city: '',
        needed_date: '',
        weight: '',
        shipper_type: userData?.shipper_type || ''
      })
      fetchShipments()
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الشحنة؟')) {
      await supabase.from('shipments').delete().eq('id', id)
      fetchShipments()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="glass rounded-2xl p-6 mb-8 animate-fade-in">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {t('shipperDashboard.title')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {t('shipperDashboard.welcome')}, {userData?.name}
              </p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="btn-primary flex items-center space-x-2 space-x-reverse"
            >
              <Plus className="w-5 h-5" />
              <span>{t('shipperDashboard.addShipment')}</span>
            </button>
          </div>
        </div>

        {/* Add Shipment Form */}
        {showForm && (
          <div className="glass rounded-2xl p-6 mb-8 animate-slide-up">
            <h2 className="text-2xl font-bold mb-6">{t('shipperDashboard.addShipment')}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    {t('shipperDashboard.fromCity')}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.from_city}
                    onChange={(e) => setFormData({ ...formData, from_city: e.target.value })}
                    className="input-field"
                    placeholder="الرياض"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    {t('shipperDashboard.toCity')}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.to_city}
                    onChange={(e) => setFormData({ ...formData, to_city: e.target.value })}
                    className="input-field"
                    placeholder="جدة"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    {t('shipperDashboard.neededDate')}
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.needed_date}
                    onChange={(e) => setFormData({ ...formData, needed_date: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    {t('shipperDashboard.weight')}
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    className="input-field"
                    placeholder="20"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <button type="submit" className="btn-primary">
                  إضافة الشحنة
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-secondary"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Shipments List */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-6">{t('shipperDashboard.myShipments')}</h2>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-purple-600 mx-auto"></div>
            </div>
          ) : shipments.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-gray-600 dark:text-gray-400">
                {t('shipperDashboard.noShipments')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {shipments.map((shipment) => (
                <div key={shipment.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-lg transition-all duration-300">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex-grow">
                      <div className="flex items-center space-x-3 space-x-reverse mb-3">
                        <MapPin className="w-5 h-5 text-purple-600" />
                        <span className="font-bold text-lg">
                          {shipment.from_city} → {shipment.to_city}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center space-x-2 space-x-reverse text-gray-600 dark:text-gray-400">
                          <Calendar className="w-4 h-4" />
                          <span>{format(new Date(shipment.needed_date), 'yyyy-MM-dd')}</span>
                        </div>
                        <div className="flex items-center space-x-2 space-x-reverse text-gray-600 dark:text-gray-400">
                          <Weight className="w-4 h-4" />
                          <span>{shipment.weight} كجم</span>
                        </div>
                      </div>
                      <div className="mt-2">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          shipment.status === 'pending' 
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                            : shipment.status === 'matched'
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                            : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        }`}>
                          {shipment.status === 'pending' ? t('shipperDashboard.pending') 
                            : shipment.status === 'matched' ? t('shipperDashboard.matched') 
                            : t('shipperDashboard.completed')}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/matches?shipmentId=${shipment.id}`)}
                        className="flex items-center space-x-2 space-x-reverse bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-4 py-2 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        <span>{t('shipperDashboard.viewMatches')}</span>
                      </button>
                      <button
                        onClick={() => handleDelete(shipment.id)}
                        className="p-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}