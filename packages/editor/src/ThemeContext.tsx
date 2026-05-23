import { createContext, useContext } from 'react'
import { DEFAULT_THEME, type EditorTheme } from './themes'

export const ThemeContext = createContext<EditorTheme>(DEFAULT_THEME)

export function useEditorTheme(): EditorTheme {
  return useContext(ThemeContext)
}
