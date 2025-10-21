import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Truck, Package } from 'lucide-react'

export default function Hero() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-primary-500/20 rounded-full blur-3xl animate-float" style={{ top: '10%', left: '10%' }}></div>
        <div className="absolute w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-float" style={{ top: '60%', right: '10%', animationDelay: '2s' }}></div>
        <div className="absolute w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-float" style={{ bottom: '10%', left: '50%', animationDelay: '4s' }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 space-x-reverse bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-4 py-2 rounded-full mb-6">
            <span className="w-2 h-2 bg-primary-600 rounded-full animate-pulse"></span>
            <span className="text-sm font-medium">🚀 {t('hero.subtitle')}</span>
          </div>

          {/* Main Title */}
          <h1 className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r from-primary-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent animate-gradient">
            {t('hero.title')}
          </h1>

          {/* Description */}
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            {t('hero.description')}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <button
              onClick={() => navigate('/register')}
              className="group flex items-center space-x-2 space-x-reverse bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white px-8 py-4 rounded-xl shadow-2xl hover:shadow-primary-500/50 transform hover:scale-105 transition-all duration-300 font-bold text-lg"
            >
              <Truck className="w-6 h-6" />
              <span>{t('hero.carrierBtn')}</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button
              onClick={() => navigate('/register')}
              className="group flex items-center space-x-2 space-x-reverse bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 px-8 py-4 rounded-xl shadow-xl hover:shadow-2xl border-2 border-primary-600 dark:border-primary-400 transform hover:scale-105 transition-all duration-300 font-bold text-lg"
            >
              <Package className="w-6 h-6" />
              <span>{t('hero.shipperBtn')}</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Floating Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { icon: '⚡', title: i18n.language === 'ar' ? 'سريع' : 'Fast', desc: i18n.language === 'ar' ? 'توصيل فوري' : 'Instant Delivery' },
              { icon: '🔒', title: i18n.language === 'ar' ? 'آمن' : 'Secure', desc: i18n.language === 'ar' ? 'موثوق 100%' : '100% Reliable' },
              { icon: '💰', title: i18n.language === 'ar' ? 'اقتصادي' : 'Affordable', desc: i18n.language === 'ar' ? 'أسعار منافسة' : 'Best Prices' }
            ].map((item, index) => (
              <div 
                key={index}
                className="glass p-6 rounded-2xl transform hover:scale-105 transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}