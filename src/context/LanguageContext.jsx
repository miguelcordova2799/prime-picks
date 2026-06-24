import { createContext, useContext, useState } from 'react'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem('pp_lang') || 'es' } catch { return 'es' }
  })

  function changeLang(l) {
    setLang(l)
    try { localStorage.setItem('pp_lang', l) } catch {}
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang: changeLang }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLang = () => useContext(LanguageContext)
