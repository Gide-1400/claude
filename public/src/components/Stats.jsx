import React from 'react'
import { useTranslation } from 'react-i18next'
import { Users, TrendingUp, MapPinned, Star } from 'lucide-react'

export default function Stats() {
  const { t } = useTranslation()

  const stats = [
    { icon: <Users className="w-8 h-8" />, number: '50K+', label: t('stats.users'), color: 'from-blue-500 to-cyan-500' },
    { icon: <TrendingUp className="w-8 h-8" />, number: '100K+', label: t('stats.trips'), color: 'from-green-500 to-emerald-500' },
    { icon: <MapPinned className="w-8 h-8" />, number: '150+', label: t('stats.countries'), color: 'from-purple-500 to-pink-500' },
    { icon: <Star className="w-8 h-8" />, number: '98%', label: t('stats.satisfaction'), color: 'from-yellow-500 to-orange-500' }
  ]

  return (
    <section className="py-20 bg-gradient-to-br from-primary-600 to-purple-600 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="text-center animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${stat.color} mb-4 transform hover:scale-110 transition-transform duration-300`}>
                {stat.icon}
              </div>
              <div className="text-4xl md:text-5xl font-black mb-2">{stat.number}</div>
              <div className="text-lg opacity-90">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}