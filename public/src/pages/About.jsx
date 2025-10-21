import React from 'react'
import { useTranslation } from 'react-i18next'
import { Target, Eye, Heart, Users, Globe, Zap } from 'lucide-react'

export default function About() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-5xl font-black mb-4 bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
            {t('about.title')}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
            {t('about.description')}
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="glass rounded-2xl p-8 animate-slide-up">
            <div className="inline-flex p-4 bg-gradient-to-r from-primary-600 to-purple-600 rounded-2xl mb-4">
              <Target className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-4">{t('about.mission')}</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              {t('about.missionText')}
            </p>
          </div>

          <div className="glass rounded-2xl p-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="inline-flex p-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl mb-4">
              <Eye className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-4">{t('about.vision')}</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              {t('about.visionText')}
            </p>
          </div>
        </div>

        {/* Values */}
        <div className="glass rounded-2xl p-8 mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">قيمنا</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6">
              <div className="inline-flex p-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl mb-4">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">الثقة</h3>
              <p className="text-gray-600 dark:text-gray-400">
                نبني علاقات قائمة على الثقة والشفافية
              </p>
            </div>
            <div className="text-center p-6">
              <div className="inline-flex p-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">السرعة</h3>
              <p className="text-gray-600 dark:text-gray-400">
                نوفر حلول شحن سريعة وفعالة
              </p>
            </div>
            <div className="text-center p-6">
              <div className="inline-flex p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl mb-4">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">العالمية</h3>
              <p className="text-gray-600 dark:text-gray-400">
                نربط العالم ببعضه البعض
              </p>
            </div>
          </div>
        </div>

        {/* Team */}
        <div className="text-center glass rounded-2xl p-12">
          <Users className="w-16 h-16 text-primary-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">فريقنا</h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            فريق متخصص من المهنيين يعمل على تطوير وتحسين المنصة لخدمتك بشكل أفضل
          </p>
        </div>
      </div>
    </div>
  )
}