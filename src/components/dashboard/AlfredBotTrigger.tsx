'use client'

import { useState } from 'react'
import AlfredButton from '@/components/AlfredButton'
import AlfredAssistant from './AlfredAssistant'

export default function AlfredBotTrigger() {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false)

  return (
    <>
      <AlfredButton 
        iconName="bot" 
        onClick={() => setIsAssistantOpen(true)}
      >
        Falar com o Alfred
      </AlfredButton>

      <AlfredAssistant 
        isOpen={isAssistantOpen} 
        onClose={() => setIsAssistantOpen(false)} 
      />
    </>
  )
}

