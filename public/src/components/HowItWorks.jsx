import React from 'react'
import { useTranslation } from 'react-i18next'
import { FileText, Search, MessageCircle, Package, UserCheck, MapPin } from 'lucide-react'

export default function HowItWorks() {
  const { t } = useTranslation()

  const carrierSteps = [
    { icon: <FileText className="w-8 h-8" />, title: t('howItWorks.carrier.step1'), desc: t('howItWorks.carrier.step1Desc') },
    { icon: <Search className="w-8 h-8" />, title: t('howItWorks.carrier.step2'), desc: t('howItWorks.carrier.step2Desc') },
    { icon: <MessageCircle className="w-8 h-8" />, title: t('howItWorks.carrier.step3'), desc: t('howItWorks.carrier.step3Desc') }
  ]

  const shipperSteps = [
    { icon: <Package className="w-8 h-8" />, title: t('howItWorks.shipper.step1'), desc: t('howItWorks.shipper.step1Desc') },
    { icon: <UserCheck className="w-8 h-8" />, title: t('howItWorks.shipper.step2'), desc: t('howItWorks.shipper.step2Desc') },
    { icon: <MapPin className="w-8 h-8" />, title: t('howItWorks.shipper.step3'), desc: t('howItWorks.shipper.step3Desc') }
  ]

  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
            {t('howItWorks.title')}
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* For Carriers */}
          <div className="animate-slide-up">
            <h3 className="text-3xl font-bold mb-8 text-center text-primary-600 dark:text-primary-400">
              {t('howItWorks.carrier.title')}
            </h3>
            <div className="space-y-6">
              {carrierSteps.map((step, index) => (
                <div key={index} className="flex items-start space-x-4 space-x-reverse p-6 glass rounded-2xl hover:shadow-xl transition-all duration-300">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-primary-600 to-purple-600 text-white font-bold text-xl">
                      {index + 1}
                    </div>
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center space-x-3 space-x-reverse mb-2">
                      <div className="text-primary-600 dark:text-primary-400">
                        {step.icon}
                      </div>
                      <h4 className="text-xl font-bold">{step.title}</h4>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* For Shippers */}
          <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <h3 className="text-3xl font-bold mb-8 text-center text-purple-600 dark:text-purple-400">
              {t('howItWorks.shipper.title')}
            </h3>
            <div className="space-y-6">
              {shipperSteps.map((step, index) => (
                <div key={index} className="flex items-start space-x-4 space-x-reverse p-6 glass rounded-2xl hover:shadow-xl transition-all duration-300">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-xl">
                      {index + 1}
                    </div>
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center space-x-3 space-x-reverse mb-2">
                      <div className="text-purple-600 dark:text-purple-400">
                        {step.icon}
                      </div>
                      <h4 className="text-xl font-bold">{step.title}</h4>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}