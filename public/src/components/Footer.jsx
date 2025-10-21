import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react'

export default function Footer() {
  const { t, i18n } = useTranslation()
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-2 space-x-reverse mb-4">
              <div className="bg-gradient-to-r from-primary-600 to-primary-500 p-2 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-white">
                {i18n.language === 'ar' ? 'الشحنة السريعة' : 'Fast Shipment'}
              </span>
            </div>
            <p className="text-sm mb-4">{t('footer.description')}</p>
            <div className="flex space-x-4 space-x-reverse">
              <a href="#" className="hover:text-primary-400 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-primary-400 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-primary-400 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-primary-400 transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold mb-4">{t('footer.quickLinks')}</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="hover:text-primary-400 transition-colors">{t('nav.home')}</Link></li>
              <li><Link to="/about" className="hover:text-primary-400 transition-colors">{t('nav.about')}</Link></li>
              <li><Link to="/login" className="hover:text-primary-400 transition-colors">{t('nav.login')}</Link></li>
              <li><Link to="/register" className="hover:text-primary-400 transition-colors">{t('nav.register')}</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-bold mb-4">{t('footer.legal')}</h3>
            <ul className="space-y-2">
              <li><Link to="/terms" className="hover:text-primary-400 transition-colors">{t('footer.terms')}</Link></li>
              <li><Link to="/privacy" className="hover:text-primary-400 transition-colors">{t('footer.privacy')}</Link></li>
              <li><Link to="/support" className="hover:text-primary-400 transition-colors">{t('footer.support')}</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-bold mb-4">{t('footer.contact')}</h3>
            <ul className="space-y-3">
              <li className="flex items-center space-x-3 space-x-reverse">
                <Mail className="w-5 h-5 text-primary-400" />
                <a href="mailto:gide1979@gmail.com" className="hover:text-primary-400 transition-colors">
                  gide1979@gmail.com
                </a>
              </li>
              <li className="flex items-center space-x-3 space-x-reverse">
                <Phone className="w-5 h-5 text-primary-400" />
                <a href="tel:+966551519723" className="hover:text-primary-400 transition-colors">
                  +966 55 151 9723
                </a>
              </li>
              <li className="flex items-start space-x-3 space-x-reverse">
                <MapPin className="w-5 h-5 text-primary-400 flex-shrink-0 mt-1" />
                <span className="text-sm">{i18n.language === 'ar' ? 'المملكة العربية السعودية' : 'Saudi Arabia'}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 pt-8 text-center">
          <p className="text-sm">
            © {currentYear} {i18n.language === 'ar' ? 'الشحنة السريعة' : 'Fast Shipment'}. {t('footer.rights')}
          </p>
          <p className="text-xs mt-2 text-gray-500">
            {i18n.language === 'ar' ? 'حقوق الملكية الفكرية لـ' : 'Intellectual Property Rights of'} قايد المصعبي
          </p>
        </div>
      </div>
    </footer>
  )
}