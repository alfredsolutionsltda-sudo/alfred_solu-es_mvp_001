'use client'
import { useInactivityLogout } from '@/hooks/useInactivityLogout'

export default function InactivityWrapper() {
  useInactivityLogout(60)
  return null
}
