import React from 'react'
import { useTranslation } from 'react-i18next'
import { Zap, Clock, DollarSign, MapPin, Shield, Globe } from 'lucide-react'

export default function Features() {
  const { t } = useTranslation()

  const features = [
    {
      icon: <Zap className="w-8 h-8" />,
      title: t('features.feature1.title'),
      description: t('features.feature1.description'),
      color: 'from-yellow-500 to-orange-500'
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: t('features.feature2.title'),
      description: t('features.feature2.description'),
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: <DollarSign className="w-8 h-8" />,
      title: t('features.feature3.title'),
      description: t('features.feature3.description'),
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: <MapPin className="w-8 h-8" />,
      title: t('features.feature4.title'),
      description: t('features.feature4.description'),
      color: 'from-red-500 to-pink-500'
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: t('features.feature5.title'),
      description: t('features.feature5.description'),
      color: 'from-purple-500 to-indigo-500'
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: t('features.feature6.title'),
      description: t('features.feature6.description'),
      color: 'from-indigo-500 to-blue-500'
    }
  ]

  return (
    <section className="py-20 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
            {t('features.title')}
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {t('features.subtitle')}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group card hover:shadow-2xl animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`inline-flex p-4 rounded-xl bg-gradient-to-r ${feature.color} text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}