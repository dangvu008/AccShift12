'use client'

import { useContext, useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  TextInput,
  Modal,
} from 'react-native'
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons'
import { AppContext } from '../context/AppContext'
import AsyncStorage from '@react-native-async-storage/async-storage'

const SettingsScreen = ({ navigation }) => {
  const {
    t,
    darkMode,
    language,
    notificationSound,
    notificationVibration,
    alarmPermissionGranted,
    onlyGoWorkMode,
    // OT Threshold settings
    otThresholdEnabled,
    otThresholdHours,
    otRateWeekdayTier2,
    otRateSaturdayTier2,
    otRateSundayTier2,
    otRateHolidayTier2,
    // Night Work settings
    nightWorkEnabled,
    nightWorkStartTime,
    nightWorkEndTime,
    nightWorkRate,
    // OT Base Rate settings
    otRateWeekday,
    otRateSaturday,
    otRateSunday,
    otRateHoliday,
    // Night OT Calculation Rule
    nightOtCalculationRule,
    // Fixed Rate settings
    fixedRateStandardNight,
    fixedRateOtWeekdayNight,
    fixedRateOtSaturdayNight,
    fixedRateOtSundayNight,
    fixedRateOtHolidayNight,
    // Functions
    toggleDarkMode,
    changeLanguage,
    toggleNotificationSound,
    toggleNotificationVibration,
    toggleOnlyGoWorkMode,
    requestAlarmPermission,
    // OT Threshold functions
    toggleOtThresholdEnabled,
    updateOtThresholdHours,
    updateOtRateWeekdayTier2,
    updateOtRateSaturdayTier2,
    updateOtRateSundayTier2,
    updateOtRateHolidayTier2,
    // Night Work functions
    toggleNightWorkEnabled,
    updateNightWorkStartTime,
    updateNightWorkEndTime,
    updateNightWorkRate,
    // OT Base Rate functions
    updateOtRateWeekday,
    updateOtRateSaturday,
    updateOtRateSunday,
    updateOtRateHoliday,
    // Night OT Calculation Rule functions
    updateNightOtCalculationRule,
    // Fixed Rate functions
    updateFixedRateStandardNight,
    updateFixedRateOtWeekdayNight,
    updateFixedRateOtSaturdayNight,
    updateFixedRateOtSundayNight,
    updateFixedRateOtHolidayNight,
  } = useContext(AppContext)

  const languages = [
    { id: 'vi', name: 'Tiếng Việt' },
    { id: 'en', name: 'English' },
  ]

  const [showLanguageModal, setShowLanguageModal] = useState(false)
  const [showOtSettingsModal, setShowOtSettingsModal] = useState(false)
  const [showNightWorkSettingsModal, setShowNightWorkSettingsModal] =
    useState(false)
  const [showOtBaseRateModal, setShowOtBaseRateModal] = useState(false)
  const [showNightOtRuleModal, setShowNightOtRuleModal] = useState(false)
  const [showFixedRateModal, setShowFixedRateModal] = useState(false)

  // State cho các input trong modal ngưỡng OT
  const [thresholdHours, setThresholdHours] = useState(
    otThresholdHours.toString()
  )
  const [weekdayRate, setWeekdayRate] = useState(otRateWeekdayTier2.toString())
  const [saturdayRate, setSaturdayRate] = useState(
    otRateSaturdayTier2.toString()
  )
  const [sundayRate, setSundayRate] = useState(otRateSundayTier2.toString())
  const [holidayRate, setHolidayRate] = useState(otRateHolidayTier2.toString())

  // State cho các input trong modal làm đêm
  const [nightStartTime, setNightStartTime] = useState(nightWorkStartTime)
  const [nightEndTime, setNightEndTime] = useState(nightWorkEndTime)
  const [nightRate, setNightRate] = useState(nightWorkRate.toString())

  // State cho các input trong modal tỷ lệ OT cơ bản
  const [baseWeekdayRate, setBaseWeekdayRate] = useState(
    otRateWeekday.toString()
  )
  const [baseSaturdayRate, setBaseSaturdayRate] = useState(
    otRateSaturday.toString()
  )
  const [baseSundayRate, setBaseSundayRate] = useState(otRateSunday.toString())
  const [baseHolidayRate, setBaseHolidayRate] = useState(
    otRateHoliday.toString()
  )

  // State cho modal quy tắc tính lương đêm
  const [selectedRule, setSelectedRule] = useState(nightOtCalculationRule)

  // State cho các input trong modal tỷ lệ cố định
  const [fixedStandardNight, setFixedStandardNight] = useState(
    fixedRateStandardNight.toString()
  )
  const [fixedOtWeekdayNight, setFixedOtWeekdayNight] = useState(
    fixedRateOtWeekdayNight.toString()
  )
  const [fixedOtSaturdayNight, setFixedOtSaturdayNight] = useState(
    fixedRateOtSaturdayNight.toString()
  )
  const [fixedOtSundayNight, setFixedOtSundayNight] = useState(
    fixedRateOtSundayNight.toString()
  )
  const [fixedOtHolidayNight, setFixedOtHolidayNight] = useState(
    fixedRateOtHolidayNight.toString()
  )

  const handleLanguageChange = (langId) => {
    changeLanguage(langId)
    setShowLanguageModal(false)
  }

  // Hàm xử lý lưu cài đặt ngưỡng OT
  const handleSaveOtSettings = () => {
    updateOtThresholdHours(thresholdHours)
    updateOtRateWeekdayTier2(weekdayRate)
    updateOtRateSaturdayTier2(saturdayRate)
    updateOtRateSundayTier2(sundayRate)
    updateOtRateHolidayTier2(holidayRate)
    setShowOtSettingsModal(false)
  }

  // Hàm xử lý lưu cài đặt làm đêm
  const handleSaveNightWorkSettings = () => {
    updateNightWorkStartTime(nightStartTime)
    updateNightWorkEndTime(nightEndTime)
    updateNightWorkRate(nightRate)
    setShowNightWorkSettingsModal(false)
  }

  // Hàm xử lý lưu cài đặt tỷ lệ OT cơ bản
  const handleSaveOtBaseRateSettings = () => {
    updateOtRateWeekday(baseWeekdayRate)
    updateOtRateSaturday(baseSaturdayRate)
    updateOtRateSunday(baseSundayRate)
    updateOtRateHoliday(baseHolidayRate)
    setShowOtBaseRateModal(false)
  }

  // Hàm xử lý lưu cài đặt quy tắc tính lương đêm
  const handleSaveNightOtRule = () => {
    updateNightOtCalculationRule(selectedRule)
    setShowNightOtRuleModal(false)
  }

  // Hàm xử lý lưu cài đặt tỷ lệ cố định
  const handleSaveFixedRateSettings = () => {
    updateFixedRateStandardNight(fixedStandardNight)
    updateFixedRateOtWeekdayNight(fixedOtWeekdayNight)
    updateFixedRateOtSaturdayNight(fixedOtSaturdayNight)
    updateFixedRateOtSundayNight(fixedOtSundayNight)
    updateFixedRateOtHolidayNight(fixedOtHolidayNight)
    setShowFixedRateModal(false)
  }

  const [weatherAlertsEnabled, setWeatherAlertsEnabled] = useState(true)

  // Cập nhật state khi props thay đổi
  useEffect(() => {
    // Cập nhật state cho modal ngưỡng OT
    setThresholdHours(otThresholdHours.toString())
    setWeekdayRate(otRateWeekdayTier2.toString())
    setSaturdayRate(otRateSaturdayTier2.toString())
    setSundayRate(otRateSundayTier2.toString())
    setHolidayRate(otRateHolidayTier2.toString())

    // Cập nhật state cho modal làm đêm
    setNightStartTime(nightWorkStartTime)
    setNightEndTime(nightWorkEndTime)
    setNightRate(nightWorkRate.toString())

    // Cập nhật state cho modal tỷ lệ OT cơ bản
    setBaseWeekdayRate(otRateWeekday.toString())
    setBaseSaturdayRate(otRateSaturday.toString())
    setBaseSundayRate(otRateSunday.toString())
    setBaseHolidayRate(otRateHoliday.toString())

    // Cập nhật state cho modal quy tắc tính lương đêm
    setSelectedRule(nightOtCalculationRule)

    // Cập nhật state cho modal tỷ lệ cố định
    setFixedStandardNight(fixedRateStandardNight.toString())
    setFixedOtWeekdayNight(fixedRateOtWeekdayNight.toString())
    setFixedOtSaturdayNight(fixedRateOtSaturdayNight.toString())
    setFixedOtSundayNight(fixedRateOtSundayNight.toString())
    setFixedOtHolidayNight(fixedRateOtHolidayNight.toString())
  }, [
    otThresholdHours,
    otRateWeekdayTier2,
    otRateSaturdayTier2,
    otRateSundayTier2,
    otRateHolidayTier2,
    nightWorkStartTime,
    nightWorkEndTime,
    nightWorkRate,
    otRateWeekday,
    otRateSaturday,
    otRateSunday,
    otRateHoliday,
    nightOtCalculationRule,
    fixedRateStandardNight,
    fixedRateOtWeekdayNight,
    fixedRateOtSaturdayNight,
    fixedRateOtSundayNight,
    fixedRateOtHolidayNight,
  ])

  useEffect(() => {
    // Load weather alerts setting
    const loadWeatherAlertsSetting = async () => {
      try {
        const value = await AsyncStorage.getItem('weatherAlertsEnabled')
        if (value !== null) {
          setWeatherAlertsEnabled(value === 'true')
        }
      } catch (error) {
        console.error('Error loading weather alerts setting:', error)
      }
    }

    loadWeatherAlertsSetting()
  }, [])

  const toggleWeatherAlerts = (value) => {
    setWeatherAlertsEnabled(value)
    // Save setting to AsyncStorage
    AsyncStorage.setItem('weatherAlertsEnabled', value.toString())
  }

  return (
    <ScrollView style={[styles.container, darkMode && styles.darkContainer]}>
      {/* Attendance Button Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, darkMode && styles.darkText]}>
          {t('Attendance Button')}
        </Text>

        <View style={styles.settingItem}>
          <View style={styles.settingLabelContainer}>
            <Text style={[styles.settingLabel, darkMode && styles.darkText]}>
              {t('Only Go Work Mode')}
            </Text>
            <Text
              style={[
                styles.settingDescription,
                darkMode && styles.darkSubtitle,
              ]}
            >
              {t(
                'Only show Go Work button instead of the full attendance flow'
              )}
            </Text>
          </View>
          <Switch
            value={onlyGoWorkMode}
            onValueChange={toggleOnlyGoWorkMode}
            trackColor={{ false: '#767577', true: '#8a56ff' }}
            thumbColor={onlyGoWorkMode ? '#fff' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Notifications Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, darkMode && styles.darkText]}>
          {t('Notifications')}
        </Text>

        <View style={styles.settingItem}>
          <View style={styles.settingLabelContainer}>
            <Text style={[styles.settingLabel, darkMode && styles.darkText]}>
              {t('Alarm Permissions')}
            </Text>
            <Text
              style={[
                styles.settingDescription,
                darkMode && styles.darkSubtitle,
              ]}
            >
              {t(
                'Allow alarms to work even when the device is in Do Not Disturb mode'
              )}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.permissionButton,
              alarmPermissionGranted
                ? styles.permissionGrantedButton
                : styles.permissionNeededButton,
            ]}
            onPress={requestAlarmPermission}
          >
            <Text style={styles.permissionButtonText}>
              {alarmPermissionGranted ? t('Granted') : t('Request')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLabelContainer}>
            <Text style={[styles.settingLabel, darkMode && styles.darkText]}>
              {t('Notification Sound')}
            </Text>
            <Text
              style={[
                styles.settingDescription,
                darkMode && styles.darkSubtitle,
              ]}
            >
              {t('Play sound for notifications')}
            </Text>
          </View>
          <Switch
            value={notificationSound}
            onValueChange={toggleNotificationSound}
            trackColor={{ false: '#767577', true: '#8a56ff' }}
            thumbColor={notificationSound ? '#fff' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLabelContainer}>
            <Text style={[styles.settingLabel, darkMode && styles.darkText]}>
              {t('Notification Vibration')}
            </Text>
            <Text
              style={[
                styles.settingDescription,
                darkMode && styles.darkSubtitle,
              ]}
            >
              {t('Vibrate for notifications')}
            </Text>
          </View>
          <Switch
            value={notificationVibration}
            onValueChange={toggleNotificationVibration}
            trackColor={{ false: '#767577', true: '#8a56ff' }}
            thumbColor={notificationVibration ? '#fff' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Overtime Settings Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, darkMode && styles.darkText]}>
          {t('Overtime Settings')}
        </Text>

        {/* OT Base Rate Settings */}
        <TouchableOpacity
          style={[styles.menuItem, darkMode && styles.darkCard]}
          onPress={() => setShowOtBaseRateModal(true)}
        >
          <View style={styles.menuIconContainer}>
            <MaterialIcons
              name="attach-money"
              size={24}
              color={darkMode ? '#fff' : '#000'}
            />
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={[styles.menuTitle, darkMode && styles.darkText]}>
              {t('OT Base Rates')}
            </Text>
            <Text
              style={[styles.menuDescription, darkMode && styles.darkSubtitle]}
            >
              {t('Configure base OT rates for different day types')}
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={darkMode ? '#aaa' : '#999'}
          />
        </TouchableOpacity>

        {/* OT Threshold Settings */}
        <View style={styles.settingItem}>
          <View style={styles.settingLabelContainer}>
            <Text style={[styles.settingLabel, darkMode && styles.darkText]}>
              {t('Enable OT Threshold')}
            </Text>
            <Text
              style={[
                styles.settingDescription,
                darkMode && styles.darkSubtitle,
              ]}
            >
              {t('Apply different OT rates based on hours worked')}
            </Text>
          </View>
          <Switch
            value={otThresholdEnabled}
            onValueChange={toggleOtThresholdEnabled}
            trackColor={{ false: '#767577', true: '#8a56ff' }}
            thumbColor={otThresholdEnabled ? '#fff' : '#f4f3f4'}
          />
        </View>

        <TouchableOpacity
          style={[styles.menuItem, darkMode && styles.darkCard]}
          onPress={() => setShowOtSettingsModal(true)}
          disabled={!otThresholdEnabled}
        >
          <View style={styles.menuIconContainer}>
            <MaterialIcons
              name="timer"
              size={24}
              color={
                darkMode
                  ? otThresholdEnabled
                    ? '#fff'
                    : '#555'
                  : otThresholdEnabled
                  ? '#000'
                  : '#999'
              }
            />
          </View>
          <View style={styles.menuTextContainer}>
            <Text
              style={[
                styles.menuTitle,
                darkMode && styles.darkText,
                !otThresholdEnabled && styles.disabledText,
              ]}
            >
              {t('Configure OT Thresholds')}
            </Text>
            <Text
              style={[
                styles.menuDescription,
                darkMode && styles.darkSubtitle,
                !otThresholdEnabled && styles.disabledText,
              ]}
            >
              {t('Set threshold hours and rates for different day types')}
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={
              darkMode
                ? otThresholdEnabled
                  ? '#aaa'
                  : '#555'
                : otThresholdEnabled
                ? '#999'
                : '#ccc'
            }
          />
        </TouchableOpacity>

        {/* Night Work Settings */}
        <View style={styles.settingItem}>
          <View style={styles.settingLabelContainer}>
            <Text style={[styles.settingLabel, darkMode && styles.darkText]}>
              {t('Enable Night Work Calculation')}
            </Text>
            <Text
              style={[
                styles.settingDescription,
                darkMode && styles.darkSubtitle,
              ]}
            >
              {t('Calculate additional pay for night hours')}
            </Text>
          </View>
          <Switch
            value={nightWorkEnabled}
            onValueChange={toggleNightWorkEnabled}
            trackColor={{ false: '#767577', true: '#8a56ff' }}
            thumbColor={nightWorkEnabled ? '#fff' : '#f4f3f4'}
          />
        </View>

        <TouchableOpacity
          style={[styles.menuItem, darkMode && styles.darkCard]}
          onPress={() => setShowNightWorkSettingsModal(true)}
          disabled={!nightWorkEnabled}
        >
          <View style={styles.menuIconContainer}>
            <Ionicons
              name="moon-outline"
              size={24}
              color={
                darkMode
                  ? nightWorkEnabled
                    ? '#fff'
                    : '#555'
                  : nightWorkEnabled
                  ? '#000'
                  : '#999'
              }
            />
          </View>
          <View style={styles.menuTextContainer}>
            <Text
              style={[
                styles.menuTitle,
                darkMode && styles.darkText,
                !nightWorkEnabled && styles.disabledText,
              ]}
            >
              {t('Configure Night Work')}
            </Text>
            <Text
              style={[
                styles.menuDescription,
                darkMode && styles.darkSubtitle,
                !nightWorkEnabled && styles.disabledText,
              ]}
            >
              {t('Set night hours and additional rate')}
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={
              darkMode
                ? nightWorkEnabled
                  ? '#aaa'
                  : '#555'
                : nightWorkEnabled
                ? '#999'
                : '#ccc'
            }
          />
        </TouchableOpacity>

        {/* Night OT Calculation Rule */}
        <TouchableOpacity
          style={[styles.menuItem, darkMode && styles.darkCard]}
          onPress={() => setShowNightOtRuleModal(true)}
          disabled={!nightWorkEnabled}
        >
          <View style={styles.menuIconContainer}>
            <MaterialIcons
              name="calculate"
              size={24}
              color={
                darkMode
                  ? nightWorkEnabled
                    ? '#fff'
                    : '#555'
                  : nightWorkEnabled
                  ? '#000'
                  : '#999'
              }
            />
          </View>
          <View style={styles.menuTextContainer}>
            <Text
              style={[
                styles.menuTitle,
                darkMode && styles.darkText,
                !nightWorkEnabled && styles.disabledText,
              ]}
            >
              {t('Night OT Calculation Rule')}
            </Text>
            <Text
              style={[
                styles.menuDescription,
                darkMode && styles.darkSubtitle,
                !nightWorkEnabled && styles.disabledText,
              ]}
            >
              {t('Set how night OT rates are calculated')}
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={
              darkMode
                ? nightWorkEnabled
                  ? '#aaa'
                  : '#555'
                : nightWorkEnabled
                ? '#999'
                : '#ccc'
            }
          />
        </TouchableOpacity>

        {/* Fixed Rate Settings */}
        <TouchableOpacity
          style={[styles.menuItem, darkMode && styles.darkCard]}
          onPress={() => setShowFixedRateModal(true)}
          disabled={!nightWorkEnabled || nightOtCalculationRule !== 'fixed'}
        >
          <View style={styles.menuIconContainer}>
            <MaterialIcons
              name="edit"
              size={24}
              color={
                darkMode
                  ? nightWorkEnabled && nightOtCalculationRule === 'fixed'
                    ? '#fff'
                    : '#555'
                  : nightWorkEnabled && nightOtCalculationRule === 'fixed'
                  ? '#000'
                  : '#999'
              }
            />
          </View>
          <View style={styles.menuTextContainer}>
            <Text
              style={[
                styles.menuTitle,
                darkMode && styles.darkText,
                (!nightWorkEnabled || nightOtCalculationRule !== 'fixed') &&
                  styles.disabledText,
              ]}
            >
              {t('Fixed Rate Settings')}
            </Text>
            <Text
              style={[
                styles.menuDescription,
                darkMode && styles.darkSubtitle,
                (!nightWorkEnabled || nightOtCalculationRule !== 'fixed') &&
                  styles.disabledText,
              ]}
            >
              {t('Configure fixed rates for night work')}
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={
              darkMode
                ? nightWorkEnabled && nightOtCalculationRule === 'fixed'
                  ? '#aaa'
                  : '#555'
                : nightWorkEnabled && nightOtCalculationRule === 'fixed'
                ? '#999'
                : '#ccc'
            }
          />
        </TouchableOpacity>
      </View>

      {/* Weather Alerts Toggle */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, darkMode && styles.darkText]}>
          {t('Weather Settings')}
        </Text>

        <View style={styles.settingItem}>
          <View style={styles.settingLabelContainer}>
            <Text style={[styles.settingLabel, darkMode && styles.darkText]}>
              {t('Weather Alerts')}
            </Text>
            <Text
              style={[
                styles.settingDescription,
                darkMode && styles.darkSubtitle,
              ]}
            >
              {t('Get notified about weather conditions before departure')}
            </Text>
          </View>
          <Switch
            value={weatherAlertsEnabled}
            onValueChange={toggleWeatherAlerts}
            trackColor={{ false: '#767577', true: '#8a56ff' }}
            thumbColor={weatherAlertsEnabled ? '#fff' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Backup & Restore Section */}
      <TouchableOpacity
        style={[styles.menuItem, darkMode && styles.darkCard]}
        onPress={() => navigation.navigate('BackupRestore')}
      >
        <View style={styles.menuIconContainer}>
          <Ionicons
            name="cloud-outline"
            size={24}
            color={darkMode ? '#fff' : '#000'}
          />
        </View>
        <View style={styles.menuTextContainer}>
          <Text style={[styles.menuTitle, darkMode && styles.darkText]}>
            {t('Backup & Restore')}
          </Text>
          <Text
            style={[styles.menuDescription, darkMode && styles.darkSubtitle]}
          >
            {t('Backup and restore your data')}
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={darkMode ? '#aaa' : '#999'}
        />
      </TouchableOpacity>

      {/* General Settings Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, darkMode && styles.darkText]}>
          {t('General Settings')}
        </Text>

        <View style={styles.settingItem}>
          <View style={styles.settingLabelContainer}>
            <Text style={[styles.settingLabel, darkMode && styles.darkText]}>
              {t('Dark Mode')}
            </Text>
            <Text
              style={[
                styles.settingDescription,
                darkMode && styles.darkSubtitle,
              ]}
            >
              {t('Enable Dark Mode for better viewing in low light')}
            </Text>
          </View>
          <Switch
            value={darkMode}
            onValueChange={toggleDarkMode}
            trackColor={{ false: '#767577', true: '#8a56ff' }}
            thumbColor={darkMode ? '#fff' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={[styles.settingLabel, darkMode && styles.darkText]}>
            {t('Language')}
          </Text>
          <TouchableOpacity
            style={[styles.dropdown, darkMode && styles.darkDropdown]}
            onPress={() => setShowLanguageModal(true)}
          >
            <Text style={[styles.dropdownText, darkMode && styles.darkText]}>
              {languages.find((lang) => lang.id === language)?.name ||
                'Tiếng Việt'}
            </Text>
            <Ionicons
              name="chevron-down"
              size={20}
              color={darkMode ? '#fff' : '#000'}
            />
          </TouchableOpacity>
        </View>

        {/* Modal chọn ngôn ngữ */}
        {showLanguageModal && (
          <View style={styles.modalOverlay}>
            <View
              style={[styles.modalContent, darkMode && styles.darkModalContent]}
            >
              <Text style={[styles.modalTitle, darkMode && styles.darkText]}>
                {t('Select Language')}
              </Text>
              {languages.map((lang) => (
                <TouchableOpacity
                  key={lang.id}
                  style={[
                    styles.languageOption,
                    language === lang.id && styles.selectedLanguageOption,
                    darkMode && styles.darkLanguageOption,
                    language === lang.id &&
                      darkMode &&
                      styles.darkSelectedLanguageOption,
                  ]}
                  onPress={() => handleLanguageChange(lang.id)}
                >
                  <Text
                    style={[
                      styles.languageText,
                      language === lang.id && styles.selectedLanguageText,
                      darkMode && styles.darkText,
                    ]}
                  >
                    {lang.name}
                  </Text>
                  {language === lang.id && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={darkMode ? '#fff' : '#8a56ff'}
                    />
                  )}
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  darkMode && styles.darkCancelButton,
                ]}
                onPress={() => setShowLanguageModal(false)}
              >
                <Text style={styles.cancelButtonText}>{t('Cancel')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Modal cài đặt ngưỡng OT */}
        {showOtSettingsModal && (
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalContent,
                darkMode && styles.darkModalContent,
                styles.largeModalContent,
              ]}
            >
              <Text style={[styles.modalTitle, darkMode && styles.darkText]}>
                {t('OT Threshold Settings')}
              </Text>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, darkMode && styles.darkText]}>
                  {t('Threshold Hours')}
                </Text>
                <TextInput
                  style={[styles.formInput, darkMode && styles.darkFormInput]}
                  value={thresholdHours}
                  onChangeText={setThresholdHours}
                  keyboardType="numeric"
                  placeholder={t('e.g., 2')}
                  placeholderTextColor={darkMode ? '#666' : '#999'}
                />
              </View>

              <Text
                style={[styles.sectionSubtitle, darkMode && styles.darkText]}
              >
                {t('OT Rates After Threshold')}
              </Text>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, darkMode && styles.darkText]}>
                  {t('Weekday Rate (%)')}
                </Text>
                <TextInput
                  style={[styles.formInput, darkMode && styles.darkFormInput]}
                  value={weekdayRate}
                  onChangeText={setWeekdayRate}
                  keyboardType="numeric"
                  placeholder={t('e.g., 200')}
                  placeholderTextColor={darkMode ? '#666' : '#999'}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, darkMode && styles.darkText]}>
                  {t('Saturday Rate (%)')}
                </Text>
                <TextInput
                  style={[styles.formInput, darkMode && styles.darkFormInput]}
                  value={saturdayRate}
                  onChangeText={setSaturdayRate}
                  keyboardType="numeric"
                  placeholder={t('e.g., 250')}
                  placeholderTextColor={darkMode ? '#666' : '#999'}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, darkMode && styles.darkText]}>
                  {t('Sunday Rate (%)')}
                </Text>
                <TextInput
                  style={[styles.formInput, darkMode && styles.darkFormInput]}
                  value={sundayRate}
                  onChangeText={setSundayRate}
                  keyboardType="numeric"
                  placeholder={t('e.g., 250')}
                  placeholderTextColor={darkMode ? '#666' : '#999'}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, darkMode && styles.darkText]}>
                  {t('Holiday Rate (%)')}
                </Text>
                <TextInput
                  style={[styles.formInput, darkMode && styles.darkFormInput]}
                  value={holidayRate}
                  onChangeText={setHolidayRate}
                  keyboardType="numeric"
                  placeholder={t('e.g., 350')}
                  placeholderTextColor={darkMode ? '#666' : '#999'}
                />
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[
                    styles.cancelButton,
                    darkMode && styles.darkCancelButton,
                  ]}
                  onPress={() => setShowOtSettingsModal(false)}
                >
                  <Text style={styles.cancelButtonText}>{t('Cancel')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveOtSettings}
                >
                  <Text style={styles.saveButtonText}>{t('Save')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Modal cài đặt làm đêm */}
        {showNightWorkSettingsModal && (
          <View style={styles.modalOverlay}>
            <View
              style={[styles.modalContent, darkMode && styles.darkModalContent]}
            >
              <Text style={[styles.modalTitle, darkMode && styles.darkText]}>
                {t('Night Work Settings')}
              </Text>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, darkMode && styles.darkText]}>
                  {t('Night Start Time')}
                </Text>
                <TextInput
                  style={[styles.formInput, darkMode && styles.darkFormInput]}
                  value={nightStartTime}
                  onChangeText={setNightStartTime}
                  placeholder="22:00"
                  placeholderTextColor={darkMode ? '#666' : '#999'}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, darkMode && styles.darkText]}>
                  {t('Night End Time')}
                </Text>
                <TextInput
                  style={[styles.formInput, darkMode && styles.darkFormInput]}
                  value={nightEndTime}
                  onChangeText={setNightEndTime}
                  placeholder="05:00"
                  placeholderTextColor={darkMode ? '#666' : '#999'}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, darkMode && styles.darkText]}>
                  {t('Night Rate (%)')}
                </Text>
                <TextInput
                  style={[styles.formInput, darkMode && styles.darkFormInput]}
                  value={nightRate}
                  onChangeText={setNightRate}
                  keyboardType="numeric"
                  placeholder={t('e.g., 30')}
                  placeholderTextColor={darkMode ? '#666' : '#999'}
                />
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[
                    styles.cancelButton,
                    darkMode && styles.darkCancelButton,
                  ]}
                  onPress={() => setShowNightWorkSettingsModal(false)}
                >
                  <Text style={styles.cancelButtonText}>{t('Cancel')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveNightWorkSettings}
                >
                  <Text style={styles.saveButtonText}>{t('Save')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Modal cài đặt tỷ lệ OT cơ bản */}
        {showOtBaseRateModal && (
          <View style={styles.modalOverlay}>
            <View
              style={[styles.modalContent, darkMode && styles.darkModalContent]}
            >
              <Text style={[styles.modalTitle, darkMode && styles.darkText]}>
                {t('OT Base Rate Settings')}
              </Text>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, darkMode && styles.darkText]}>
                  {t('Weekday OT Rate (%)')}
                </Text>
                <TextInput
                  style={[styles.formInput, darkMode && styles.darkFormInput]}
                  value={baseWeekdayRate}
                  onChangeText={setBaseWeekdayRate}
                  keyboardType="numeric"
                  placeholder={t('e.g., 150')}
                  placeholderTextColor={darkMode ? '#666' : '#999'}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, darkMode && styles.darkText]}>
                  {t('Saturday OT Rate (%)')}
                </Text>
                <TextInput
                  style={[styles.formInput, darkMode && styles.darkFormInput]}
                  value={baseSaturdayRate}
                  onChangeText={setBaseSaturdayRate}
                  keyboardType="numeric"
                  placeholder={t('e.g., 200')}
                  placeholderTextColor={darkMode ? '#666' : '#999'}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, darkMode && styles.darkText]}>
                  {t('Sunday OT Rate (%)')}
                </Text>
                <TextInput
                  style={[styles.formInput, darkMode && styles.darkFormInput]}
                  value={baseSundayRate}
                  onChangeText={setBaseSundayRate}
                  keyboardType="numeric"
                  placeholder={t('e.g., 200')}
                  placeholderTextColor={darkMode ? '#666' : '#999'}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, darkMode && styles.darkText]}>
                  {t('Holiday OT Rate (%)')}
                </Text>
                <TextInput
                  style={[styles.formInput, darkMode && styles.darkFormInput]}
                  value={baseHolidayRate}
                  onChangeText={setBaseHolidayRate}
                  keyboardType="numeric"
                  placeholder={t('e.g., 300')}
                  placeholderTextColor={darkMode ? '#666' : '#999'}
                />
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[
                    styles.cancelButton,
                    darkMode && styles.darkCancelButton,
                  ]}
                  onPress={() => setShowOtBaseRateModal(false)}
                >
                  <Text style={styles.cancelButtonText}>{t('Cancel')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveOtBaseRateSettings}
                >
                  <Text style={styles.saveButtonText}>{t('Save')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Modal cài đặt quy tắc tính lương đêm */}
        {showNightOtRuleModal && (
          <View style={styles.modalOverlay}>
            <View
              style={[styles.modalContent, darkMode && styles.darkModalContent]}
            >
              <Text style={[styles.modalTitle, darkMode && styles.darkText]}>
                {t('Night OT Calculation Rule')}
              </Text>

              <TouchableOpacity
                style={[
                  styles.ruleOption,
                  selectedRule === 'base' && styles.selectedRuleOption,
                  darkMode && styles.darkRuleOption,
                  selectedRule === 'base' &&
                    darkMode &&
                    styles.darkSelectedRuleOption,
                ]}
                onPress={() => setSelectedRule('base')}
              >
                <View style={styles.ruleTextContainer}>
                  <Text
                    style={[
                      styles.ruleTitle,
                      selectedRule === 'base' && styles.selectedRuleText,
                      darkMode && styles.darkText,
                    ]}
                  >
                    {t('Base Rate Only')}
                  </Text>
                  <Text
                    style={[
                      styles.ruleDescription,
                      darkMode && styles.darkSubtitle,
                    ]}
                  >
                    {t('Use only base OT rate (e.g., 150%)')}
                  </Text>
                </View>
                {selectedRule === 'base' && (
                  <Ionicons
                    name="checkmark"
                    size={20}
                    color={darkMode ? '#fff' : '#8a56ff'}
                  />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.ruleOption,
                  selectedRule === 'sum' && styles.selectedRuleOption,
                  darkMode && styles.darkRuleOption,
                  selectedRule === 'sum' &&
                    darkMode &&
                    styles.darkSelectedRuleOption,
                ]}
                onPress={() => setSelectedRule('sum')}
              >
                <View style={styles.ruleTextContainer}>
                  <Text
                    style={[
                      styles.ruleTitle,
                      selectedRule === 'sum' && styles.selectedRuleText,
                      darkMode && styles.darkText,
                    ]}
                  >
                    {t('Sum')}
                  </Text>
                  <Text
                    style={[
                      styles.ruleDescription,
                      darkMode && styles.darkSubtitle,
                    ]}
                  >
                    {t('Base Rate + Night Premium (e.g., 150% + 30% = 180%)')}
                  </Text>
                </View>
                {selectedRule === 'sum' && (
                  <Ionicons
                    name="checkmark"
                    size={20}
                    color={darkMode ? '#fff' : '#8a56ff'}
                  />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.ruleOption,
                  selectedRule === 'multiply' && styles.selectedRuleOption,
                  darkMode && styles.darkRuleOption,
                  selectedRule === 'multiply' &&
                    darkMode &&
                    styles.darkSelectedRuleOption,
                ]}
                onPress={() => setSelectedRule('multiply')}
              >
                <View style={styles.ruleTextContainer}>
                  <Text
                    style={[
                      styles.ruleTitle,
                      selectedRule === 'multiply' && styles.selectedRuleText,
                      darkMode && styles.darkText,
                    ]}
                  >
                    {t('Multiply')}
                  </Text>
                  <Text
                    style={[
                      styles.ruleDescription,
                      darkMode && styles.darkSubtitle,
                    ]}
                  >
                    {t(
                      'Base Rate * (1 + Night Premium/100) (e.g., 150% * 1.3 = 195%)'
                    )}
                  </Text>
                </View>
                {selectedRule === 'multiply' && (
                  <Ionicons
                    name="checkmark"
                    size={20}
                    color={darkMode ? '#fff' : '#8a56ff'}
                  />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.ruleOption,
                  selectedRule === 'fixed' && styles.selectedRuleOption,
                  darkMode && styles.darkRuleOption,
                  selectedRule === 'fixed' &&
                    darkMode &&
                    styles.darkSelectedRuleOption,
                ]}
                onPress={() => setSelectedRule('fixed')}
              >
                <View style={styles.ruleTextContainer}>
                  <Text
                    style={[
                      styles.ruleTitle,
                      selectedRule === 'fixed' && styles.selectedRuleText,
                      darkMode && styles.darkText,
                    ]}
                  >
                    {t('Fixed Rate')}
                  </Text>
                  <Text
                    style={[
                      styles.ruleDescription,
                      darkMode && styles.darkSubtitle,
                    ]}
                  >
                    {t(
                      'Use fixed rates for each type (e.g., 210%, 270%, 390%)'
                    )}
                  </Text>
                </View>
                {selectedRule === 'fixed' && (
                  <Ionicons
                    name="checkmark"
                    size={20}
                    color={darkMode ? '#fff' : '#8a56ff'}
                  />
                )}
              </TouchableOpacity>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[
                    styles.cancelButton,
                    darkMode && styles.darkCancelButton,
                  ]}
                  onPress={() => setShowNightOtRuleModal(false)}
                >
                  <Text style={styles.cancelButtonText}>{t('Cancel')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveNightOtRule}
                >
                  <Text style={styles.saveButtonText}>{t('Save')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Modal cài đặt tỷ lệ cố định */}
        {showFixedRateModal && (
          <View style={styles.modalOverlay}>
            <View
              style={[styles.modalContent, darkMode && styles.darkModalContent]}
            >
              <Text style={[styles.modalTitle, darkMode && styles.darkText]}>
                {t('Fixed Rate Settings')}
              </Text>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, darkMode && styles.darkText]}>
                  {t('Standard Night Rate (%)')}
                </Text>
                <TextInput
                  style={[styles.formInput, darkMode && styles.darkFormInput]}
                  value={fixedStandardNight}
                  onChangeText={setFixedStandardNight}
                  keyboardType="numeric"
                  placeholder={t('e.g., 130')}
                  placeholderTextColor={darkMode ? '#666' : '#999'}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, darkMode && styles.darkText]}>
                  {t('Weekday Night OT Rate (%)')}
                </Text>
                <TextInput
                  style={[styles.formInput, darkMode && styles.darkFormInput]}
                  value={fixedOtWeekdayNight}
                  onChangeText={setFixedOtWeekdayNight}
                  keyboardType="numeric"
                  placeholder={t('e.g., 210')}
                  placeholderTextColor={darkMode ? '#666' : '#999'}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, darkMode && styles.darkText]}>
                  {t('Saturday Night OT Rate (%)')}
                </Text>
                <TextInput
                  style={[styles.formInput, darkMode && styles.darkFormInput]}
                  value={fixedOtSaturdayNight}
                  onChangeText={setFixedOtSaturdayNight}
                  keyboardType="numeric"
                  placeholder={t('e.g., 270')}
                  placeholderTextColor={darkMode ? '#666' : '#999'}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, darkMode && styles.darkText]}>
                  {t('Sunday Night OT Rate (%)')}
                </Text>
                <TextInput
                  style={[styles.formInput, darkMode && styles.darkFormInput]}
                  value={fixedOtSundayNight}
                  onChangeText={setFixedOtSundayNight}
                  keyboardType="numeric"
                  placeholder={t('e.g., 270')}
                  placeholderTextColor={darkMode ? '#666' : '#999'}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, darkMode && styles.darkText]}>
                  {t('Holiday Night OT Rate (%)')}
                </Text>
                <TextInput
                  style={[styles.formInput, darkMode && styles.darkFormInput]}
                  value={fixedOtHolidayNight}
                  onChangeText={setFixedOtHolidayNight}
                  keyboardType="numeric"
                  placeholder={t('e.g., 390')}
                  placeholderTextColor={darkMode ? '#666' : '#999'}
                />
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[
                    styles.cancelButton,
                    darkMode && styles.darkCancelButton,
                  ]}
                  onPress={() => setShowFixedRateModal(false)}
                >
                  <Text style={styles.cancelButtonText}>{t('Cancel')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveFixedRateSettings}
                >
                  <Text style={styles.saveButtonText}>{t('Save')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={[styles.appVersion, darkMode && styles.darkSubtitle]}>
          AccShift v1.0.0
        </Text>
        <Text style={[styles.appCopyright, darkMode && styles.darkSubtitle]}>
          © 2025 AccShift
        </Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  darkText: {
    color: '#fff',
  },
  darkSubtitle: {
    color: '#aaa',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  darkCard: {
    backgroundColor: '#1e1e1e',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingLabelContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: '#000',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: '#666',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  darkDropdown: {
    backgroundColor: '#2a2a2a',
  },
  dropdownText: {
    fontSize: 14,
    color: '#000',
    marginRight: 8,
  },
  permissionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  permissionNeededButton: {
    backgroundColor: '#f39c12',
  },
  permissionGrantedButton: {
    backgroundColor: '#27ae60',
  },
  permissionButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  menuDescription: {
    fontSize: 14,
    color: '#666',
  },
  disabledText: {
    color: '#999',
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  appVersion: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  appCopyright: {
    fontSize: 12,
    color: '#999',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    maxHeight: '80%',
  },
  largeModalContent: {
    width: '90%',
  },
  darkModalContent: {
    backgroundColor: '#2a2a2a',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f0f0f0',
  },
  darkLanguageOption: {
    backgroundColor: '#3a3a3a',
  },
  selectedLanguageOption: {
    backgroundColor: '#e6e0ff',
  },
  darkSelectedLanguageOption: {
    backgroundColor: '#4a3b80',
  },
  languageText: {
    fontSize: 16,
    color: '#333',
  },
  selectedLanguageText: {
    fontWeight: 'bold',
    color: '#8a56ff',
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  darkFormInput: {
    backgroundColor: '#333',
    borderColor: '#444',
    color: '#fff',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  darkCancelButton: {
    backgroundColor: '#3a3a3a',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#8a56ff',
    fontWeight: 'bold',
  },
  saveButton: {
    flex: 1,
    marginLeft: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#8a56ff',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  ruleOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#f0f0f0',
  },
  darkRuleOption: {
    backgroundColor: '#3a3a3a',
  },
  selectedRuleOption: {
    backgroundColor: '#e6e0ff',
  },
  darkSelectedRuleOption: {
    backgroundColor: '#4a3b80',
  },
  ruleTextContainer: {
    flex: 1,
  },
  ruleTitle: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginBottom: 4,
  },
  selectedRuleText: {
    fontWeight: 'bold',
    color: '#8a56ff',
  },
  ruleDescription: {
    fontSize: 12,
    color: '#666',
  },
})

export default SettingsScreen
