'use client'

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native'
import { useCallback, useState, useMemo, useEffect, useContext } from 'react'
import { MaterialIcons } from '@expo/vector-icons'
import { AppContext } from '../context/AppContext'
import Constants from 'expo-constants' // Import Constants to get app version
import { useTheme } from '../context/ThemeContext'
import { createSettingsScreenStyles } from '../styles/screens/settingsScreenThemed'
import AsyncStorage from '@react-native-async-storage/async-storage'

const SettingsScreen = ({ navigation }) => {
  // Log để debug
  console.log('SettingsScreen được render')

  const {
    t,
    language,
    notificationSound,
    notificationVibration,
    onlyGoWorkMode,
    // Functions
    changeLanguage,
    toggleNotificationSound,
    toggleNotificationVibration,
    toggleOnlyGoWorkMode,
  } = useContext(AppContext)

  const { toggleTheme, colors, theme } = useTheme()
  const darkMode = theme === 'dark'

  // Tạo styles dựa trên theme hiện tại
  const styles = useMemo(() => createSettingsScreenStyles(colors), [colors])

  // Get app version from app.json via Constants
  // Handle both older and newer versions of Expo Constants
  const appVersion =
    Constants.manifest?.version || // older versions of Expo
    Constants.expoConfig?.version || // newer versions of Expo
    '1.0.0'

  // Local state for settings
  const [timeFormat, setTimeFormat] = useState('24h')
  const [firstDayOfWeek, setFirstDayOfWeek] = useState('Mon')
  const [weatherAlertsEnabled, setWeatherAlertsEnabled] = useState(true)
  const [shiftReminderMode, setShiftReminderMode] = useState('ask_weekly')
  const [multiButtonMode, setMultiButtonMode] = useState(
    onlyGoWorkMode ? 'simple' : 'full'
  )

  // Load settings from AsyncStorage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Load weather alerts setting
        const weatherAlerts = await AsyncStorage.getItem('weatherAlertsEnabled')
        if (weatherAlerts !== null) {
          setWeatherAlertsEnabled(weatherAlerts === 'true')
        }

        // Load time format
        const format = await AsyncStorage.getItem('timeFormat')
        if (format !== null) {
          setTimeFormat(format)
        }

        // Load first day of week
        const firstDay = await AsyncStorage.getItem('firstDayOfWeek')
        if (firstDay !== null) {
          setFirstDayOfWeek(firstDay)
        }

        // Load shift reminder mode
        const reminderMode = await AsyncStorage.getItem('shiftReminderMode')
        if (reminderMode !== null) {
          setShiftReminderMode(reminderMode)
        }

        // Set multiButtonMode based on onlyGoWorkMode
        setMultiButtonMode(onlyGoWorkMode ? 'simple' : 'full')
      } catch (error) {
        console.error('Error loading settings:', error)
      }
    }

    loadSettings()
  }, [onlyGoWorkMode])

  // Language options
  const languageOptions = [
    { label: 'Tiếng Việt', value: 'vi' },
    { label: 'English', value: 'en' },
  ]

  // Multi-button mode options
  const buttonModeOptions = [
    { label: 'Đầy đủ', value: 'full' },
    { label: 'Đơn giản', value: 'simple' },
  ]

  // Shift reminder mode options
  const reminderModeOptions = [
    { label: 'Hỏi hàng tuần', value: 'ask_weekly' },
    { label: 'Tự động xoay ca', value: 'rotate' },
    { label: 'Tắt', value: 'disabled' },
  ]

  // First day of week options
  const weekStartOptions = [
    { label: 'Thứ 2', value: 'Mon' },
    { label: 'Chủ nhật', value: 'Sun' },
  ]

  // Handle language change
  const handleLanguageChange = useCallback(
    async (value) => {
      try {
        // Cập nhật ngôn ngữ trong LocalizationContext
        await changeLanguage(value)

        // Hiển thị thông báo thành công
        Alert.alert(
          t('common.success'),
          t('settings.languageChanged') ||
            'Ngôn ngữ đã được thay đổi thành công'
        )
      } catch (error) {
        console.error('Error changing language:', error)
        Alert.alert(
          t('common.error'),
          t('settings.languageChangeFailed') || 'Không thể thay đổi ngôn ngữ'
        )
      }
    },
    [changeLanguage, t]
  )

  // Handle dark mode toggle
  const handleDarkModeToggle = useCallback(
    (value) => {
      // Sử dụng toggleTheme từ ThemeContext
      toggleTheme(value ? 'dark' : 'light')
    },
    [toggleTheme]
  )

  // Handle notification sound toggle
  const handleNotificationSoundToggle = useCallback(() => {
    toggleNotificationSound()
  }, [toggleNotificationSound])

  // Handle notification vibration toggle
  const handleNotificationVibrationToggle = useCallback(() => {
    toggleNotificationVibration()
  }, [toggleNotificationVibration])

  // Handle weather alerts toggle
  const handleWeatherAlertsToggle = useCallback((value) => {
    setWeatherAlertsEnabled(value)
    // Save setting to AsyncStorage
    AsyncStorage.setItem('weatherAlertsEnabled', value.toString())
  }, [])

  // Handle multi-button mode change
  const handleButtonModeChange = useCallback(() => {
    // Cập nhật onlyGoWorkMode dựa trên giá trị multiButtonMode
    toggleOnlyGoWorkMode()
  }, [toggleOnlyGoWorkMode])

  // Handle shift reminder mode change
  const handleReminderModeChange = useCallback((value) => {
    setShiftReminderMode(value)
    AsyncStorage.setItem('shiftReminderMode', value)
  }, [])

  // Handle time format toggle
  const handleTimeFormatToggle = useCallback((value) => {
    const newFormat = value ? '24h' : '12h'
    setTimeFormat(newFormat)
    AsyncStorage.setItem('timeFormat', newFormat)
  }, [])

  // Handle first day of week change
  const handleWeekStartChange = useCallback((value) => {
    setFirstDayOfWeek(value)
    AsyncStorage.setItem('firstDayOfWeek', value)
  }, [])

  return (
    <ScrollView style={styles.container}>
      {/* Theme Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('Chế độ tối')}</Text>
          <Text style={styles.sectionDescription}>
            {t(
              'Bật chế độ tối để trải nghiệm giao diện tối hơn trong ứng dụng'
            )}
          </Text>
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>{t('Bật chế độ tối')}</Text>
          <Switch
            trackColor={{ false: '#D1D1D6', true: colors.switchActive }}
            thumbColor={'#FFFFFF'}
            ios_backgroundColor="#D1D1D6"
            onValueChange={handleDarkModeToggle}
            value={darkMode}
            style={styles.switch}
          />
        </View>
      </View>

      {/* Language Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('Ngôn ngữ')}</Text>
        </View>
        <TouchableOpacity
          style={styles.settingRow}
          onPress={() => {
            // Show language picker
            Alert.alert(
              t('Chọn ngôn ngữ'),
              t('Chọn ngôn ngữ hiển thị cho ứng dụng'),
              languageOptions.map((option) => ({
                text: option.label,
                onPress: () => handleLanguageChange(option.value),
              }))
            )
          }}
        >
          <Text style={styles.settingLabel}>{t('Ngôn ngữ')}</Text>
          <View style={styles.languageSelector}>
            <Text style={styles.languageText}>
              {languageOptions.find((option) => option.value === language)
                ?.label || 'Tiếng Việt'}
            </Text>
            <MaterialIcons
              name="chevron-right"
              size={20}
              color={colors.darkTextSecondary}
            />
          </View>
        </TouchableOpacity>
      </View>

      {/* Notifications Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('Thông báo')}</Text>
        </View>

        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingLabel}>{t('Âm thanh thông báo')}</Text>
            <Text style={styles.settingDescription}>
              {t('Phát âm thanh khi có thông báo')}
            </Text>
          </View>
          <Switch
            trackColor={{ false: '#D1D1D6', true: colors.switchActive }}
            thumbColor={'#FFFFFF'}
            ios_backgroundColor="#D1D1D6"
            value={notificationSound}
            onValueChange={handleNotificationSoundToggle}
            style={styles.switch}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingLabel}>{t('Rung thông báo')}</Text>
            <Text style={styles.settingDescription}>
              {t('Rung khi có thông báo')}
            </Text>
          </View>
          <Switch
            trackColor={{ false: '#D1D1D6', true: colors.switchActive }}
            thumbColor={'#FFFFFF'}
            ios_backgroundColor="#D1D1D6"
            value={notificationVibration}
            onValueChange={handleNotificationVibrationToggle}
            style={styles.switch}
          />
        </View>
      </View>

      {/* Weather Alerts Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('Cảnh báo thời tiết')}</Text>
        </View>

        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingLabel}>
              {t('Nhận cảnh báo về thời tiết')}
            </Text>
            <Text style={styles.settingDescription}>
              {t(
                'Nhận cảnh báo về thời tiết cực đoan để bạn luôn được thông báo kịp thời'
              )}
            </Text>
          </View>
          <Switch
            trackColor={{ false: '#D1D1D6', true: colors.switchActive }}
            thumbColor={'#FFFFFF'}
            ios_backgroundColor="#D1D1D6"
            value={weatherAlertsEnabled}
            onValueChange={handleWeatherAlertsToggle}
            style={styles.switch}
          />
        </View>
      </View>

      {/* Multi-function Button Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('Nút đa năng')}</Text>
        </View>

        <TouchableOpacity
          style={styles.settingRow}
          onPress={() => {
            // Show button mode picker
            Alert.alert(
              t('Chế độ nút đa năng'),
              t('Chọn chế độ hiển thị cho nút đa năng'),
              buttonModeOptions.map((option) => ({
                text: option.label,
                onPress: () => handleButtonModeChange(option.value),
              }))
            )
          }}
        >
          <Text style={styles.settingLabel}>{t('Chế độ nút đa năng')}</Text>
          <View style={styles.languageSelector}>
            <Text style={styles.languageText}>
              {buttonModeOptions.find(
                (option) =>
                  option.value === (onlyGoWorkMode ? 'simple' : 'full')
              )?.label || 'Đầy đủ'}
            </Text>
            <MaterialIcons
              name="chevron-right"
              size={20}
              color={colors.darkTextSecondary}
            />
          </View>
        </TouchableOpacity>
      </View>

      {/* Shift Reminder Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('Nhắc nhở ca làm việc')}</Text>
        </View>

        <TouchableOpacity
          style={styles.settingRow}
          onPress={() => {
            // Show reminder mode picker
            Alert.alert(
              t('Chế độ nhắc nhở đổi ca'),
              t('Chọn chế độ nhắc nhở đổi ca'),
              reminderModeOptions.map((option) => ({
                text: option.label,
                onPress: () => handleReminderModeChange(option.value),
              }))
            )
          }}
        >
          <Text style={styles.settingLabel}>{t('Chế độ nhắc nhở đổi ca')}</Text>
          <View style={styles.languageSelector}>
            <Text style={styles.languageText}>
              {reminderModeOptions.find(
                (option) => option.value === shiftReminderMode
              )?.label || 'Hỏi hàng tuần'}
            </Text>
            <MaterialIcons
              name="chevron-right"
              size={20}
              color={colors.darkTextSecondary}
            />
          </View>
        </TouchableOpacity>
      </View>

      {/* Display Settings Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('Hiển thị')}</Text>
        </View>

        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingLabel}>{t('Định dạng 24 giờ')}</Text>
            <Text style={styles.settingDescription}>
              {t(
                'Hiển thị giờ theo định dạng 24 giờ (13:00) thay vì 12 giờ (1:00 PM)'
              )}
            </Text>
          </View>
          <Switch
            trackColor={{ false: '#D1D1D6', true: colors.switchActive }}
            thumbColor={'#FFFFFF'}
            ios_backgroundColor="#D1D1D6"
            value={timeFormat === '24h'}
            onValueChange={handleTimeFormatToggle}
            style={styles.switch}
          />
        </View>

        <TouchableOpacity
          style={styles.settingRow}
          onPress={() => {
            // Show week start picker
            Alert.alert(
              t('Ngày bắt đầu tuần'),
              t('Chọn ngày bắt đầu tuần'),
              weekStartOptions.map((option) => ({
                text: option.label,
                onPress: () => handleWeekStartChange(option.value),
              }))
            )
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.settingLabel}>{t('Ngày bắt đầu tuần')}</Text>
            <Text style={styles.settingDescription}>
              {t('Ngày đầu tiên trong tuần khi xem lịch')}
            </Text>
          </View>
          <View style={styles.languageSelector}>
            <Text style={styles.languageText}>
              {weekStartOptions.find(
                (option) => option.value === firstDayOfWeek
              )?.label || 'Thứ 2'}
            </Text>
            <MaterialIcons
              name="chevron-right"
              size={20}
              color={colors.darkTextSecondary}
            />
          </View>
        </TouchableOpacity>
      </View>

      {/* App Info Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('Thông tin ứng dụng')}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t('Phiên bản')}</Text>
          <Text style={styles.infoValue}>{appVersion}</Text>
        </View>
      </View>
    </ScrollView>
  )
}

export default SettingsScreen
