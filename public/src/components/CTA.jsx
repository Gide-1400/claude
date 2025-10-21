import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Sparkles } from 'lucide-react'

export default function CTA() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <section className="py-20 bg-gradient-to-br from-primary-600 via-purple-600 to-indigo-600 text-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute w-96 h-96 bg-white/10 rounded-full blur-3xl animate-float" style={{ top: '20%', left: '10%' }}></div>
        <div className="absolute w-96 h-96 bg-white/10 rounded-full blur-3xl animate-float" style={{ bottom: '20%', right: '10%', animationDelay: '2s' }}></div>
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center space-x-2 space-x-reverse bg-white/20 backdrop-blur-lg px-4 py-2 rounded-full mb-6">
          <Sparkles className="w-5 h-5" />
          <span className="font-medium">{t('cta.subtitle')}</span>
        </div>

        <h2 className="text-4xl md:text-6xl font-black mb-6 animate-fade-in">
          {t('cta.title')}
        </h2>

        <button
          onClick={() => navigate('/register')}
          className="group inline-flex items-center space-x-3 space-x-reverse bg-white text-primary-600 px-8 py-4 rounded-xl shadow-2xl hover:shadow-white/50 transform hover:scale-105 transition-all duration-300 font-bold text-lg"
        >
          <span>{t('cta.button')}</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </section>
  )
}