import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const AppSettingsContext = createContext({
  settings: {},
  loading: true,
  noticiasEnabled: true,
  setNoticiasEnabled: () => {},
  refreshSettings: async () => {},
})

export function AppSettingsProvider({ children }) {
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [noticiasEnabled, setNoticiasEnabled] = useState(true)

  const loadSettings = useCallback(async () => {
    const { data } = await supabase.from('app_settings').select('key, value')
    if (data) {
      const obj = {}
      data.forEach(row => { obj[row.key] = row.value })
      setSettings(obj)
      if ('noticias_enabled' in obj) {
        setNoticiasEnabled(obj.noticias_enabled === true || obj.noticias_enabled === 'true')
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadSettings() }, [loadSettings])

  return (
    <AppSettingsContext.Provider value={{ settings, loading, noticiasEnabled, setNoticiasEnabled, refreshSettings: loadSettings }}>
      {children}
    </AppSettingsContext.Provider>
  )
}

export function useAppSettings() {
  return useContext(AppSettingsContext)
}
