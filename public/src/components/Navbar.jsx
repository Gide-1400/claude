import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Menu, X, Moon, Sun, Globe, LogOut, LayoutDashboard } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Navbar({ user, userType, darkMode, toggleDarkMode, changeLanguage }) {
  const [isOpen, setIsOpen] = useState(false)
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar'
    changeLanguage(newLang)
  }

  return (
    <nav className="glass sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 space-x-reverse">
            <div className="bg-gradient-to-r from-primary-600 to-primary-500 p-2 rounded-xl">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
              {i18n.language === 'ar' ? 'الشحنة السريعة' : 'Fast Shipment'}
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4 space-x-reverse">
            <Link to="/" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 rounded-lg font-medium transition-colors">
              {t('nav.home')}
            </Link>
            <Link to="/about" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 rounded-lg font-medium transition-colors">
              {t('nav.about')}
            </Link>

            {user ? (
              <>
                <Link 
                  to={userType === 'carrier' ? '/carrier-dashboard' : '/shipper-dashboard'} 
                  className="flex items-center space-x-2 space-x-reverse text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 rounded-lg font-medium transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>{t('nav.dashboard')}</span>
                </Link>
                <Link to="/matches" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 rounded-lg font-medium transition-colors">
                  {t('nav.matches')}
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 space-x-reverse text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-2 rounded-lg font-medium transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('nav.logout')}</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 rounded-lg font-medium transition-colors">
                  {t('nav.login')}
                </Link>
                <Link to="/register" className="btn-primary">
                  {t('nav.register')}
                </Link>
              </>
            )}

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {darkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-gray-600" />}
            </button>

            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-1 space-x-reverse p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Globe className="w-5 h-5" />
              <span className="font-medium">{i18n.language === 'ar' ? 'EN' : 'ع'}</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden glass border-t border-gray-200 dark:border-gray-700">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link to="/" className="block px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
              {t('nav.home')}
            </Link>
            <Link to="/about" className="block px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
              {t('nav.about')}
            </Link>

            {user ? (
              <>
                <Link to={userType === 'carrier' ? '/carrier-dashboard' : '/shipper-dashboard'} className="block px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                  {t('nav.dashboard')}
                </Link>
                <Link to="/matches" className="block px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                  {t('nav.matches')}
                </Link>
                <button onClick={handleLogout} className="w-full text-right px-3 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="block px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                  {t('nav.login')}
                </Link>
                <Link to="/register" className="block px-3 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700">
                  {t('nav.register')}
                </Link>
              </>
            )}

            <div className="flex items-center justify-between px-3 py-2">
              <button onClick={toggleDarkMode} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                {darkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5" />}
              </button>
              <button onClick={toggleLanguage} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <Globe className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}