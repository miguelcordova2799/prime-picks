import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AppSettingsContext = createContext({ noticiasEnabled: true, setNoticiasEnabled: () => {} })

export function AppSettingsProvider({ children }) {
  const [noticiasEnabled, setNoticiasEnabled] = useState(true)

  useEffect(() => {
    supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'noticias_enabled')
      .maybeSingle()
      .then(({ data }) => {
        if (data !== null) {
          setNoticiasEnabled(data.value === true || data.value === 'true')
        }
      })
  }, [])

  return (
    <AppSettingsContext.Provider value={{ noticiasEnabled, setNoticiasEnabled }}>
      {children}
    </AppSettingsContext.Provider>
  )
}

export function useAppSettings() {
  return useContext(AppSettingsContext)
}
