import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { useTranslation } from 'react-i18next'

// Pages
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import CarrierDashboard from './pages/CarrierDashboard'
import ShipperDashboard from './pages/ShipperDashboard'
import Matches from './pages/Matches'
import Chat from './pages/Chat'
import About from './pages/About'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
import Support from './pages/Support'

// Components
import Navbar from './components/Navbar'
import Footer from './components/Footer'

function App() {
  const [user, setUser] = useState(null)
  const [userType, setUserType] = useState(null)
  const [loading, setLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const { i18n } = useTranslation()

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserType(session.user.id)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserType(session.user.id)
      } else {
        setUserType(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserType = async (userId) => {
    const { data, error } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', userId)
      .single()
    
    if (data) {
      setUserType(data.user_type)
    }
  }

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle('dark')
  }

  // Change language
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng)
    document.documentElement.lang = lng
    document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600"></div>
      </div>
    )
  }

  return (
    <Router>
      <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
        <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300">
          <Navbar 
            user={user} 
            userType={userType}
            darkMode={darkMode}
            toggleDarkMode={toggleDarkMode}
            changeLanguage={changeLanguage}
          />
          
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={!user ? <Login /> : <Navigate to={userType === 'carrier' ? '/carrier-dashboard' : '/shipper-dashboard'} />} />
            <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
            
            {/* Protected Routes */}
            <Route 
              path="/carrier-dashboard" 
              element={user && userType === 'carrier' ? <CarrierDashboard user={user} /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/shipper-dashboard" 
              element={user && userType === 'shipper' ? <ShipperDashboard user={user} /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/matches" 
              element={user ? <Matches user={user} userType={userType} /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/chat/:matchId" 
              element={user ? <Chat user={user} /> : <Navigate to="/login" />} 
            />
            
            {/* Info Pages */}
            <Route path="/about" element={<About />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/support" element={<Support />} />
          </Routes>
          
          <Footer />
        </div>
      </div>
    </Router>
  )
}

export default App