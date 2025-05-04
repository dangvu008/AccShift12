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

  // Log để debug sau khi lấy language từ context
  console.log('Current language from context in SettingsScreen:', language)

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

        // Set multiButtonMode based on onlyGoWorkMode
        setMultiButtonMode(onlyGoWorkMode ? 'simple' : 'full')
      } catch (error) {
        console.error('Error loading settings:', error)
      }
    }

    loadSettings()
  }, [onlyGoWorkMode])

  // Hàm tải lại ứng dụng
  const reloadApp = useCallback(() => {
    // Tải lại toàn bộ ứng dụng bằng cách điều hướng qua các màn hình
    console.log('Reloading app...')

    // Đầu tiên điều hướng đến Home
    navigation.navigate('Home')

    // Sau đó quay lại Settings
    setTimeout(() => {
      navigation.navigate('Settings', { refresh: Date.now() })
    }, 300)
  }, [navigation])

  // Theo dõi sự thay đổi của language
  useEffect(() => {
    console.log('Language changed in SettingsScreen:', language)

    // Force re-render khi ngôn ngữ thay đổi
    const forceUpdate = async () => {
      // Đọc ngôn ngữ từ AsyncStorage để đảm bảo đồng bộ
      const storedLanguage = await AsyncStorage.getItem('language')
      console.log('Stored language in AsyncStorage:', storedLanguage)

      if (storedLanguage && storedLanguage !== language) {
        console.log('Language mismatch, forcing update...')
        // Tải lại màn hình
        reloadApp()
      }
    }

    forceUpdate()
  }, [language, navigation, reloadApp])

  // Language options
  const languageOptions = [
    { label: 'Tiếng Việt', value: 'vi' },
    { label: 'English', value: 'en' },
  ]

  // Log để debug
  console.log('Current language in SettingsScreen:', language)

  // Debug translations
  console.log('Debug translations:')
  console.log('t("Chế độ tối") =', t('Chế độ tối'))
  console.log('t("Ngôn ngữ") =', t('Ngôn ngữ'))
  console.log('t("Thông báo") =', t('Thông báo'))
  console.log('t("Cảnh báo thời tiết") =', t('Cảnh báo thời tiết'))
  console.log('t("Nút đa năng") =', t('Nút đa năng'))
  console.log('t("Hiển thị") =', t('Hiển thị'))
  console.log('t("Thông tin ứng dụng") =', t('Thông tin ứng dụng'))

  // Multi-button mode options
  const buttonModeOptions = [
    { label: 'Đầy đủ', value: 'full' },
    { label: 'Đơn giản', value: 'simple' },
  ]

  // Đã loại bỏ Shift reminder mode options

  // First day of week options
  const weekStartOptions = [
    { label: 'Thứ 2', value: 'Mon' },
    { label: 'Chủ nhật', value: 'Sun' },
  ]

  // Hàm thay đổi ngôn ngữ trực tiếp
  const changeLanguageDirectly = useCallback(
    async (value) => {
      try {
        console.log('SettingsScreen: Changing language directly to:', value)

        // Lưu trực tiếp vào AsyncStorage
        await AsyncStorage.setItem('language', value)

        // Đọc lại để xác nhận
        const storedLanguage = await AsyncStorage.getItem('language')
        console.log(
          'SettingsScreen: Language in AsyncStorage after direct change:',
          storedLanguage
        )

        // Hiển thị thông báo thành công
        const successTitle = value === 'en' ? 'Success' : 'Thành công'
        const successMessage =
          value === 'en'
            ? 'Language has been changed successfully'
            : 'Ngôn ngữ đã được thay đổi thành công'

        Alert.alert(successTitle, successMessage)

        // Reload ứng dụng
        setTimeout(() => {
          console.log(
            'SettingsScreen: Reloading app after direct language change'
          )
          reloadApp()
        }, 500)

        return true
      } catch (error) {
        console.error('Error in direct language change:', error)
        return false
      }
    },
    [reloadApp]
  )

  // Handle language change
  const handleLanguageChange = useCallback(
    async (value) => {
      try {
        console.log('SettingsScreen: Changing language to:', value)
        console.log('SettingsScreen: Current language before change:', language)

        // Sử dụng phương pháp thay đổi ngôn ngữ trực tiếp
        await changeLanguageDirectly(value)

        // Sau đó cập nhật trong AppContext
        await changeLanguage(value)
      } catch (error) {
        console.error('SettingsScreen: Error changing language:', error)
        Alert.alert('Lỗi', 'Không thể thay đổi ngôn ngữ')
      }
    },
    [changeLanguage, navigation, language, reloadApp]
  )

  // Handle dark mode toggle
  const handleDarkModeToggle = useCallback(
    (value) => {
      // Sử dụng toggleTheme từ ThemeContext
      // Đảo ngược giá trị để sửa lỗi chế độ tối ngược với toàn bộ ứng dụng
      toggleTheme(!value ? 'dark' : 'light')
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

  // Đã loại bỏ handleReminderModeChange

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
            // Show language picker with fixed text (not using t() to avoid translation issues)
            const title =
              language === 'en' ? 'Select Language' : 'Chọn ngôn ngữ'
            const message =
              language === 'en'
                ? 'Choose display language for the app'
                : 'Chọn ngôn ngữ hiển thị cho ứng dụng'

            Alert.alert(
              title,
              message,
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
              {language === 'en' ? 'English' : 'Tiếng Việt'}
            </Text>
            <MaterialIcons
              name="chevron-right"
              size={20}
              color={colors.darkTextSecondary}
            />
          </View>
          {/* Debug info */}
          <Text style={{ fontSize: 10, color: colors.darkTextSecondary }}>
            (Lang: {language})
          </Text>
        </TouchableOpacity>

        {/* Direct language change buttons for debugging */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            marginTop: 10,
          }}
        >
          <TouchableOpacity
            style={{
              backgroundColor:
                language === 'vi' ? colors.switchActive : colors.cardBackground,
              padding: 8,
              borderRadius: 5,
              width: '45%',
            }}
            onPress={() => changeLanguageDirectly('vi')}
          >
            <Text
              style={{
                color: language === 'vi' ? '#fff' : colors.darkTextPrimary,
                textAlign: 'center',
              }}
            >
              Tiếng Việt (Direct)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              backgroundColor:
                language === 'en' ? colors.switchActive : colors.cardBackground,
              padding: 8,
              borderRadius: 5,
              width: '45%',
            }}
            onPress={() => changeLanguageDirectly('en')}
          >
            <Text
              style={{
                color: language === 'en' ? '#fff' : colors.darkTextPrimary,
                textAlign: 'center',
              }}
            >
              English (Direct)
            </Text>
          </TouchableOpacity>
        </View>
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

      {/* Đã loại bỏ phần Shift Reminder Section */}

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
