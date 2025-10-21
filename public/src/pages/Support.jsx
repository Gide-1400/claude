import React from 'react'
import { useTranslation } from 'react-i18next'
import { Mail, Phone, Clock, MessageCircle, HelpCircle } from 'lucide-react'

export default function Support() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex p-4 bg-gradient-to-r from-primary-600 to-purple-600 rounded-2xl mb-4">
            <HelpCircle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-5xl font-black mb-4 bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
            {t('support.title')}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            {t('support.subtitle')}
          </p>
        </div>

        {/* Description */}
        <div className="glass rounded-2xl p-8 mb-8 text-center">
          <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
            {t('support.description')}
          </p>
        </div>

        {/* Contact Methods */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Email */}
          <a 
            href="mailto:gide1979@gmail.com"
            className="glass rounded-2xl p-8 hover:shadow-2xl transition-all duration-300 group animate-slide-up"
          >
            <div className="inline-flex p-4 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">{t('support.email')}</h3>
            <p className="text-primary-600 dark:text-primary-400 font-semibold">
              gide1979@gmail.com
            </p>
          </a>

          {/* Phone */}
          <a 
            href="tel:+966551519723"
            className="glass rounded-2xl p-8 hover:shadow-2xl transition-all duration-300 group animate-slide-up"
            style={{ animationDelay: '0.1s' }}
          >
            <div className="inline-flex p-4 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
              <Phone className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">{t('support.phone')}</h3>
            <p className="text-primary-600 dark:text-primary-400 font-semibold" dir="ltr">
              +966 55 151 9723
            </p>
          </a>
        </div>

        {/* Working Hours */}
        <div className="glass rounded-2xl p-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-start space-x-4 space-x-reverse">
            <div className="inline-flex p-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <div className="flex-grow">
              <h3 className="text-2xl font-bold mb-3">{t('support.hours')}</h3>
              <p className="text-gray-700 dark:text-gray-300 text-lg">
                {t('support.hoursText')}
              </p>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                نرد على جميع الاستفسارات خلال 24 ساعة
              </p>
            </div>
          </div>
        </div>

        {/* WhatsApp */}
        <div className="mt-8 text-center">
          
            href="https://wa.me/966551519723"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-3 space-x-reverse bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-xl shadow-2xl hover:shadow-green-500/50 transform hover:scale-105 transition-all duration-300 font-bold text-lg"
          >
            <MessageCircle className="w-6 h-6" />
            <span>تواصل معنا عبر واتساب</span>
          </a>
        </div>
      </div>
    </div>
  )
}