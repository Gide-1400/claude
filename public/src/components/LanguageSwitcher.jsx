import React from 'react'
import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng)
    document.documentElement.lang = lng
    document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr'
  }

  return (
    <div className="flex items-center space-x-2 space-x-reverse">
      <Globe className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      <select
        value={i18n.language}
        onChange={(e) => changeLanguage(e.target.value)}
        className="bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <option value="ar">العربية</option>
        <option value="en">English</option>
      </select>
    </div>
  )
}