'use client'

import { createContext, useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Notifications from 'expo-notifications'
import * as Location from 'expo-location'
import {
  getShifts,
  getCheckInHistory,
  getCurrentShift,
  getNotes,
  addNote,
  updateNote,
  deleteNote,
} from '../utils/database'
import { translations } from '../utils/translations'
import { getWeatherData, formatDate } from '../utils/helpers'
// Thêm import alarmManager
import alarmManager from '../utils/alarmManager'
import { Platform, Alert } from 'react-native'
// Thêm import location utilities
import locationUtils from '../utils/location'
// Thêm import weather alert service
import weatherAlertService from '../services/weatherAlertService'
// Import STORAGE_KEYS
import { STORAGE_KEYS } from '../utils/constants'
// Import theme
import { getTheme } from '../utils/theme'
// Import storage manager
import { storage } from '../utils/storage'

export const AppContext = createContext()

// Multi-Function Button states
export const BUTTON_STATES = {
  GO_WORK: 'go_work',
  WAITING_CHECK_IN: 'waiting_check_in',
  CHECK_IN: 'check_in',
  WORKING: 'working',
  CHECK_OUT: 'check_out',
  READY_COMPLETE: 'ready_complete',
  COMPLETE: 'complete',
  COMPLETED: 'completed',
}

export const AppProvider = ({ children }) => {
  const [language, setLanguage] = useState('vi')
  const [darkMode, setDarkMode] = useState(true)
  const [currentShift, setCurrentShift] = useState(null)
  const [checkInHistory, setCheckInHistory] = useState([])
  const [shifts, setShifts] = useState([])
  const [notes, setNotes] = useState([])
  const [weatherData, setWeatherData] = useState({})
  const [weatherAlerts, setWeatherAlerts] = useState([])
  const [notificationSound, setNotificationSound] = useState(true)
  const [notificationVibration, setNotificationVibration] = useState(true)
  const [isWorking, setIsWorking] = useState(false)
  const [workStartTime, setWorkStartTime] = useState(null)
  const [alarmPermissionGranted, setAlarmPermissionGranted] = useState(false)

  // Lấy theme dựa trên chế độ sáng/tối
  const theme = getTheme(darkMode)

  // Location states
  const [homeLocation, setHomeLocation] = useState(null)
  const [workLocation, setWorkLocation] = useState(null)
  const [locationPermissionGranted, setLocationPermissionGranted] =
    useState(false)

  // Multi-Function Button states
  const [buttonState, setButtonState] = useState(BUTTON_STATES.GO_WORK)
  const [attendanceLogs, setAttendanceLogs] = useState([])
  const [onlyGoWorkMode, setOnlyGoWorkMode] = useState(false)
  const [showPunchButton, setShowPunchButton] = useState(false)

  // OT Threshold settings
  const [otThresholdEnabled, setOtThresholdEnabled] = useState(false)
  const [otThresholdHours, setOtThresholdHours] = useState(2)
  const [otRateWeekdayTier2, setOtRateWeekdayTier2] = useState(200)
  const [otRateSaturdayTier2, setOtRateSaturdayTier2] = useState(250)
  const [otRateSundayTier2, setOtRateSundayTier2] = useState(250)
  const [otRateHolidayTier2, setOtRateHolidayTier2] = useState(350)

  // Night Work settings
  const [nightWorkEnabled, setNightWorkEnabled] = useState(true)
  const [nightWorkStartTime, setNightWorkStartTime] = useState('22:00')
  const [nightWorkEndTime, setNightWorkEndTime] = useState('05:00')
  const [nightWorkRate, setNightWorkRate] = useState(30)

  // OT Base Rate settings
  const [otRateWeekday, setOtRateWeekday] = useState(150)
  const [otRateSaturday, setOtRateSaturday] = useState(200)
  const [otRateSunday, setOtRateSunday] = useState(200)
  const [otRateHoliday, setOtRateHoliday] = useState(300)

  // Night OT Calculation Rule
  const [nightOtCalculationRule, setNightOtCalculationRule] = useState('sum')

  // Fixed Rate settings
  const [fixedRateStandardNight, setFixedRateStandardNight] = useState(130)
  const [fixedRateOtWeekdayNight, setFixedRateOtWeekdayNight] = useState(210)
  const [fixedRateOtSaturdayNight, setFixedRateOtSaturdayNight] = useState(270)
  const [fixedRateOtSundayNight, setFixedRateOtSundayNight] = useState(270)
  const [fixedRateOtHolidayNight, setFixedRateOtHolidayNight] = useState(390)

  useEffect(() => {
    let isMounted = true

    const loadSettings = async () => {
      try {
        if (!isMounted) return

        // Tải cài đặt người dùng từ storage
        const userSettings = await storage.getUserSettings()
        if (userSettings && isMounted) {
          // Cài đặt ngôn ngữ
          if (userSettings.language) setLanguage(userSettings.language)

          // Cài đặt giao diện
          if (userSettings.theme === 'dark' || userSettings.theme === 'light') {
            setDarkMode(userSettings.theme === 'dark')
          }

          // Cài đặt thông báo
          if (userSettings.alarmSoundEnabled !== undefined) {
            setNotificationSound(userSettings.alarmSoundEnabled)
          }

          if (userSettings.alarmVibrationEnabled !== undefined) {
            setNotificationVibration(userSettings.alarmVibrationEnabled)
          }

          // Cài đặt chế độ nút đi làm
          if (userSettings.multiButtonMode !== undefined) {
            setOnlyGoWorkMode(userSettings.multiButtonMode === 'simple')
          }

          // Cài đặt ngưỡng OT
          if (userSettings.otThresholdEnabled !== undefined) {
            setOtThresholdEnabled(userSettings.otThresholdEnabled)
          }

          if (userSettings.otThresholdHours !== undefined) {
            setOtThresholdHours(userSettings.otThresholdHours)
          }

          if (userSettings.otRateWeekdayTier2 !== undefined) {
            setOtRateWeekdayTier2(userSettings.otRateWeekdayTier2)
          }

          if (userSettings.otRateSaturdayTier2 !== undefined) {
            setOtRateSaturdayTier2(userSettings.otRateSaturdayTier2)
          }

          if (userSettings.otRateSundayTier2 !== undefined) {
            setOtRateSundayTier2(userSettings.otRateSundayTier2)
          }

          if (userSettings.otRateHolidayTier2 !== undefined) {
            setOtRateHolidayTier2(userSettings.otRateHolidayTier2)
          }

          // Cài đặt làm đêm
          if (userSettings.nightWorkEnabled !== undefined) {
            setNightWorkEnabled(userSettings.nightWorkEnabled)
          }

          if (userSettings.nightWorkStartTime) {
            setNightWorkStartTime(userSettings.nightWorkStartTime)
          }

          if (userSettings.nightWorkEndTime) {
            setNightWorkEndTime(userSettings.nightWorkEndTime)
          }

          if (userSettings.nightWorkRate !== undefined) {
            setNightWorkRate(userSettings.nightWorkRate)
          }

          // Cài đặt tỷ lệ OT cơ bản
          if (userSettings.otRateWeekday !== undefined) {
            setOtRateWeekday(userSettings.otRateWeekday)
          }

          if (userSettings.otRateSaturday !== undefined) {
            setOtRateSaturday(userSettings.otRateSaturday)
          }

          if (userSettings.otRateSunday !== undefined) {
            setOtRateSunday(userSettings.otRateSunday)
          }

          if (userSettings.otRateHoliday !== undefined) {
            setOtRateHoliday(userSettings.otRateHoliday)
          }

          // Cài đặt quy tắc tính lương đêm
          if (userSettings.nightOtCalculationRule) {
            setNightOtCalculationRule(userSettings.nightOtCalculationRule)
          }

          // Cài đặt tỷ lệ cố định
          if (userSettings.fixedRateStandardNight !== undefined) {
            setFixedRateStandardNight(userSettings.fixedRateStandardNight)
          }

          if (userSettings.fixedRateOtWeekdayNight !== undefined) {
            setFixedRateOtWeekdayNight(userSettings.fixedRateOtWeekdayNight)
          }

          if (userSettings.fixedRateOtSaturdayNight !== undefined) {
            setFixedRateOtSaturdayNight(userSettings.fixedRateOtSaturdayNight)
          }

          if (userSettings.fixedRateOtSundayNight !== undefined) {
            setFixedRateOtSundayNight(userSettings.fixedRateOtSundayNight)
          }

          if (userSettings.fixedRateOtHolidayNight !== undefined) {
            setFixedRateOtHolidayNight(userSettings.fixedRateOtHolidayNight)
          }
        } else {
          // Tải từ AsyncStorage cũ nếu không có userSettings
          const storedLanguage = await AsyncStorage.getItem('language')
          if (storedLanguage && isMounted) setLanguage(storedLanguage)

          const storedDarkMode = await AsyncStorage.getItem('darkMode')
          if (storedDarkMode && isMounted)
            setDarkMode(storedDarkMode === 'true')

          const storedNotificationSound = await AsyncStorage.getItem(
            'notificationSound'
          )
          if (storedNotificationSound && isMounted)
            setNotificationSound(storedNotificationSound === 'true')

          const storedNotificationVibration = await AsyncStorage.getItem(
            'notificationVibration'
          )
          if (storedNotificationVibration && isMounted)
            setNotificationVibration(storedNotificationVibration === 'true')

          // Load Multi-Function Button settings
          const storedOnlyGoWorkMode = await AsyncStorage.getItem(
            'onlyGoWorkMode'
          )
          if (storedOnlyGoWorkMode && isMounted)
            setOnlyGoWorkMode(storedOnlyGoWorkMode === 'true')
        }

        // Load shifts
        const loadedShifts = await getShifts()
        if (isMounted) setShifts(loadedShifts)

        // Load check-in history
        const history = await getCheckInHistory()
        if (isMounted) setCheckInHistory(history)

        // Load notes
        const loadedNotes = await getNotes()
        if (isMounted) setNotes(loadedNotes)

        // Get current shift if any
        const shift = await getCurrentShift()
        if (isMounted) {
          // Cập nhật currentShift mà không gây ra vòng lặp vô hạn
          setCurrentShift(shift)

          // Set showPunchButton based on current shift
          if (shift && shift.showCheckInButtonWhileWorking) {
            setShowPunchButton(true)
          }
        }

        // Check if currently working
        const workingStatus = await AsyncStorage.getItem('isWorking')
        if (workingStatus === 'true' && isMounted) {
          setIsWorking(true)
          const startTime = await AsyncStorage.getItem('workStartTime')
          if (startTime && isMounted)
            setWorkStartTime(new Date(Number.parseInt(startTime)))
        }

        try {
          // Load weather data - Bọc trong try-catch riêng để không ảnh hưởng đến các phần khác
          const weather = await getWeatherData()
          if (isMounted) setWeatherData(weather)
        } catch (weatherError) {
          console.error('Error loading weather data:', weatherError)
        }

        try {
          // Lấy cảnh báo thời tiết chưa đọc
          const unreadAlerts = await weatherAlertService.getWeatherAlerts(true)
          if (unreadAlerts && unreadAlerts.length > 0 && isMounted) {
            setWeatherAlerts(unreadAlerts)
          }
        } catch (alertError) {
          console.error('Error loading weather alerts:', alertError)
        }

        try {
          // Lên lịch kiểm tra thời tiết cho ca hiện tại
          if (shift && isMounted) {
            await weatherAlertService.scheduleWeatherCheck(shift)
          }
        } catch (scheduleError) {
          console.error('Error scheduling weather check:', scheduleError)
        }

        // Check notification permissions
        const { status } = await Notifications.getPermissionsAsync()
        if (isMounted) setAlarmPermissionGranted(status === 'granted')

        try {
          // Load saved locations
          const savedHomeLocation = await locationUtils.getHomeLocation()
          if (savedHomeLocation && isMounted) {
            setHomeLocation(savedHomeLocation)
          }

          const savedWorkLocation = await locationUtils.getWorkLocation()
          if (savedWorkLocation && isMounted) {
            setWorkLocation(savedWorkLocation)
          }

          // Check location permission
          const locationPermission =
            await Location.getForegroundPermissionsAsync()
          if (isMounted)
            setLocationPermissionGranted(
              locationPermission.status === 'granted'
            )
        } catch (locationError) {
          console.error('Error loading location data:', locationError)
        }

        // Load today's attendance logs
        const today = formatDate(new Date())
        const storedLogs = await AsyncStorage.getItem(`attendanceLogs_${today}`)
        if (storedLogs && isMounted) {
          const logs = JSON.parse(storedLogs)
          setAttendanceLogs(logs)

          // Set button state based on the last log
          if (logs.length > 0) {
            const lastLog = logs[logs.length - 1]
            switch (lastLog.type) {
              case 'go_work':
                setButtonState(BUTTON_STATES.WAITING_CHECK_IN)
                break
              case 'check_in':
                setButtonState(BUTTON_STATES.WORKING)
                break
              case 'check_out':
                setButtonState(BUTTON_STATES.READY_COMPLETE)
                break
              case 'complete':
                setButtonState(BUTTON_STATES.COMPLETED)
                break
              default:
                setButtonState(BUTTON_STATES.GO_WORK)
            }
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error)
      }
    }

    loadSettings()

    // Cleanup function
    return () => {
      isMounted = false
    }
  }, [])

  const saveSettings = async (key, value) => {
    try {
      await AsyncStorage.setItem(
        key,
        typeof value === 'boolean' ? value.toString() : value
      )
    } catch (error) {
      console.error('Error saving settings:', error)
    }
  }

  const changeLanguage = async (lang) => {
    try {
      console.log('AppContext: Changing language to:', lang)

      // Kiểm tra xem ngôn ngữ có hợp lệ không
      if (lang !== 'vi' && lang !== 'en') {
        console.error('Invalid language code:', lang)
        return false
      }

      // Cập nhật state
      setLanguage(lang)

      // Lưu vào AsyncStorage
      await saveSettings('language', lang)

      // Cập nhật cài đặt trong storage
      await storage.updateUserSettings({ language: lang })

      // Đảm bảo cập nhật đồng bộ
      await AsyncStorage.setItem('language', lang)

      // Đọc lại để xác nhận
      const storedLanguage = await AsyncStorage.getItem('language')

      // Log để debug
      console.log('AppContext: Language successfully changed to:', lang)
      console.log('AppContext: Current language after change:', lang)
      console.log('AppContext: Language in AsyncStorage:', storedLanguage)

      // Force re-render của context
      setLanguage(storedLanguage)

      return true
    } catch (error) {
      console.error('Error in AppContext.changeLanguage:', error)
      return false
    }
  }

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    saveSettings('darkMode', !darkMode)
  }

  const toggleNotificationSound = () => {
    setNotificationSound(!notificationSound)
    saveSettings('notificationSound', !notificationSound)
  }

  const toggleNotificationVibration = () => {
    setNotificationVibration(!notificationVibration)
    saveSettings('notificationVibration', !notificationVibration)
  }

  const toggleOnlyGoWorkMode = () => {
    setOnlyGoWorkMode(!onlyGoWorkMode)
    saveSettings('onlyGoWorkMode', !onlyGoWorkMode)

    // Cập nhật cài đặt trong storage
    storage.updateUserSettings({
      multiButtonMode: !onlyGoWorkMode ? 'simple' : 'full',
    })
  }

  // Hàm xử lý cài đặt ngưỡng OT
  const toggleOtThresholdEnabled = () => {
    const newValue = !otThresholdEnabled
    setOtThresholdEnabled(newValue)
    storage.updateUserSettings({ otThresholdEnabled: newValue })
  }

  const updateOtThresholdHours = (hours) => {
    const numericHours = parseFloat(hours)
    if (!isNaN(numericHours) && numericHours >= 0) {
      setOtThresholdHours(numericHours)
      storage.updateUserSettings({ otThresholdHours: numericHours })
    }
  }

  const updateOtRateWeekdayTier2 = (rate) => {
    const numericRate = parseInt(rate)
    if (!isNaN(numericRate) && numericRate >= 100) {
      setOtRateWeekdayTier2(numericRate)
      storage.updateUserSettings({ otRateWeekdayTier2: numericRate })
    }
  }

  const updateOtRateSaturdayTier2 = (rate) => {
    const numericRate = parseInt(rate)
    if (!isNaN(numericRate) && numericRate >= 100) {
      setOtRateSaturdayTier2(numericRate)
      storage.updateUserSettings({ otRateSaturdayTier2: numericRate })
    }
  }

  const updateOtRateSundayTier2 = (rate) => {
    const numericRate = parseInt(rate)
    if (!isNaN(numericRate) && numericRate >= 100) {
      setOtRateSundayTier2(numericRate)
      storage.updateUserSettings({ otRateSundayTier2: numericRate })
    }
  }

  const updateOtRateHolidayTier2 = (rate) => {
    const numericRate = parseInt(rate)
    if (!isNaN(numericRate) && numericRate >= 100) {
      setOtRateHolidayTier2(numericRate)
      storage.updateUserSettings({ otRateHolidayTier2: numericRate })
    }
  }

  // Hàm xử lý cài đặt làm đêm
  const toggleNightWorkEnabled = () => {
    const newValue = !nightWorkEnabled
    setNightWorkEnabled(newValue)
    storage.updateUserSettings({ nightWorkEnabled: newValue })
  }

  const updateNightWorkStartTime = (time) => {
    if (time && /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
      setNightWorkStartTime(time)
      storage.updateUserSettings({ nightWorkStartTime: time })
    }
  }

  const updateNightWorkEndTime = (time) => {
    if (time && /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
      setNightWorkEndTime(time)
      storage.updateUserSettings({ nightWorkEndTime: time })
    }
  }

  const updateNightWorkRate = (rate) => {
    const numericRate = parseInt(rate)
    if (!isNaN(numericRate) && numericRate >= 0) {
      setNightWorkRate(numericRate)
      storage.updateUserSettings({ nightWorkRate: numericRate })
    }
  }

  // Hàm xử lý cài đặt tỷ lệ OT cơ bản
  const updateOtRateWeekday = (rate) => {
    const validRate = parseNumericInput(rate)
    if (validRate) {
      setOtRateWeekday(validRate)
      storage
        .updateUserSettings({
          otRateWeekday: validRate,
        })
        .catch((err) => console.error('Failed to save OT weekday rate:', err))
    }
  }

  const updateOtRateSaturday = (rate) => {
    const validRate = parseNumericInput(rate)
    if (validRate) {
      setOtRateSaturday(validRate)
      storage
        .updateUserSettings({
          otRateSaturday: validRate,
        })
        .catch((err) => console.error('Failed to save OT Saturday rate:', err))
    }
  }

  const updateOtRateSunday = (rate) => {
    const validRate = parseNumericInput(rate)
    if (validRate) {
      setOtRateSunday(validRate)
      storage
        .updateUserSettings({
          otRateSunday: validRate,
        })
        .catch((err) => console.error('Failed to save OT Sunday rate:', err))
    }
  }

  const updateOtRateHoliday = (rate) => {
    const validRate = parseNumericInput(rate)
    if (validRate) {
      setOtRateHoliday(validRate)
      storage
        .updateUserSettings({
          otRateHoliday: validRate,
        })
        .catch((err) => console.error('Failed to save OT Holiday rate:', err))
    }
  }

  // Hàm xử lý cài đặt quy tắc tính lương đêm
  const updateNightOtCalculationRule = (rule) => {
    if (['sum', 'multiply', 'fixed', 'base'].includes(rule)) {
      setNightOtCalculationRule(rule)
      storage.updateUserSettings({ nightOtCalculationRule: rule })
    }
  }

  // Hàm xử lý cài đặt tỷ lệ cố định
  const updateFixedRateStandardNight = (rate) => {
    const numericRate = parseInt(rate)
    if (!isNaN(numericRate) && numericRate >= 100) {
      setFixedRateStandardNight(numericRate)
      storage.updateUserSettings({ fixedRateStandardNight: numericRate })
    }
  }

  const updateFixedRateOtWeekdayNight = (rate) => {
    const numericRate = parseInt(rate)
    if (!isNaN(numericRate) && numericRate >= 100) {
      setFixedRateOtWeekdayNight(numericRate)
      storage.updateUserSettings({ fixedRateOtWeekdayNight: numericRate })
    }
  }

  const updateFixedRateOtSaturdayNight = (rate) => {
    const numericRate = parseInt(rate)
    if (!isNaN(numericRate) && numericRate >= 100) {
      setFixedRateOtSaturdayNight(numericRate)
      storage.updateUserSettings({ fixedRateOtSaturdayNight: numericRate })
    }
  }

  const updateFixedRateOtSundayNight = (rate) => {
    const numericRate = parseInt(rate)
    if (!isNaN(numericRate) && numericRate >= 100) {
      setFixedRateOtSundayNight(numericRate)
      storage.updateUserSettings({ fixedRateOtSundayNight: numericRate })
    }
  }

  const updateFixedRateOtHolidayNight = (rate) => {
    const numericRate = parseInt(rate)
    if (!isNaN(numericRate) && numericRate >= 100) {
      setFixedRateOtHolidayNight(numericRate)
      storage.updateUserSettings({ fixedRateOtHolidayNight: numericRate })
    }
  }

  const updateCurrentShift = async (shift) => {
    // Lưu thông tin ca cũ trước khi cập nhật
    const oldShift = currentShift

    // Cập nhật state và AsyncStorage
    setCurrentShift(shift)

    if (shift) {
      // Lưu ID ca mới vào AsyncStorage
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_SHIFT, shift.id)

      // Cập nhật activeShiftId trong userSettings
      await storage.updateUserSettings({ activeShiftId: shift.id })

      // Nếu đang ở chế độ xoay ca tự động, cập nhật ngày áp dụng
      const userSettings = await storage.getUserSettings()
      if (userSettings && userSettings.changeShiftReminderMode === 'rotate') {
        await updateMultipleSettings({
          rotationLastAppliedDate: new Date().toISOString().split('T')[0],
        })
      }

      // Hủy tất cả thông báo liên quan đến ca cũ
      if (oldShift) {
        console.log(`Hủy thông báo của ca cũ: ${oldShift.id}`)
        await alarmManager.cancelAlarmsByPrefix(`shift_${oldShift.id}`)
        await alarmManager.cancelAlarmsByPrefix(`check_in_${oldShift.id}`)
        await alarmManager.cancelAlarmsByPrefix(`check_out_${oldShift.id}`)
      }

      // Lên lịch thông báo mới cho ca mới
      try {
        console.log(`Lên lịch thông báo cho ca mới: ${shift.id}`)

        // Lên lịch kiểm tra thời tiết cho ca mới
        await weatherAlertService.scheduleWeatherCheck(shift)

        // Cập nhật lịch nhắc nhở ghi chú theo ca mới
        await updateNotesForNewShift(shift)
      } catch (error) {
        console.error('Lỗi khi lên lịch thông báo cho ca mới:', error)
      }
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_SHIFT)
      await storage.updateUserSettings({ activeShiftId: null })
    }
  }

  // Hàm cập nhật lịch nhắc nhở ghi chú khi thay đổi ca làm việc
  const updateNotesForNewShift = async (newShift) => {
    try {
      // Lấy danh sách ghi chú
      const allNotes = await getNotes()

      // Lọc các ghi chú có liên kết với ca làm việc mới
      const notesLinkedToNewShift = allNotes.filter(
        (note) => note.linkedShifts && note.linkedShifts.includes(newShift.id)
      )

      console.log(
        `Tìm thấy ${notesLinkedToNewShift.length} ghi chú liên kết với ca mới`
      )

      // Cập nhật lịch nhắc nhở cho từng ghi chú
      for (const note of notesLinkedToNewShift) {
        if (note.reminderTime) {
          // Hủy tất cả báo thức cũ của ghi chú này
          await alarmManager.cancelAlarmsByPrefix(`note_${note.id}`)

          // Lên lịch lại báo thức mới
          const [hours, minutes] = note.reminderTime.split(':').map(Number)

          // Lên lịch nhắc nhở cho các ngày áp dụng của ca
          for (const day of newShift.daysApplied) {
            const dayOfWeek = getDayOfWeek(day)
            if (dayOfWeek) {
              const reminderTime = new Date()
              reminderTime.setHours(hours, minutes, 0, 0)

              await alarmManager.scheduleAlarm({
                title: note.title || t('Note Reminder'),
                body: note.content || '',
                scheduledTime: reminderTime,
                type: 'note',
                id: `note_${note.id}_${day}`,
                data: { noteId: note.id, shiftId: newShift.id },
                repeats: true,
                weekday: dayOfWeek,
              })
            }
          }
        }
      }

      return true
    } catch (error) {
      console.error('Lỗi khi cập nhật lịch nhắc nhở ghi chú:', error)
      return false
    }
  }

  const startWork = async () => {
    const now = new Date()
    setIsWorking(true)
    setWorkStartTime(now)
    await AsyncStorage.setItem('isWorking', 'true')
    await AsyncStorage.setItem('workStartTime', now.getTime().toString())

    // Add to check-in history
    const newCheckIn = {
      id: Date.now().toString(),
      type: 'checkIn',
      timestamp: now.getTime(),
      shiftId: currentShift ? currentShift.id : null,
    }

    const updatedHistory = [...checkInHistory, newCheckIn]
    setCheckInHistory(updatedHistory)
    await AsyncStorage.setItem('checkInHistory', JSON.stringify(updatedHistory))

    // Cancel any existing check-out reminders
    await Notifications.cancelAllScheduledNotificationsAsync()

    // Schedule check-out reminder if we have a current shift
    if (currentShift && currentShift.reminderAfter > 0) {
      const endTimeHours = Number.parseInt(currentShift.endTime.split(':')[0])
      const endTimeMinutes = Number.parseInt(currentShift.endTime.split(':')[1])

      const endTime = new Date()
      endTime.setHours(endTimeHours)
      endTime.setMinutes(endTimeMinutes)
      endTime.setSeconds(0)

      // Nếu thời gian kết thúc sớm hơn thời gian hiện tại, có thể là ca qua đêm
      if (endTime < now) {
        endTime.setDate(endTime.getDate() + 1)
      }

      // Tính thời gian nhắc nhở (trước khi kết thúc ca)
      const reminderTime = new Date(
        endTime.getTime() - currentShift.reminderAfter * 60 * 1000
      )

      if (reminderTime > now) {
        // Sử dụng alarmManager để lên lịch báo thức check-out
        await alarmManager.scheduleCheckOutAlarm(currentShift, reminderTime)
      }
    }
  }

  const endWork = async () => {
    const now = new Date()
    setIsWorking(false)
    setWorkStartTime(null)
    await AsyncStorage.setItem('isWorking', 'false')
    await AsyncStorage.removeItem('workStartTime')

    // Add to check-in history
    const newCheckOut = {
      id: Date.now().toString(),
      type: 'checkOut',
      timestamp: now.getTime(),
      shiftId: currentShift ? currentShift.id : null,
    }

    const updatedHistory = [...checkInHistory, newCheckOut]
    setCheckInHistory(updatedHistory)
    await AsyncStorage.setItem('checkInHistory', JSON.stringify(updatedHistory))

    // Cancel any scheduled notifications
    await Notifications.cancelAllScheduledNotificationsAsync()

    // Hủy tất cả báo thức liên quan đến ca làm việc hiện tại
    if (currentShift) {
      await alarmManager.cancelAlarmsByPrefix(`shift_${currentShift.id}`)
    }
  }

  const completeWork = async () => {
    const now = new Date()
    setIsWorking(false)
    setWorkStartTime(null)
    await AsyncStorage.setItem('isWorking', 'false')
    await AsyncStorage.removeItem('workStartTime')

    // Add to check-in history
    const newComplete = {
      id: Date.now().toString(),
      type: 'complete',
      timestamp: now.getTime(),
      shiftId: currentShift ? currentShift.id : null,
    }

    const updatedHistory = [...checkInHistory, newComplete]
    setCheckInHistory(updatedHistory)
    await AsyncStorage.setItem('checkInHistory', JSON.stringify(updatedHistory))

    // Cancel any scheduled notifications
    await Notifications.cancelAllScheduledNotificationsAsync()

    // Hủy tất cả báo thức liên quan đến ca làm việc hiện tại
    if (currentShift) {
      await alarmManager.cancelAlarmsByPrefix(`shift_${currentShift.id}`)
    }
  }

  // Multi-Function Button actions
  const handleMultiFunctionButton = async () => {
    const now = new Date()
    const today = formatDate(now)

    // Kiểm tra thời gian giữa các lần bấm nút
    const checkTimeBetweenButtonActions = (previousType, minTimeInMinutes) => {
      if (attendanceLogs.length === 0) return true

      const lastLog = attendanceLogs.find((log) => log.type === previousType)
      if (!lastLog) return true

      const lastTimestamp = new Date(lastLog.timestamp)
      const diffInMinutes =
        (now.getTime() - lastTimestamp.getTime()) / (1000 * 60)

      return diffInMinutes >= minTimeInMinutes
    }

    // Hủy nhắc nhở tương ứng với hành động
    const cancelRelatedNotifications = async (actionType) => {
      try {
        if (!currentShift) return

        switch (actionType) {
          case 'go_work':
            // Hủy nhắc nhở "Departure Notification"
            await alarmManager.cancelAlarmsByPrefix(
              `departure_${currentShift.id}`
            )

            // Nếu ở chế độ Simple, hủy tất cả nhắc nhở liên quan đến ca làm việc
            if (onlyGoWorkMode) {
              // Trong chế độ Simple, khi bấm "Đi Làm" sẽ hủy tất cả các nhắc nhở liên quan
              await alarmManager.cancelAlarmsByPrefix(
                `check_in_${currentShift.id}`
              )
              await alarmManager.cancelAlarmsByPrefix(
                `check_out_${currentShift.id}`
              )
              // Hủy cả nhắc nhở hoàn tất nếu có
              await alarmManager.cancelAlarmsByPrefix(
                `complete_${currentShift.id}`
              )
            }
            break
          case 'check_in':
            // Hủy nhắc nhở "Check-In Notification"
            await alarmManager.cancelAlarmsByPrefix(
              `check_in_${currentShift.id}`
            )
            break
          case 'check_out':
            // Hủy nhắc nhở "Check-Out Notification"
            await alarmManager.cancelAlarmsByPrefix(
              `check_out_${currentShift.id}`
            )
            break
          case 'complete':
            // Hủy nhắc nhở "Complete Notification" nếu có
            await alarmManager.cancelAlarmsByPrefix(
              `complete_${currentShift.id}`
            )
            break
        }
      } catch (error) {
        console.error(
          `Lỗi khi hủy nhắc nhở cho hành động ${actionType}:`,
          error
        )
      }
    }

    // Kích hoạt tính toán trạng thái làm việc
    const calculateWorkStatus = async () => {
      try {
        // Import động workStatusCalculator để tránh circular dependency
        const {
          calculateTodayWorkStatus,
        } = require('../utils/workStatusCalculator')

        // Lấy ca làm việc hiện tại
        const shift = currentShift

        // Lấy cài đặt người dùng để xác định chế độ nút
        const userSettings = await storage.getUserSettings()
        const isSimpleMode = userSettings?.multiButtonMode === 'simple'

        // Gọi hàm tính toán với thông tin chế độ
        await calculateTodayWorkStatus(shift, isSimpleMode)
      } catch (error) {
        console.error('Lỗi khi tính toán trạng thái làm việc:', error)
      }
    }

    // Xử lý hành động nút sau khi đã kiểm tra thời gian
    const processButtonAction = async (actionType) => {
      let newLog = null
      let newState = buttonState

      switch (actionType) {
        case 'go_work':
          // Kiểm tra và lưu vị trí nhà nếu chưa có
          if (!homeLocation && locationPermissionGranted) {
            try {
              // Yêu cầu quyền vị trí nếu chưa được cấp
              if (!locationPermissionGranted) {
                const granted = await requestLocationPermission()
                if (!granted) {
                  Alert.alert(
                    t('Location Permission Required'),
                    t(
                      'AccShift needs precise location permission to determine your home location for weather alerts.'
                    ),
                    [{ text: t('OK') }]
                  )
                  return
                }
              }

              const currentLocation = await locationUtils.getCurrentLocation()
              if (currentLocation) {
                const address = await locationUtils.getAddressFromCoordinates(
                  currentLocation.latitude,
                  currentLocation.longitude
                )

                // Hiển thị hộp thoại xác nhận vị trí
                locationUtils.showLocationConfirmDialog(
                  t('Confirm Home Location'),
                  address || t('Unknown address'),
                  async () => {
                    await saveHomeLocationData(currentLocation, address)
                  }
                )
              }
            } catch (error) {
              console.error('Error getting home location:', error)
            }
          }

          newLog = {
            id: Date.now().toString(),
            type: 'go_work',
            timestamp: now.getTime(),
            shiftId: currentShift ? currentShift.id : null,
          }

          // Xử lý khác nhau cho chế độ Simple và Full
          if (onlyGoWorkMode) {
            // Chế độ Simple: Bấm "Đi Làm" sẽ chuyển thẳng sang trạng thái COMPLETE
            // Đồng thời cũng đánh dấu là đang làm việc để tính toán trạng thái
            newState = BUTTON_STATES.COMPLETE

            // Trong chế độ Simple, không cần set isWorking và workStartTime
            // vì không cần theo dõi thời gian làm việc thực tế
          } else {
            // Chế độ Full: Bấm "Đi Làm" sẽ chuyển sang trạng thái chờ Check-in
            newState = BUTTON_STATES.WAITING_CHECK_IN
          }
          break

        case 'check_in':
          // Kiểm tra và lưu vị trí công ty nếu chưa có
          if (!workLocation && locationPermissionGranted) {
            try {
              // Yêu cầu quyền vị trí nếu chưa được cấp
              if (!locationPermissionGranted) {
                const granted = await requestLocationPermission()
                if (!granted) {
                  Alert.alert(
                    t('Location Permission Required'),
                    t(
                      'AccShift needs precise location permission to determine your work location for weather alerts.'
                    ),
                    [{ text: t('OK') }]
                  )
                  return
                }
              }

              const currentLocation = await locationUtils.getCurrentLocation()
              if (currentLocation) {
                const address = await locationUtils.getAddressFromCoordinates(
                  currentLocation.latitude,
                  currentLocation.longitude
                )

                // Hiển thị hộp thoại xác nhận vị trí
                locationUtils.showLocationConfirmDialog(
                  t('Confirm Work Location'),
                  address || t('Unknown address'),
                  async () => {
                    await saveWorkLocationData(currentLocation, address)

                    // Kiểm tra các điều kiện để hỏi về việc sử dụng vị trí chung
                    if (homeLocation) {
                      // 1. Kiểm tra khoảng cách
                      const distanceCheck = checkLocationDistance()

                      // 2. Kiểm tra thời gian giữa go_work và check_in
                      const lastGoWorkLog = attendanceLogs.find(
                        (log) => log.type === 'go_work'
                      )
                      const lastCheckInLog = newLog // Log check_in hiện tại
                      const timeCheck = checkTimeBetweenEvents(
                        lastGoWorkLog,
                        lastCheckInLog
                      )

                      // 3. Kiểm tra chế độ nút
                      const modeCheck = checkMultiButtonMode()

                      // Nếu bất kỳ điều kiện nào thỏa mãn, hiển thị hộp thoại xác nhận
                      if (
                        distanceCheck.shouldAskSingleLocation ||
                        timeCheck.shouldAskSingleLocation ||
                        modeCheck.shouldAskSingleLocation
                      ) {
                        // Chọn thông báo phù hợp
                        let message = ''
                        if (distanceCheck.shouldAskSingleLocation) {
                          message = distanceCheck.message
                        } else if (timeCheck.shouldAskSingleLocation) {
                          message = timeCheck.message
                        } else {
                          message = modeCheck.message
                        }

                        // Hiển thị hộp thoại xác nhận
                        locationUtils.showUseSingleLocationDialog(
                          message,
                          async () => {
                            // Người dùng chọn "Dùng chung"
                            await locationUtils.updateUseSingleLocation(true)
                          },
                          async () => {
                            // Người dùng chọn "Dùng riêng"
                            await locationUtils.updateUseSingleLocation(false)
                          }
                        )
                      } else if (distanceCheck.hasWarning) {
                        // Hiển thị cảnh báo khoảng cách nếu có
                        Alert.alert(
                          t('Distance Warning'),
                          distanceCheck.message,
                          [{ text: t('OK') }]
                        )
                      }
                    }
                  }
                )
              }
            } catch (error) {
              console.error('Error getting work location:', error)
            }
          }

          newLog = {
            id: Date.now().toString(),
            type: 'check_in',
            timestamp: now.getTime(),
            shiftId: currentShift ? currentShift.id : null,
          }
          newState = BUTTON_STATES.WORKING
          setIsWorking(true)
          setWorkStartTime(now)
          await AsyncStorage.setItem('isWorking', 'true')
          await AsyncStorage.setItem('workStartTime', now.getTime().toString())
          break

        case 'check_out':
          newLog = {
            id: Date.now().toString(),
            type: 'check_out',
            timestamp: now.getTime(),
            shiftId: currentShift ? currentShift.id : null,
          }
          newState = BUTTON_STATES.READY_COMPLETE
          setIsWorking(false)
          setWorkStartTime(null)
          await AsyncStorage.setItem('isWorking', 'false')
          await AsyncStorage.removeItem('workStartTime')
          break

        case 'complete':
          newLog = {
            id: Date.now().toString(),
            type: 'complete',
            timestamp: now.getTime(),
            shiftId: currentShift ? currentShift.id : null,
          }
          newState = BUTTON_STATES.COMPLETED

          // Trong cả hai chế độ, khi hoàn tất, đảm bảo trạng thái làm việc được reset
          setIsWorking(false)
          setWorkStartTime(null)
          await AsyncStorage.setItem('isWorking', 'false')
          await AsyncStorage.removeItem('workStartTime')
          break
      }

      if (newLog) {
        // Hủy nhắc nhở tương ứng
        await cancelRelatedNotifications(actionType)

        // Add to attendance logs
        let updatedLogs

        // Nếu ở chế độ "Chỉ Đi Làm" và đang bấm nút "Đi Làm", xóa các log check_in và check_out nếu có
        if (onlyGoWorkMode && actionType === 'go_work') {
          const filteredLogs = attendanceLogs.filter(
            (log) => log.type !== 'check_in' && log.type !== 'check_out'
          )
          updatedLogs = [...filteredLogs, newLog]
        } else {
          updatedLogs = [...attendanceLogs, newLog]
        }

        setAttendanceLogs(updatedLogs)
        await AsyncStorage.setItem(
          `attendanceLogs_${today}`,
          JSON.stringify(updatedLogs)
        )

        // Update button state
        setButtonState(newState)

        // Kích hoạt tính toán trạng thái làm việc
        // Trong chế độ Simple, cập nhật trạng thái ngay khi bấm "Đi Làm"
        // Trong chế độ Full, cập nhật trạng thái khi bấm "Check-out" hoặc "Complete"
        if (onlyGoWorkMode) {
          if (actionType === 'go_work' || actionType === 'complete') {
            await calculateWorkStatus()
          }
        } else {
          if (actionType === 'check_out' || actionType === 'complete') {
            await calculateWorkStatus()
          }
        }
      }
    }

    // Xử lý các trạng thái nút
    switch (buttonState) {
      case BUTTON_STATES.GO_WORK:
        // Không cần kiểm tra thời gian cho hành động đầu tiên
        await processButtonAction('go_work')
        break

      case BUTTON_STATES.WAITING_CHECK_IN:
      case BUTTON_STATES.CHECK_IN:
        // Kiểm tra thời gian giữa go_work và check_in (tối thiểu 5 phút)
        if (checkTimeBetweenButtonActions('go_work', 5)) {
          await processButtonAction('check_in')
        } else {
          // Hiển thị hộp thoại xác nhận nếu thời gian không đủ
          Alert.alert(
            t('Confirmation Required'),
            t(
              'Are you sure you want to check in? It\'s been less than 5 minutes since you pressed "Go Work".'
            ),
            [
              {
                text: t('Cancel'),
                style: 'cancel',
              },
              {
                text: t('Continue'),
                onPress: async () => await processButtonAction('check_in'),
              },
            ]
          )
        }
        break

      case BUTTON_STATES.WORKING:
      case BUTTON_STATES.CHECK_OUT:
        // Kiểm tra thời gian giữa check_in và check_out (tối thiểu 2 giờ = 120 phút)
        if (checkTimeBetweenButtonActions('check_in', 120)) {
          await processButtonAction('check_out')
        } else {
          // Hiển thị hộp thoại xác nhận nếu thời gian không đủ
          Alert.alert(
            t('Confirmation Required'),
            t(
              "Are you sure you want to check out? It's been less than 2 hours since you checked in."
            ),
            [
              {
                text: t('Cancel'),
                style: 'cancel',
              },
              {
                text: t('Continue'),
                onPress: async () => await processButtonAction('check_out'),
              },
            ]
          )
        }
        break

      case BUTTON_STATES.READY_COMPLETE:
      case BUTTON_STATES.COMPLETE:
        // Không cần kiểm tra thời gian cho hành động hoàn tất
        await processButtonAction('complete')
        break

      default:
        return // Do nothing for COMPLETED state
    }
  }

  const handlePunchButton = async () => {
    const now = new Date()
    const today = formatDate(now)

    const newLog = {
      id: Date.now().toString(),
      type: 'punch',
      timestamp: now.getTime(),
      shiftId: currentShift ? currentShift.id : null,
    }

    // Add to attendance logs
    const updatedLogs = [...attendanceLogs, newLog]
    setAttendanceLogs(updatedLogs)
    await AsyncStorage.setItem(
      `attendanceLogs_${today}`,
      JSON.stringify(updatedLogs)
    )

    // Kích hoạt tính toán trạng thái làm việc
    try {
      // Import động workStatusCalculator để tránh circular dependency
      const {
        calculateTodayWorkStatus,
      } = require('../utils/workStatusCalculator')

      // Lấy ca làm việc hiện tại và chế độ nút
      const shift = currentShift
      const isSimpleMode = onlyGoWorkMode

      // Gọi hàm tính toán với thông tin chế độ
      await calculateTodayWorkStatus(shift, isSimpleMode)
    } catch (error) {
      console.error(
        'Lỗi khi tính toán trạng thái làm việc sau khi ký công:',
        error
      )
    }
  }

  const resetAttendanceLogs = async () => {
    // Hiển thị hộp thoại xác nhận trước khi thực hiện reset
    Alert.alert(
      t('Reset Confirmation'),
      t(
        'Are you sure you want to reset your work status for today? This will clear all attendance logs for today.'
      ),
      [
        {
          text: t('Cancel'),
          style: 'cancel',
        },
        {
          text: t('Reset'),
          style: 'destructive',
          onPress: async () => {
            const today = formatDate(new Date())

            // Clear attendance logs for today
            setAttendanceLogs([])
            await AsyncStorage.removeItem(`attendanceLogs_${today}`)

            // Reset button state
            setButtonState(BUTTON_STATES.GO_WORK)

            // Reset working status
            setIsWorking(false)
            setWorkStartTime(null)
            await AsyncStorage.setItem('isWorking', 'false')
            await AsyncStorage.removeItem('workStartTime')

            // Cancel any scheduled notifications
            await Notifications.cancelAllScheduledNotificationsAsync()

            // Reschedule notifications if needed
            if (currentShift) {
              // Kích hoạt lại các nhắc nhở trong ngày
              try {
                if (currentShift.reminderAfter > 0) {
                  const now = new Date()
                  const endTimeHours = Number.parseInt(
                    currentShift.endTime.split(':')[0]
                  )
                  const endTimeMinutes = Number.parseInt(
                    currentShift.endTime.split(':')[1]
                  )

                  const endTime = new Date()
                  endTime.setHours(endTimeHours)
                  endTime.setMinutes(endTimeMinutes)
                  endTime.setSeconds(0)

                  // Nếu thời gian kết thúc sớm hơn thời gian hiện tại, có thể là ca qua đêm
                  if (endTime < now) {
                    endTime.setDate(endTime.getDate() + 1)
                  }

                  // Tính thời gian nhắc nhở (trước khi kết thúc ca)
                  const reminderTime = new Date(
                    endTime.getTime() - currentShift.reminderAfter * 60 * 1000
                  )

                  if (reminderTime > now) {
                    // Lên lịch lại các báo thức
                    await weatherAlertService.scheduleWeatherCheck(currentShift)
                  }
                }
              } catch (error) {
                console.error('Error rescheduling notifications:', error)
              }
            }
          },
        },
      ]
    )
  }

  const requestAlarmPermission = async () => {
    // Yêu cầu quyền thông báo thông qua alarmManager
    const granted = await alarmManager.requestPermissions()
    setAlarmPermissionGranted(granted)

    // Nếu được cấp quyền và đang ở Android, yêu cầu tắt tối ưu hóa pin
    if (granted && Platform.OS === 'android') {
      await alarmManager.requestDisableBatteryOptimization()
    }

    return granted
  }

  // Hàm yêu cầu quyền truy cập vị trí
  const requestLocationPermission = async () => {
    try {
      // Yêu cầu quyền truy cập vị trí chính xác
      const { status } = await Location.requestForegroundPermissionsAsync()

      if (status === 'granted') {
        // Nếu được cấp quyền, yêu cầu quyền vị trí chính xác
        const accuracyStatus = await Location.requestPermissionsAsync()
        setLocationPermissionGranted(accuracyStatus.status === 'granted')
        return accuracyStatus.status === 'granted'
      } else {
        setLocationPermissionGranted(false)
        return false
      }
    } catch (error) {
      console.error('Error requesting location permission:', error)
      setLocationPermissionGranted(false)
      return false
    }
  }

  // Hàm lưu vị trí nhà
  const saveHomeLocationData = async (location, address) => {
    const success = await locationUtils.saveHomeLocation(location, address)
    if (success) {
      const locationData = {
        name: 'Home',
        address: address || '',
        latitude: location.latitude,
        longitude: location.longitude,
      }
      setHomeLocation(locationData)
    }
    return success
  }

  // Hàm lưu vị trí công ty
  const saveWorkLocationData = async (location, address) => {
    const success = await locationUtils.saveWorkLocation(location, address)
    if (success) {
      const locationData = {
        name: 'Work',
        address: address || '',
        latitude: location.latitude,
        longitude: location.longitude,
      }
      setWorkLocation(locationData)
    }
    return success
  }

  // Hàm kiểm tra và cảnh báo khoảng cách
  const checkLocationDistance = () => {
    if (homeLocation && workLocation) {
      const distance = locationUtils.calculateDistance(
        homeLocation,
        workLocation
      )

      // Nếu khoảng cách <= 20km, hỏi người dùng có muốn sử dụng chung vị trí không
      if (distance <= 20) {
        return {
          hasWarning: false,
          shouldAskSingleLocation: true,
          distance: distance.toFixed(1),
          message: t(
            'Vị trí nhà và công ty của bạn khá gần nhau (khoảng cách ${distance} km). Bạn có muốn sử dụng chung một vị trí (vị trí nhà) cho tất cả cảnh báo thời tiết không?'
          ),
        }
      } else if (distance > 20) {
        return {
          hasWarning: true,
          shouldAskSingleLocation: false,
          distance: distance.toFixed(1),
          message: t(
            'Khoảng cách giữa nhà và công ty của bạn là ${distance} km. Hệ thống sẽ sử dụng hai vị trí riêng biệt cho cảnh báo thời tiết.'
          ),
        }
      }
    }
    return { hasWarning: false, shouldAskSingleLocation: false }
  }

  // Hàm kiểm tra thời gian giữa hai sự kiện
  const checkTimeBetweenEvents = (goWorkLog, checkInLog) => {
    if (goWorkLog && checkInLog) {
      const timeDiff = locationUtils.getTimeBetweenEvents(
        goWorkLog.timestamp,
        checkInLog.timestamp
      )

      // Nếu thời gian giữa hai sự kiện < 60 giây, hỏi người dùng có muốn sử dụng chung vị trí không
      if (timeDiff < 60) {
        return {
          shouldAskSingleLocation: true,
          timeDiff,
          message: t(
            'Bạn bấm nút đi làm và chấm công vào rất nhanh (${timeDiff.toFixed(0)} giây). Bạn có muốn sử dụng chung một vị trí (vị trí nhà) cho tất cả cảnh báo thời tiết không?'
          ),
        }
      }
    }
    return { shouldAskSingleLocation: false }
  }

  // Hàm kiểm tra chế độ nút đa năng
  const checkMultiButtonMode = () => {
    if (onlyGoWorkMode) {
      return {
        shouldAskSingleLocation: true,
        message: t(
          'Bạn đang sử dụng chế độ nút đơn giản. Bạn có muốn sử dụng chung một vị trí (vị trí nhà) cho tất cả cảnh báo thời tiết không?'
        ),
      }
    }
    return { shouldAskSingleLocation: false }
  }

  const t = (key) => {
    // Log để debug
    if (key === 'Ngôn ngữ' || key === 'Language' || key === 'Chế độ tối') {
      console.log(`t() called with key: ${key}, current language: ${language}`)
    }

    // Kiểm tra xem ngôn ngữ và khóa có tồn tại không
    if (translations[language] && translations[language][key]) {
      const translated = translations[language][key]

      // Log để debug
      if (key === 'Ngôn ngữ' || key === 'Language' || key === 'Chế độ tối') {
        console.log(
          `Found translation for ${key} in ${language}: ${translated}`
        )
      }

      return translated
    }

    // Nếu không tìm thấy trong ngôn ngữ hiện tại, thử tìm trong tiếng Việt
    if (translations['vi'] && translations['vi'][key]) {
      const fallbackTranslated = translations['vi'][key]

      // Log để debug
      if (key === 'Ngôn ngữ' || key === 'Language' || key === 'Chế độ tối') {
        console.log(`Fallback to vi for ${key}: ${fallbackTranslated}`)
      }

      return fallbackTranslated
    }

    // Nếu không tìm thấy trong tiếng Việt, thử tìm trong tiếng Anh
    if (translations['en'] && translations['en'][key]) {
      const fallbackTranslated = translations['en'][key]

      // Log để debug
      if (key === 'Ngôn ngữ' || key === 'Language' || key === 'Chế độ tối') {
        console.log(`Fallback to en for ${key}: ${fallbackTranslated}`)
      }

      return fallbackTranslated
    }

    // Trả về khóa gốc nếu không tìm thấy bản dịch
    console.log(`Missing translation for key: ${key} in language: ${language}`)
    return key
  }

  const addNoteWithReminder = async (noteData) => {
    try {
      // Thêm ghi chú vào cơ sở dữ liệu
      const newNote = await addNote(noteData)

      if (newNote && newNote.reminderTime) {
        // Xử lý thời gian nhắc nhở
        const [hours, minutes] = newNote.reminderTime.split(':').map(Number)

        // Nếu ghi chú liên kết với ca làm việc
        if (newNote.linkedShifts && newNote.linkedShifts.length > 0) {
          for (const shiftId of newNote.linkedShifts) {
            const shift = shifts.find((s) => s.id === shiftId)
            if (!shift) continue

            // Lên lịch nhắc nhở cho các ngày áp dụng của ca
            for (const day of shift.daysApplied) {
              const dayOfWeek = getDayOfWeek(day) // Hàm chuyển đổi T2->2, T3->3, ...
              if (dayOfWeek) {
                const now = new Date()
                const reminderTime = new Date()
                reminderTime.setHours(hours, minutes, 0, 0)

                await alarmManager.scheduleAlarm({
                  title: newNote.title || t('Note Reminder'),
                  body: newNote.content || '',
                  scheduledTime: reminderTime,
                  type: 'note',
                  id: `note_${newNote.id}_${day}`,
                  data: { noteId: newNote.id, shiftId },
                  repeats: true,
                  weekday: dayOfWeek,
                })
              }
            }
          }
        }
        // Nếu ghi chú sử dụng ngày tùy chỉnh
        else if (newNote.reminderDays && newNote.reminderDays.length > 0) {
          for (const day of newNote.reminderDays) {
            const dayOfWeek = getDayOfWeek(day)
            if (dayOfWeek) {
              const now = new Date()
              const reminderTime = new Date()
              reminderTime.setHours(hours, minutes, 0, 0)

              await alarmManager.scheduleAlarm({
                title: newNote.title || t('Note Reminder'),
                body: newNote.content || '',
                scheduledTime: reminderTime,
                type: 'note',
                id: `note_${newNote.id}_${day}`,
                data: { noteId: newNote.id },
                repeats: true,
                weekday: dayOfWeek,
              })
            }
          }
        }
      }

      // Cập nhật danh sách ghi chú
      const updatedNotes = await getNotes()
      setNotes(updatedNotes)

      return newNote
    } catch (error) {
      console.error('Error adding note with reminder:', error)
      return null
    }
  }

  const updateNoteWithReminder = async (updatedNote) => {
    try {
      // Cập nhật ghi chú trong cơ sở dữ liệu
      const result = await updateNote(updatedNote)

      // Hủy tất cả báo thức cũ
      await alarmManager.cancelAlarmsByPrefix(`note_${updatedNote.id}`)

      if (result && updatedNote.reminderTime) {
        // Xử lý thời gian nhắc nhở
        const [hours, minutes] = updatedNote.reminderTime.split(':').map(Number)

        // Nếu ghi chú liên kết với ca làm việc
        if (updatedNote.linkedShifts && updatedNote.linkedShifts.length > 0) {
          for (const shiftId of updatedNote.linkedShifts) {
            const shift = shifts.find((s) => s.id === shiftId)
            if (!shift) continue

            // Lên lịch nhắc nhở cho các ngày áp dụng của ca
            for (const day of shift.daysApplied) {
              const dayOfWeek = getDayOfWeek(day) // Hàm chuyển đổi T2->2, T3->3, ...
              if (dayOfWeek) {
                const now = new Date()
                const reminderTime = new Date()
                reminderTime.setHours(hours, minutes, 0, 0)

                await alarmManager.scheduleAlarm({
                  title: updatedNote.title || t('Note Reminder'),
                  body: updatedNote.content || '',
                  scheduledTime: reminderTime,
                  type: 'note',
                  id: `note_${updatedNote.id}_${day}`,
                  data: { noteId: updatedNote.id, shiftId },
                  repeats: true,
                  weekday: dayOfWeek,
                })
              }
            }
          }
        }
        // Nếu ghi chú sử dụng ngày tùy chỉnh
        else if (
          updatedNote.reminderDays &&
          updatedNote.reminderDays.length > 0
        ) {
          for (const day of updatedNote.reminderDays) {
            const dayOfWeek = getDayOfWeek(day)
            if (dayOfWeek) {
              const now = new Date()
              const reminderTime = new Date()
              reminderTime.setHours(hours, minutes, 0, 0)

              await alarmManager.scheduleAlarm({
                title: updatedNote.title || t('Note Reminder'),
                body: updatedNote.content || '',
                scheduledTime: reminderTime,
                type: 'note',
                id: `note_${updatedNote.id}_${day}`,
                data: { noteId: updatedNote.id },
                repeats: true,
                weekday: dayOfWeek,
              })
            }
          }
        }
      }

      // Cập nhật danh sách ghi chú
      const updatedNotes = await getNotes()
      setNotes(updatedNotes)

      return result
    } catch (error) {
      console.error('Error updating note with reminder:', error)
      return null
    }
  }

  const deleteNoteWithReminder = async (noteId) => {
    try {
      // Xóa ghi chú khỏi cơ sở dữ liệu
      const success = await deleteNote(noteId)

      // Hủy tất cả báo thức liên quan
      await alarmManager.cancelAlarmsByPrefix(`note_${noteId}`)

      if (success) {
        // Cập nhật danh sách ghi chú
        const updatedNotes = await getNotes()
        setNotes(updatedNotes)
      }

      return success
    } catch (error) {
      console.error('Error deleting note with reminder:', error)
      return false
    }
  }

  // Hàm trợ giúp chuyển đổi ngày trong tuần
  function getDayOfWeek(day) {
    const dayMap = { CN: 1, T2: 2, T3: 3, T4: 4, T5: 5, T6: 6, T7: 7 }
    return dayMap[day]
  }

  // Hàm helper để validate và parse input số
  const parseNumericInput = (value, minValue = 100) => {
    const numericValue = parseInt(value.replace(/[^0-9]/g, ''))
    return !isNaN(numericValue) && numericValue >= minValue
      ? numericValue
      : null
  }

  // Cập nhật hàm xử lý input cho modal
  const handleOtRateWeekdayChange = (rate) => {
    const validRate = parseNumericInput(rate)
    if (validRate) {
      setOtRateWeekday(validRate)
      storage
        .updateUserSettings({
          otRateWeekday: validRate,
        })
        .catch((err) => console.error('Failed to save OT weekday rate:', err))
    }
  }

  // Hàm helper để lưu nhiều cài đặt cùng lúc
  const updateMultipleSettings = async (settings) => {
    try {
      const currentSettings = await storage.getUserSettings()
      const updatedSettings = { ...currentSettings, ...settings }
      await storage.setUserSettings(updatedSettings)
      return true
    } catch (error) {
      console.error('Failed to update multiple settings:', error)
      return false
    }
  }

  // Hàm kiểm tra và áp dụng xoay ca tự động
  const checkAndApplyShiftRotation = async () => {
    try {
      // Lấy cài đặt người dùng
      const userSettings = await storage.getUserSettings()

      // Kiểm tra điều kiện áp dụng xoay ca
      if (!userSettings || userSettings.changeShiftReminderMode !== 'rotate') {
        return false
      }

      // Kiểm tra cấu hình xoay ca
      if (
        !userSettings.rotationShifts ||
        !Array.isArray(userSettings.rotationShifts) ||
        userSettings.rotationShifts.length < 2 ||
        !userSettings.rotationFrequency
      ) {
        console.log('Cấu hình xoay ca không hợp lệ')
        return false
      }

      // Lấy ngày áp dụng ca hiện tại
      const rotationLastAppliedDate = userSettings.rotationLastAppliedDate
      if (!rotationLastAppliedDate) {
        // Nếu chưa có ngày áp dụng, đặt ngày hiện tại làm ngày áp dụng đầu tiên
        const today = new Date()
        await updateMultipleSettings({
          rotationLastAppliedDate: today.toISOString().split('T')[0],
        })
        return false
      }

      // Tính toán ngày xoay ca tiếp theo
      const lastAppliedDate = new Date(rotationLastAppliedDate)
      let nextRotationDate = new Date(lastAppliedDate)

      switch (userSettings.rotationFrequency) {
        case 'weekly':
          nextRotationDate.setDate(lastAppliedDate.getDate() + 7)
          break
        case 'biweekly':
          nextRotationDate.setDate(lastAppliedDate.getDate() + 14)
          break
        case 'monthly':
          nextRotationDate.setMonth(lastAppliedDate.getMonth() + 1)
          break
        default:
          nextRotationDate.setDate(lastAppliedDate.getDate() + 7)
      }

      // Kiểm tra xem đã đến ngày xoay ca chưa
      const currentDate = new Date()
      if (currentDate >= nextRotationDate) {
        // Xác định ca tiếp theo
        const activeShiftId = userSettings.activeShiftId || currentShift?.id
        if (!activeShiftId) {
          console.log('Không tìm thấy ca hiện tại')
          return false
        }

        const currentIndex = userSettings.rotationShifts.indexOf(activeShiftId)
        if (currentIndex === -1) {
          console.log('Ca hiện tại không nằm trong danh sách xoay ca')
          return false
        }

        // Tính vị trí của ca tiếp theo
        const nextIndex =
          (currentIndex + 1) % userSettings.rotationShifts.length
        const nextShiftId = userSettings.rotationShifts[nextIndex]

        // Tìm thông tin ca tiếp theo
        const nextShift = shifts.find((shift) => shift.id === nextShiftId)
        if (!nextShift) {
          console.log('Không tìm thấy thông tin ca tiếp theo')
          return false
        }

        // Áp dụng ca mới
        setCurrentShift(nextShift)

        // Cập nhật ngày áp dụng
        await updateMultipleSettings({
          activeShiftId: nextShiftId,
          rotationLastAppliedDate: nextRotationDate.toISOString().split('T')[0],
        })

        // Gửi thông báo cho người dùng
        await Notifications.scheduleNotificationAsync({
          content: {
            title: t('Tự động đổi ca làm việc'),
            body: t(
              `Ca làm việc đã được tự động cập nhật. Ca tiếp theo của bạn là: ${nextShift.name}`
            ),
          },
          trigger: null, // Hiển thị ngay lập tức
        })

        return true
      }

      return false
    } catch (error) {
      console.error('Lỗi khi kiểm tra và áp dụng xoay ca:', error)
      return false
    }
  }

  // Cập nhật hàm lưu cài đặt OT
  const handleSaveOtBaseRateSettings = async () => {
    const settings = {
      otRateWeekday: otRateWeekday,
      otRateSaturday: otRateSaturday,
      otRateSunday: otRateSunday,
      otRateHoliday: otRateHoliday,
    }

    // Validate all inputs
    if (
      Object.values(settings).some((value) => value === null || value < 100)
    ) {
      Alert.alert(
        t('Invalid Input'),
        t('Please enter valid rates (minimum 100%)')
      )
      return
    }

    // Save all settings
    const success = await updateMultipleSettings(settings)
    if (!success) {
      Alert.alert(t('Error'), t('Failed to save settings'))
    }

    return success
  }

  return (
    <AppContext.Provider
      value={{
        language,
        darkMode,
        currentShift,
        checkInHistory,
        shifts,
        notes,
        weatherData,
        weatherAlerts,
        notificationSound,
        notificationVibration,
        isWorking,
        workStartTime,
        alarmPermissionGranted,
        // Theme
        theme,
        // Location states
        homeLocation,
        workLocation,
        locationPermissionGranted,
        // Multi-Function Button states
        buttonState,
        attendanceLogs,
        onlyGoWorkMode,
        showPunchButton,
        // Shift rotation
        checkAndApplyShiftRotation,
        updateMultipleSettings,
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
        t,
        changeLanguage,
        toggleDarkMode,
        toggleNotificationSound,
        toggleNotificationVibration,
        toggleOnlyGoWorkMode,
        startWork,
        endWork,
        completeWork,
        setCurrentShift: updateCurrentShift,
        setShifts,
        setNotes,
        requestAlarmPermission,
        // Location functions
        requestLocationPermission,
        saveHomeLocationData,
        saveWorkLocationData,
        checkLocationDistance,
        // Multi-Function Button actions
        handleMultiFunctionButton,
        handlePunchButton,
        resetAttendanceLogs,
        // Note functions
        addNoteWithReminder,
        updateNoteWithReminder,
        deleteNoteWithReminder,
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
        handleOtRateWeekdayChange,
        // Night OT Calculation Rule functions
        updateNightOtCalculationRule,
        // Fixed Rate functions
        updateFixedRateStandardNight,
        updateFixedRateOtWeekdayNight,
        updateFixedRateOtSaturdayNight,
        updateFixedRateOtSundayNight,
        updateFixedRateOtHolidayNight,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}
