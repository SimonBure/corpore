import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { initializeMobileDatabase } from './prisma-mobile'

export async function initializeMobileApp() {
  if (!Capacitor.isNativePlatform()) {
    return // Skip for web
  }

  try {
    // Configure status bar
    await StatusBar.setStyle({ style: Style.Default })
    await StatusBar.setBackgroundColor({ color: '#ffffff' })

    // Initialize database
    await initializeMobileDatabase()

    console.log('Mobile app initialized successfully')
  } catch (error) {
    console.error('Failed to initialize mobile app:', error)
  }
}

// Auto-initialize when module loads
if (typeof window !== 'undefined') {
  initializeMobileApp()
}