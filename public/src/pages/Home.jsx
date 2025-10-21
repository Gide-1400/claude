import React from 'react'
import Hero from '../components/Hero'
import Features from '../components/Features'
import Stats from '../components/Stats'
import HowItWorks from '../components/HowItWorks'
import CTA from '../components/CTA'

export default function Home() {
  return (
    <div>
      <Hero />
      <Features />
      <Stats />
      <HowItWorks />
      <CTA />
    </div>
  )
}