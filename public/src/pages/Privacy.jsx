import React from 'react'
import { useTranslation } from 'react-i18next'
import { Shield, Lock, Eye, Database } from 'lucide-react'

export default function Privacy() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex p-4 bg-gradient-to-r from-primary-600 to-purple-600 rounded-2xl mb-4">
            <Shield className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-5xl font-black mb-4 bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
            {t('privacy.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            آخر تحديث: {new Date().toLocaleDateString('ar-SA')}
          </p>
        </div>

        {/* Content */}
        <div className="glass rounded-2xl p-8 space-y-8">
          {/* Intro */}
          <div>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t('privacy.intro')}
            </p>
          </div>

          {/* Section 1 */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex items-start space-x-3 space-x-reverse mb-4">
              <Database className="w-6 h-6 text-primary-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold mb-3">{t('privacy.section1Title')}</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {t('privacy.section1Text')}
                </p>
              </div>
            </div>
          </div>

          {/* Section 2 */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex items-start space-x-3 space-x-reverse mb-4">
              <Eye className="w-6 h-6 text-primary-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold mb-3">{t('privacy.section2Title')}</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {t('privacy.section2Text')}
                </p>
              </div>
            </div>
          </div>

          {/* Section 3 */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex items-start space-x-3 space-x-reverse mb-4">
              <Shield className="w-6 h-6 text-primary-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold mb-3">{t('privacy.section3Title')}</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {t('privacy.section3Text')}
                </p>
              </div>
            </div>
          </div>

          {/* Section 4 */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex items-start space-x-3 space-x-reverse mb-4">
              <Lock className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold mb-3">{t('privacy.section4Title')}</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {t('privacy.section4Text')}
                </p>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
            <div className="flex items-start space-x-3 space-x-reverse">
              <Lock className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-green-900 dark:text-green-200 mb-2">
                  التزامنا بالأمان
                </h3>
                <p className="text-green-800 dark:text-green-300 text-sm">
                  نحن ملتزمون بحماية خصوصيتك وأمان بياناتك. جميع المعلومات المخزنة لدينا محمية بأحدث تقنيات التشفير والأمان.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}