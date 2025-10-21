import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { User, Mail, Phone, Lock, AlertCircle, UserPlus } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Register() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    userType: '',
    carrierType: '',
    shipperType: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('كلمات المرور غير متطابقة')
      return
    }

    if (!formData.userType) {
      setError('يرجى اختيار نوع المستخدم')
      return
    }

    if (formData.userType === 'carrier' && !formData.carrierType) {
      setError('يرجى اختيار نوع الموصل')
      return
    }

    if (formData.userType === 'shipper' && !formData.shipperType) {
      setError('يرجى اختيار نوع الشاحن')
      return
    }

    setLoading(true)

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password
      })

      if (authError) throw authError

      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: authData.user.id,
            email: formData.email,
            name: formData.name,
            phone: formData.phone,
            user_type: formData.userType,
            carrier_type: formData.carrierType || null,
            shipper_type: formData.shipperType || null
          }
        ])

      if (profileError) throw profileError

      // Navigate to appropriate dashboard
      navigate(formData.userType === 'carrier' ? '/carrier-dashboard' : '/shipper-dashboard')
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full">
        <div className="glass rounded-3xl shadow-2xl p-8 animate-fade-in">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex p-4 bg-gradient-to-r from-primary-600 to-purple-600 rounded-2xl mb-4">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-black bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
              {t('register.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {t('register.subtitle')}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start space-x-3 space-x-reverse">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  {t('register.name')}
                </label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="input-field pr-10"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  {t('register.email')}
                </label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="input-field pr-10"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  {t('register.phone')}
                </label>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="input-field pr-10"
                  />
                </div>
              </div>

              {/* User Type */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  {t('register.userType')}
                </label>
                <select
                  name="userType"
                  required
                  value={formData.userType}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">اختر النوع</option>
                  <option value="carrier">{t('register.carrier')}</option>
                  <option value="shipper">{t('register.shipper')}</option>
                </select>
              </div>

              {/* Carrier Type */}
              {formData.userType === 'carrier' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2">
                    {t('register.carrierType')}
                  </label>
                  <select
                    name="carrierType"
                    required
                    value={formData.carrierType}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="">اختر نوع الموصل</option>
                    <option value="independent">{t('register.independent')}</option>
                    <option value="private_car">{t('register.privateCar')}</option>
                    <option value="truck">{t('register.truck')}</option>
                    <option value="fleet">{t('register.fleet')}</option>
                  </select>
                </div>
              )}

              {/* Shipper Type */}
              {formData.userType === 'shipper' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2">
                    {t('register.shipperType')}
                  </label>
                  <select
                    name="shipperType"
                    required
                    value={formData.shipperType}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="">اختر نوع الشاحن</option>
                    <option value="individual">{t('register.individual')}</option>
                    <option value="small_business">{t('register.smallBusiness')}</option>
                    <option value="large_business">{t('register.largeBusiness')}</option>
                  </select>
                </div>
              )}

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  {t('register.password')}
                </label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="input-field pr-10"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  {t('register.confirmPassword')}
                </label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="input-field pr-10"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2 space-x-reverse">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  <span>جاري إنشاء الحساب...</span>
                </div>
              ) : (
                t('register.submit')
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('register.hasAccount')}{' '}
              <Link to="/login" className="text-primary-600 dark:text-primary-400 font-semibold hover:underline">
                {t('register.login')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}