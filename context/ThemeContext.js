'use client'

import React, { createContext, useState, useContext, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { storage } from '../utils/storage'

// Định nghĩa các màu sắc cho theme sáng và tối
const lightTheme = {
  primary: '#6200ee',
  primaryLight: '#e7deff',
  secondary: '#03dac6',
  switchActive: '#00c853',
  background: '#f5f5f5',
  cardBackground: '#ffffff',
  itemBackground: '#f0f0f0',
  text: '#000000',
  textSecondary: '#666666',
  darkTextSecondary: '#888888',
  border: '#e0e0e0',
  error: '#b00020',
  success: '#4caf50',
  warning: '#ff9800',
  info: '#2196f3',
}

const darkTheme = {
  primary: '#bb86fc',
  primaryLight: '#4a3b80',
  secondary: '#03dac6',
  switchActive: '#00c853',
  background: '#0d1117',
  cardBackground: '#161b22',
  itemBackground: '#2a2a2a',
  text: '#ffffff',
  textSecondary: '#aaaaaa',
  darkTextSecondary: '#888888',
  border: '#333333',
  error: '#cf6679',
  success: '#4caf50',
  warning: '#ff9800',
  info: '#2196f3',
}

// Tạo context
const ThemeContext = createContext()

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light')
  const [colors, setColors] = useState(lightTheme)
  const [isLoading, setIsLoading] = useState(true)

  // Load theme từ storage khi component mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        // Thử lấy từ storage mới
        const userSettings = await storage.getUserSettings()
        let savedTheme = 'light'

        if (userSettings && userSettings.theme) {
          savedTheme = userSettings.theme
        } else {
          // Fallback to AsyncStorage
          const asyncTheme = await AsyncStorage.getItem('darkMode')
          if (asyncTheme === 'true') {
            savedTheme = 'dark'
          }
        }

        setTheme(savedTheme)
        setColors(savedTheme === 'dark' ? darkTheme : lightTheme)
      } catch (error) {
        console.error('Error loading theme:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadTheme()
  }, [])

  // Hàm chuyển đổi theme
  const toggleTheme = async (newTheme) => {
    try {
      const themeValue = newTheme || (theme === 'light' ? 'dark' : 'light')
      setTheme(themeValue)
      setColors(themeValue === 'dark' ? darkTheme : lightTheme)

      // Lưu vào storage
      await storage.updateUserSettings({ theme: themeValue })

      // Lưu vào AsyncStorage để tương thích ngược
      await AsyncStorage.setItem(
        'darkMode',
        themeValue === 'dark' ? 'true' : 'false'
      )
    } catch (error) {
      console.error('Error toggling theme:', error)
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  )
}

// Custom hook để sử dụng theme
export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
