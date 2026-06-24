import { createContext, useContext, useState, useCallback, useMemo } from 'react'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem('pp_lang') || 'es' } catch { return 'es' }
  })

  const changeLang = useCallback((l) => {
    setLang(l)
    try {
      localStorage.setItem('pp_lang', l)
      // Broadcast so any component can listen without needing context
      window.dispatchEvent(new CustomEvent('pp:langchange', { detail: l }))
    } catch {}
  }, [])

  const value = useMemo(() => ({ lang, setLang: changeLang }), [lang, changeLang])

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLang = () => useContext(LanguageContext)
