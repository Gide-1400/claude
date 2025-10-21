import React from 'react'
import { useTranslation } from 'react-i18next'
import { FileText, AlertTriangle, Shield, Scale } from 'lucide-react'

export default function Terms() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex p-4 bg-gradient-to-r from-primary-600 to-purple-600 rounded-2xl mb-4">
            <FileText className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-5xl font-black mb-4 bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
            {t('terms.title')}
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
              {t('terms.intro')}
            </p>
          </div>

          {/* Section 1 */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex items-start space-x-3 space-x-reverse mb-4">
              <AlertTriangle className="w-6 h-6 text-primary-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold mb-3">{t('terms.section1Title')}</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {t('terms.section1Text')}
                </p>
              </div>
            </div>
          </div>

          {/* Section 2 */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex items-start space-x-3 space-x-reverse mb-4">
              <Shield className="w-6 h-6 text-primary-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold mb-3">{t('terms.section2Title')}</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {t('terms.section2Text')}
                </p>
              </div>
            </div>
          </div>

          {/* Section 3 */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex items-start space-x-3 space-x-reverse mb-4">
              <Scale className="w-6 h-6 text-primary-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold mb-3">{t('terms.section3Title')}</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {t('terms.section3Text')}
                </p>
              </div>
            </div>
          </div>

          {/* Section 4 */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex items-start space-x-3 space-x-reverse mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold mb-3">{t('terms.section4Title')}</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {t('terms.section4Text')}
                </p>
              </div>
            </div>
          </div>

          {/* Important Notice */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
            <div className="flex items-start space-x-3 space-x-reverse">
              <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-yellow-900 dark:text-yellow-200 mb-2">
                  تنويه هام
                </h3>
                <p className="text-yellow-800 dark:text-yellow-300 text-sm">
                  باستخدامك لهذه المنصة، فإنك توافق على جميع الشروط والأحكام المذكورة أعلاه. إذا كنت لا توافق على أي من هذه الشروط، يرجى عدم استخدام المنصة.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}