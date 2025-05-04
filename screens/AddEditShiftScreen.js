'use client'

import { useState, useEffect, useContext, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Switch,
  Modal,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import DateTimePicker from '@react-native-community/datetimepicker'
import { AppContext } from '../context/AppContext'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { STORAGE_KEYS } from '../utils/constants'
import { useFocusEffect } from '@react-navigation/native'
import { COLORS } from '../utils/theme'

const AddEditShiftScreen = ({ route, navigation }) => {
  const { t, darkMode, currentShift, setCurrentShift } = useContext(AppContext)
  const { shiftId } = route.params || {}
  const isEditing = !!shiftId
  const isCurrentShift = currentShift && currentShift.id === shiftId

  // Form state
  const [shiftName, setShiftName] = useState('')
  const [departureTime, setDepartureTime] = useState(() => {
    const dt = new Date()
    dt.setHours(dt.getHours() - 1, dt.getMinutes(), 0, 0)
    return dt
  })
  const [startTime, setStartTime] = useState(new Date())
  const [officeEndTime, setOfficeEndTime] = useState(() => {
    const oet = new Date()
    oet.setHours(oet.getHours() + 8, oet.getMinutes(), 0, 0)
    return oet
  })
  const [endTime, setEndTime] = useState(() => {
    const et = new Date()
    et.setHours(et.getHours() + 8, et.getMinutes(), 0, 0)
    return et
  })
  const [breakTime, setBreakTime] = useState('60')
  const [remindBeforeStart, setRemindBeforeStart] = useState('15')
  const [remindAfterEnd, setRemindAfterEnd] = useState('15')
  const [isActive, setIsActive] = useState(false)
  const [showPunch, setShowPunch] = useState(false)
  const [daysApplied, setDaysApplied] = useState(['T2', 'T3', 'T4', 'T5', 'T6'])

  // UI state
  const [isLoading, setIsLoading] = useState(false)
  const [isFormDirty, setIsFormDirty] = useState(false)

  // Time picker state
  const [showDepartureTimePicker, setShowDepartureTimePicker] = useState(false)
  const [showStartTimePicker, setShowStartTimePicker] = useState(false)
  const [showOfficeEndTimePicker, setShowOfficeEndTimePicker] = useState(false)
  const [showEndTimePicker, setShowEndTimePicker] = useState(false)
  const [pickerMode, setPickerMode] = useState(null)

  // Reminder dropdown state
  const [showRemindBeforeDropdown, setShowRemindBeforeDropdown] =
    useState(false)
  const [showRemindAfterDropdown, setShowRemindAfterDropdown] = useState(false)

  // Reminder options
  const reminderOptions = ['10', '15', '30']

  // Validation state
  const [errors, setErrors] = useState({})
  const [isFormValid, setIsFormValid] = useState(false)

  // Days of week options
  const daysOfWeek = [
    { key: 'T2', label: 'T2' },
    { key: 'T3', label: 'T3' },
    { key: 'T4', label: 'T4' },
    { key: 'T5', label: 'T5' },
    { key: 'T6', label: 'T6' },
    { key: 'T7', label: 'T7' },
    { key: 'CN', label: 'CN' },
  ]

  // Helper function to convert string time to Date object
  const timeStringToDate = useCallback((timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number)
    const date = new Date()
    date.setHours(hours, minutes, 0, 0)
    return date
  }, [])

  // Load shift data
  const loadShiftData = useCallback(async () => {
    if (!shiftId) return

    setIsLoading(true)
    try {
      const shiftsData = await AsyncStorage.getItem(STORAGE_KEYS.SHIFT_LIST)
      if (shiftsData) {
        const shifts = JSON.parse(shiftsData)
        const shift = shifts.find((s) => s.id === shiftId)

        if (shift) {
          setShiftName(shift.name || '')

          // Convert string times to Date objects
          if (shift.departureTime) {
            setDepartureTime(timeStringToDate(shift.departureTime))
          } else {
            // Default to 30 minutes before start time
            const depTime = timeStringToDate(shift.startTime)
            depTime.setMinutes(depTime.getMinutes() - 30)
            setDepartureTime(depTime)
          }

          setStartTime(timeStringToDate(shift.startTime))

          if (shift.officeEndTime) {
            setOfficeEndTime(timeStringToDate(shift.officeEndTime))
          } else {
            // Default to same as end time
            setOfficeEndTime(timeStringToDate(shift.endTime))
          }

          setEndTime(timeStringToDate(shift.endTime))

          setBreakTime(shift.breakTime?.toString() || '60')
          setRemindBeforeStart(shift.remindBeforeStart?.toString() || '15')
          setRemindAfterEnd(shift.remindAfterEnd?.toString() || '15')
          setIsActive(shift.isActive === true)
          setShowPunch(shift.showPunch === true)
          setDaysApplied(shift.daysApplied || ['T2', 'T3', 'T4', 'T5', 'T6'])
        }
      }
    } catch (error) {
      console.error('Error loading shift data:', error)
      Alert.alert(t('Error'), t('Failed to load shift data'))
    } finally {
      setIsLoading(false)
      setIsFormDirty(false)
    }
  }, [shiftId, t, timeStringToDate])

  useEffect(() => {
    if (isEditing) {
      loadShiftData()
    }
  }, [isEditing, loadShiftData])

  // Các hàm xử lý thời gian được triển khai riêng cho từng loại picker

  // Hàm cập nhật giá trị thời gian
  const updateTimeValue = (pickerType, selectedTime) => {
    switch (pickerType) {
      case 'departure': {
        setDepartureTime(selectedTime)
        break
      }
      case 'start': {
        setStartTime(selectedTime)

        // Adjust departure time if needed (should be at least 5 minutes before start time)
        const depMinutes =
          departureTime.getHours() * 60 + departureTime.getMinutes()
        const startMinutes =
          selectedTime.getHours() * 60 + selectedTime.getMinutes()

        // Check if departure time is less than 5 minutes before start time
        // Handle overnight case: if start time is early morning and departure time is late night
        const isOvernight = startMinutes < depMinutes && startMinutes < 240 // 4 AM threshold
        const minutesDiff = isOvernight
          ? startMinutes + 24 * 60 - depMinutes
          : startMinutes - depMinutes

        if (minutesDiff > -5) {
          // Set departure time to 30 minutes before start time
          const newDepTime = new Date(selectedTime)
          newDepTime.setMinutes(newDepTime.getMinutes() - 30)
          setDepartureTime(newDepTime)
        }

        // Adjust office end time if needed (should be at least 2 hours after start time)
        const officeEndMinutes =
          officeEndTime.getHours() * 60 + officeEndTime.getMinutes()

        // Check if office end time is less than 2 hours after start time
        // Handle overnight case
        const isOvernightOffice = officeEndMinutes < startMinutes
        const officeDiff = isOvernightOffice
          ? officeEndMinutes + 24 * 60 - startMinutes
          : officeEndMinutes - startMinutes

        if (officeDiff < 120) {
          // 2 hours = 120 minutes
          // Set office end time to 2 hours after start time
          const newOfficeEndTime = new Date(selectedTime)
          newOfficeEndTime.setHours(newOfficeEndTime.getHours() + 2)
          setOfficeEndTime(newOfficeEndTime)

          // Also adjust end time if needed
          if (endTime <= officeEndTime) {
            setEndTime(new Date(newOfficeEndTime))
          }
        }
        break
      }
      case 'officeEnd': {
        setOfficeEndTime(selectedTime)

        // Adjust end time if needed (should be at least equal to office end time)
        if (endTime < selectedTime) {
          setEndTime(new Date(selectedTime))
        }
        break
      }
      case 'end': {
        setEndTime(selectedTime)
        break
      }
    }

    // Validate after time changes
    validateForm()
  }

  // Specific handlers for each time picker
  const handleDepartureTimeChange = (event, selectedTime) => {
    // Trên Android, event.type không tồn tại và selectedTime sẽ là null nếu người dùng hủy
    if (Platform.OS === 'android') {
      setShowDepartureTimePicker(false)
      if (selectedTime) {
        setIsFormDirty(true)
        updateTimeValue('departure', selectedTime)
      }
    }
    // Trên iOS, chỉ ẩn picker khi người dùng nhấn Done và cập nhật giá trị
    else if (Platform.OS === 'ios') {
      if (event.type === 'set') {
        setShowDepartureTimePicker(false)
        setIsFormDirty(true)
        updateTimeValue('departure', selectedTime)
      } else if (event.type === 'dismissed') {
        setShowDepartureTimePicker(false)
      }
    }
    // Xử lý cho web hoặc các nền tảng khác
    else {
      setShowDepartureTimePicker(false)
      if (selectedTime) {
        setIsFormDirty(true)
        updateTimeValue('departure', selectedTime)
      }
    }
  }

  const handleStartTimeChange = (event, selectedTime) => {
    // Trên Android, event.type không tồn tại và selectedTime sẽ là null nếu người dùng hủy
    if (Platform.OS === 'android') {
      setShowStartTimePicker(false)
      if (selectedTime) {
        setIsFormDirty(true)
        updateTimeValue('start', selectedTime)
      }
    }
    // Trên iOS, chỉ ẩn picker khi người dùng nhấn Done và cập nhật giá trị
    else if (Platform.OS === 'ios') {
      if (event.type === 'set') {
        setShowStartTimePicker(false)
        setIsFormDirty(true)
        updateTimeValue('start', selectedTime)
      } else if (event.type === 'dismissed') {
        setShowStartTimePicker(false)
      }
    }
    // Xử lý cho web hoặc các nền tảng khác
    else {
      setShowStartTimePicker(false)
      if (selectedTime) {
        setIsFormDirty(true)
        updateTimeValue('start', selectedTime)
      }
    }
  }

  const handleOfficeEndTimeChange = (event, selectedTime) => {
    // Trên Android, event.type không tồn tại và selectedTime sẽ là null nếu người dùng hủy
    if (Platform.OS === 'android') {
      setShowOfficeEndTimePicker(false)
      if (selectedTime) {
        setIsFormDirty(true)
        updateTimeValue('officeEnd', selectedTime)
      }
    }
    // Trên iOS, chỉ ẩn picker khi người dùng nhấn Done và cập nhật giá trị
    else if (Platform.OS === 'ios') {
      if (event.type === 'set') {
        setShowOfficeEndTimePicker(false)
        setIsFormDirty(true)
        updateTimeValue('officeEnd', selectedTime)
      } else if (event.type === 'dismissed') {
        setShowOfficeEndTimePicker(false)
      }
    }
    // Xử lý cho web hoặc các nền tảng khác
    else {
      setShowOfficeEndTimePicker(false)
      if (selectedTime) {
        setIsFormDirty(true)
        updateTimeValue('officeEnd', selectedTime)
      }
    }
  }

  const handleEndTimeChange = (event, selectedTime) => {
    // Trên Android, event.type không tồn tại và selectedTime sẽ là null nếu người dùng hủy
    if (Platform.OS === 'android') {
      setShowEndTimePicker(false)
      if (selectedTime) {
        setIsFormDirty(true)
        updateTimeValue('end', selectedTime)
      }
    }
    // Trên iOS, chỉ ẩn picker khi người dùng nhấn Done và cập nhật giá trị
    else if (Platform.OS === 'ios') {
      if (event.type === 'set') {
        setShowEndTimePicker(false)
        setIsFormDirty(true)
        updateTimeValue('end', selectedTime)
      } else if (event.type === 'dismissed') {
        setShowEndTimePicker(false)
      }
    }
    // Xử lý cho web hoặc các nền tảng khác
    else {
      setShowEndTimePicker(false)
      if (selectedTime) {
        setIsFormDirty(true)
        updateTimeValue('end', selectedTime)
      }
    }
  }

  const formatTimeForDisplay = (date) => {
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  }

  const toggleDaySelection = (day) => {
    if (daysApplied.includes(day)) {
      setDaysApplied(daysApplied.filter((d) => d !== day))
    } else {
      setDaysApplied([...daysApplied, day])
    }
  }

  // Check if shift name is unique
  const isShiftNameUnique = useCallback(async (name, currentId = null) => {
    try {
      const shiftsData = await AsyncStorage.getItem(STORAGE_KEYS.SHIFT_LIST)
      if (!shiftsData) return true

      const shifts = JSON.parse(shiftsData)

      // Normalize name is already done before calling this function
      // We expect name to be already normalized (trimmed, extra spaces removed, lowercase)
      const normalizedName = name

      return !shifts.some((shift) => {
        // Normalize each shift name in the same way
        const normalizedShiftName = shift.name
          .trim()
          .replace(/\s+/g, ' ')
          .toLowerCase()

        return shift.id !== currentId && normalizedShiftName === normalizedName
      })
    } catch (error) {
      console.error('Error checking shift name uniqueness:', error)
      return true // Assume unique on error to not block user
    }
  }, [])

  // Validate form fields
  const validateForm = useCallback(async () => {
    const newErrors = {}
    let isValid = true

    // Validate shift name
    if (!shiftName.trim()) {
      newErrors.shiftName = t('Tên ca không được để trống.')
      isValid = false
    } else if (shiftName.length > 200) {
      newErrors.shiftName = t('Tên ca quá dài (tối đa 200 ký tự).')
      isValid = false
    } else {
      // Check for valid characters (letters, numbers, spaces)
      // This regex allows Unicode letters from various languages
      const nameRegex = /^[\p{L}\p{N}\s]+$/u
      if (!nameRegex.test(shiftName)) {
        newErrors.shiftName = t('Tên ca chứa ký tự không hợp lệ.')
        isValid = false
      } else {
        // Normalize name by removing extra spaces and converting to lowercase
        const normalizedName = shiftName
          .trim()
          .replace(/\s+/g, ' ')
          .toLowerCase()

        // Check for uniqueness
        const isUnique = await isShiftNameUnique(
          normalizedName,
          isEditing ? shiftId : null
        )
        if (!isUnique) {
          newErrors.shiftName = t('Tên ca này đã tồn tại.')
          isValid = false
        }
      }
    }

    // Validate time fields
    // Helper function to convert time to minutes since midnight
    const timeToMinutes = (date) => date.getHours() * 60 + date.getMinutes()

    // Helper function to calculate difference between times, handling overnight shifts
    const getTimeDiff = (laterTime, earlierTime, isOvernight) => {
      const laterMinutes = timeToMinutes(laterTime)
      const earlierMinutes = timeToMinutes(earlierTime)

      return isOvernight
        ? laterMinutes + 24 * 60 - earlierMinutes
        : laterMinutes - earlierMinutes
    }

    // 1. Departure time vs Start time (at least 5 minutes before)
    const depMinutes = timeToMinutes(departureTime)
    const startMinutes = timeToMinutes(startTime)

    // Handle overnight case - consider it overnight if start time is early morning (before 4 AM)
    // and departure time is late night
    const isOvernightDep = startMinutes < depMinutes && startMinutes < 240 // 4 AM threshold
    const depDiff = getTimeDiff(startTime, departureTime, isOvernightDep)

    if (depDiff < 5) {
      // Should be at least 5 minutes before
      newErrors.departureTime = t(
        'Giờ xuất phát phải trước giờ bắt đầu ít nhất 5 phút.'
      )
      isValid = false
    }

    // 2. Start time vs Office End time (start must be before office end)
    const officeEndMinutes = timeToMinutes(officeEndTime)

    // Handle overnight case - consider it overnight if office end time is earlier in the day than start time
    const isOvernightOffice =
      officeEndMinutes < startMinutes && officeEndMinutes < 240
    const officeDiff = getTimeDiff(officeEndTime, startTime, isOvernightOffice)

    if (officeDiff <= 0) {
      newErrors.officeEndTime = t('Giờ bắt đầu phải trước giờ kết thúc HC.')
      isValid = false
    } else if (officeDiff < 120) {
      // 3. Office work time must be at least 2 hours (120 minutes)
      newErrors.officeEndTime = t(
        'Thời gian làm việc HC tối thiểu phải là 2 giờ.'
      )
      isValid = false
    }

    // 4. End time vs Office End time
    const endMinutes = timeToMinutes(endTime)

    // Handle overnight case for end time
    const isOvernightEnd = endMinutes < officeEndMinutes && endMinutes < 240
    const endDiff = getTimeDiff(endTime, officeEndTime, isOvernightEnd)

    if (endDiff < 0) {
      newErrors.endTime = t(
        'Giờ kết thúc ca phải sau hoặc bằng giờ kết thúc HC.'
      )
      isValid = false
    } else if (endDiff > 0 && endDiff < 30) {
      // If there's overtime (end time > office end time), it should be at least 30 minutes
      newErrors.endTime = t(
        'Nếu có OT, giờ kết thúc ca phải sau giờ kết thúc HC ít nhất 30 phút.'
      )
      isValid = false
    }

    // Validate numeric fields
    // Helper function to validate numeric fields
    const validateNumericField = (
      value,
      fieldName,
      errorMessage,
      minValue = 0,
      maxValue = null
    ) => {
      const numValue = parseInt(value, 10)

      if (isNaN(numValue)) {
        newErrors[fieldName] = t('Vui lòng nhập một số hợp lệ.')
        isValid = false
        return false
      }

      if (numValue < minValue) {
        newErrors[fieldName] =
          errorMessage || t(`Giá trị phải lớn hơn hoặc bằng ${minValue}.`)
        isValid = false
        return false
      }

      if (maxValue !== null && numValue > maxValue) {
        newErrors[fieldName] = t(`Giá trị không được vượt quá ${maxValue}.`)
        isValid = false
        return false
      }

      return true
    }

    // Break time (0-240 minutes, tối đa 4 giờ)
    validateNumericField(
      breakTime,
      'breakTime',
      t('Thời gian nghỉ phải là số dương.'),
      0,
      240
    )

    // Remind before start (0-120 minutes, tối đa 2 giờ)
    validateNumericField(
      remindBeforeStart,
      'remindBeforeStart',
      t('Thời gian nhắc nhở trước phải là số dương.'),
      0,
      120
    )

    // Remind after end (0-120 minutes, tối đa 2 giờ)
    validateNumericField(
      remindAfterEnd,
      'remindAfterEnd',
      t('Thời gian nhắc nhở sau phải là số dương.'),
      0,
      120
    )

    // Validate days applied
    if (daysApplied.length === 0) {
      newErrors.daysApplied = t('Vui lòng chọn ít nhất một ngày áp dụng ca.')
      isValid = false
    }

    setErrors(newErrors)
    setIsFormValid(isValid)
    return isValid
  }, [
    shiftName,
    departureTime,
    startTime,
    officeEndTime,
    endTime,
    breakTime,
    remindBeforeStart,
    remindAfterEnd,
    daysApplied,
    isShiftNameUnique,
    isEditing,
    shiftId,
    t,
  ])

  // Reset form to initial values
  const resetForm = useCallback(() => {
    // Show confirmation dialog
    Alert.alert(
      t('Xác nhận đặt lại'),
      t(
        'Bạn có chắc chắn muốn đặt lại tất cả các trường về giá trị ban đầu không?'
      ),
      [
        {
          text: t('Hủy'),
          style: 'cancel',
        },
        {
          text: t('Đặt lại'),
          style: 'destructive',
          onPress: () => {
            if (isEditing) {
              // If editing, reload the original data
              loadShiftData()
            } else {
              // If creating new, set to default values
              setShiftName('')

              const dt = new Date()
              dt.setHours(dt.getHours() - 1, dt.getMinutes(), 0, 0)
              setDepartureTime(dt)

              const st = new Date()
              st.setHours(st.getHours(), st.getMinutes(), 0, 0)
              setStartTime(st)

              const oet = new Date()
              oet.setHours(oet.getHours() + 8, oet.getMinutes(), 0, 0)
              setOfficeEndTime(oet)

              const et = new Date()
              et.setHours(et.getHours() + 8, et.getMinutes(), 0, 0)
              setEndTime(et)

              setBreakTime('60')
              setRemindBeforeStart('15')
              setRemindAfterEnd('15')
              setIsActive(false)
              setShowPunch(false)
              setDaysApplied(['T2', 'T3', 'T4', 'T5', 'T6'])
            }

            setErrors({})
            setIsFormDirty(false)
            setIsFormValid(true)
          },
        },
      ]
    )
  }, [isEditing, loadShiftData, t])

  // Save shift data
  const handleSaveShift = async () => {
    setIsLoading(true)

    try {
      // Validate form
      const isValid = await validateForm()
      if (!isValid) {
        setIsLoading(false)
        return
      }

      // Format times as strings (HH:MM)
      const formattedDepartureTime = formatTimeForDisplay(departureTime)
      const formattedStartTime = formatTimeForDisplay(startTime)
      const formattedOfficeEndTime = formatTimeForDisplay(officeEndTime)
      const formattedEndTime = formatTimeForDisplay(endTime)

      // Show confirmation dialog
      Alert.alert(
        isEditing ? t('Xác nhận cập nhật') : t('Xác nhận thêm mới'),
        isEditing
          ? t('Bạn có chắc chắn muốn cập nhật ca làm việc này không?')
          : t('Bạn có chắc chắn muốn thêm ca làm việc mới này không?'),
        [
          {
            text: t('Hủy'),
            style: 'cancel',
            onPress: () => setIsLoading(false),
          },
          {
            text: isEditing ? t('Cập nhật') : t('Thêm mới'),
            onPress: async () => {
              try {
                // Get existing shifts
                const shiftsData = await AsyncStorage.getItem(
                  STORAGE_KEYS.SHIFT_LIST
                )
                let shifts = shiftsData ? JSON.parse(shiftsData) : []

                const newShift = {
                  id: isEditing ? shiftId : Date.now().toString(),
                  name: shiftName.trim(),
                  departureTime: formattedDepartureTime,
                  startTime: formattedStartTime,
                  officeEndTime: formattedOfficeEndTime,
                  endTime: formattedEndTime,
                  breakTime: parseInt(breakTime, 10),
                  remindBeforeStart: parseInt(remindBeforeStart, 10),
                  remindAfterEnd: parseInt(remindAfterEnd, 10),
                  isActive,
                  showPunch,
                  daysApplied,
                  updatedAt: new Date().toISOString(),
                }

                if (isEditing) {
                  // Update existing shift
                  shifts = shifts.map((shift) =>
                    shift.id === shiftId ? newShift : shift
                  )
                } else {
                  // Add new shift
                  newShift.createdAt = new Date().toISOString()
                  shifts.push(newShift)
                }

                // Save updated shifts
                await AsyncStorage.setItem(
                  STORAGE_KEYS.SHIFT_LIST,
                  JSON.stringify(shifts)
                )

                // Nếu đang cập nhật ca hiện tại, cập nhật trong context
                if (isCurrentShift) {
                  // Nếu ca hiện tại bị tắt, hiển thị thông báo
                  if (!isActive) {
                    Alert.alert(
                      t('Thông báo'),
                      t('Ca làm việc đã bị tắt và không còn được áp dụng nữa.'),
                      [{ text: t('OK') }]
                    )
                  }

                  // Cập nhật ca hiện tại trong context
                  await setCurrentShift(isActive ? newShift : null)
                }

                // Navigate back
                navigation.goBack()
              } catch (error) {
                console.error('Error saving shift:', error)
                Alert.alert(t('Lỗi'), t('Không thể lưu ca làm việc'))
                setIsLoading(false)
              }
            },
          },
        ]
      )
    } catch (error) {
      console.error('Error in save process:', error)
      Alert.alert(t('Lỗi'), t('Đã xảy ra lỗi khi xử lý'))
      setIsLoading(false)
    }
  }

  // Run validation on form changes
  useEffect(() => {
    if (isFormDirty) {
      validateForm()
    }
  }, [
    isFormDirty,
    shiftName,
    departureTime,
    startTime,
    officeEndTime,
    endTime,
    breakTime,
    remindBeforeStart,
    remindAfterEnd,
    daysApplied,
    validateForm,
  ])

  // Render time picker for iOS
  const renderIOSTimePicker = (visible, value, onChange, onClose) => {
    if (!visible || Platform.OS !== 'ios') return null

    return (
      <Modal transparent={true} animationType="slide" visible={visible}>
        <View style={styles.modalContainer}>
          <View
            style={[
              styles.pickerContainer,
              darkMode && styles.darkPickerContainer,
            ]}
          >
            <View style={styles.pickerHeader}>
              <TouchableOpacity onPress={onClose} style={styles.pickerButton}>
                <Text style={styles.pickerButtonText}>{t('Hủy')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.pickerButton}>
                <Text style={[styles.pickerButtonText, styles.doneButton]}>
                  {t('Xong')}
                </Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={value}
              mode="time"
              is24Hour={true}
              display="spinner"
              onChange={onChange}
              style={styles.iosPicker}
              themeVariant={darkMode ? 'dark' : 'light'}
            />
          </View>
        </View>
      </Modal>
    )
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, darkMode && styles.darkContainer]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#8a56ff" />
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View
          style={[styles.formContainer, darkMode && styles.darkFormContainer]}
        >
          <View style={styles.formHeader}>
            <Text style={[styles.formTitle, darkMode && styles.darkText]}>
              {isEditing
                ? t('Chỉnh sửa ca làm việc')
                : t('Thêm ca làm việc mới')}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons
                name="close"
                size={24}
                color={darkMode ? '#fff' : '#333'}
              />
            </TouchableOpacity>
          </View>

          {/* Shift Name */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, darkMode && styles.darkLabel]}>
              {t('Tên ca làm việc')} <Text style={styles.requiredMark}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                darkMode && styles.darkInput,
                errors.shiftName && styles.inputError,
              ]}
              value={shiftName}
              onChangeText={(text) => {
                setShiftName(text)
                setIsFormDirty(true)
              }}
              placeholder={t('Nhập tên ca làm việc')}
              placeholderTextColor={darkMode ? '#666' : '#999'}
              maxLength={200}
            />
            {errors.shiftName && (
              <Text style={styles.errorText}>{errors.shiftName}</Text>
            )}
          </View>

          {/* Departure Time */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, darkMode && styles.darkLabel]}>
              {t('Giờ xuất phát')} <Text style={styles.requiredMark}>*</Text>
            </Text>
            <TouchableOpacity
              style={[
                styles.input,
                styles.timeInput,
                darkMode && styles.darkInput,
                errors.departureTime && styles.inputError,
              ]}
              onPress={() => setShowDepartureTimePicker(true)}
            >
              <Text style={[styles.timeText, darkMode && styles.darkTimeText]}>
                {formatTimeForDisplay(departureTime)}
              </Text>
              <Ionicons
                name="time-outline"
                size={24}
                color={darkMode ? '#fff' : '#333'}
              />
            </TouchableOpacity>
            {errors.departureTime && (
              <Text style={styles.errorText}>{errors.departureTime}</Text>
            )}
            {Platform.OS === 'android' && showDepartureTimePicker && (
              <DateTimePicker
                value={departureTime}
                mode="time"
                is24Hour={true}
                display="default"
                onChange={handleDepartureTimeChange}
                themeVariant={darkMode ? 'dark' : 'light'}
              />
            )}
            {renderIOSTimePicker(
              showDepartureTimePicker,
              departureTime,
              handleDepartureTimeChange,
              () => setShowDepartureTimePicker(false)
            )}
          </View>

          {/* Start Time */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, darkMode && styles.darkLabel]}>
              {t('Giờ bắt đầu')} <Text style={styles.requiredMark}>*</Text>
            </Text>
            <TouchableOpacity
              style={[
                styles.input,
                styles.timeInput,
                darkMode && styles.darkInput,
                errors.startTime && styles.inputError,
              ]}
              onPress={() => setShowStartTimePicker(true)}
            >
              <Text style={[styles.timeText, darkMode && styles.darkTimeText]}>
                {formatTimeForDisplay(startTime)}
              </Text>
              <Ionicons
                name="time-outline"
                size={24}
                color={darkMode ? '#fff' : '#333'}
              />
            </TouchableOpacity>
            {errors.startTime && (
              <Text style={styles.errorText}>{errors.startTime}</Text>
            )}
            {Platform.OS === 'android' && showStartTimePicker && (
              <DateTimePicker
                value={startTime}
                mode="time"
                is24Hour={true}
                display="default"
                onChange={handleStartTimeChange}
                themeVariant={darkMode ? 'dark' : 'light'}
              />
            )}
            {renderIOSTimePicker(
              showStartTimePicker,
              startTime,
              handleStartTimeChange,
              () => setShowStartTimePicker(false)
            )}
          </View>

          {/* Office End Time */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, darkMode && styles.darkLabel]}>
              {t('Giờ kết thúc HC')} <Text style={styles.requiredMark}>*</Text>
            </Text>
            <TouchableOpacity
              style={[
                styles.input,
                styles.timeInput,
                darkMode && styles.darkInput,
                errors.officeEndTime && styles.inputError,
              ]}
              onPress={() => setShowOfficeEndTimePicker(true)}
            >
              <Text style={[styles.timeText, darkMode && styles.darkTimeText]}>
                {formatTimeForDisplay(officeEndTime)}
              </Text>
              <Ionicons
                name="time-outline"
                size={24}
                color={darkMode ? '#fff' : '#333'}
              />
            </TouchableOpacity>
            {errors.officeEndTime && (
              <Text style={styles.errorText}>{errors.officeEndTime}</Text>
            )}
            {Platform.OS === 'android' && showOfficeEndTimePicker && (
              <DateTimePicker
                value={officeEndTime}
                mode="time"
                is24Hour={true}
                display="default"
                onChange={handleOfficeEndTimeChange}
                themeVariant={darkMode ? 'dark' : 'light'}
              />
            )}
            {renderIOSTimePicker(
              showOfficeEndTimePicker,
              officeEndTime,
              handleOfficeEndTimeChange,
              () => setShowOfficeEndTimePicker(false)
            )}
          </View>

          {/* End Time */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, darkMode && styles.darkLabel]}>
              {t('Giờ kết thúc ca')} <Text style={styles.requiredMark}>*</Text>
            </Text>
            <TouchableOpacity
              style={[
                styles.input,
                styles.timeInput,
                darkMode && styles.darkInput,
                errors.endTime && styles.inputError,
              ]}
              onPress={() => setShowEndTimePicker(true)}
            >
              <Text style={[styles.timeText, darkMode && styles.darkTimeText]}>
                {formatTimeForDisplay(endTime)}
              </Text>
              <Ionicons
                name="time-outline"
                size={24}
                color={darkMode ? '#fff' : '#333'}
              />
            </TouchableOpacity>
            {errors.endTime && (
              <Text style={styles.errorText}>{errors.endTime}</Text>
            )}
            {Platform.OS === 'android' && showEndTimePicker && (
              <DateTimePicker
                value={endTime}
                mode="time"
                is24Hour={true}
                display="default"
                onChange={handleEndTimeChange}
                themeVariant={darkMode ? 'dark' : 'light'}
              />
            )}
            {renderIOSTimePicker(
              showEndTimePicker,
              endTime,
              handleEndTimeChange,
              () => setShowEndTimePicker(false)
            )}
          </View>

          {/* Overnight Shift Indicator */}
          {(endTime.getHours() < startTime.getHours() ||
            officeEndTime.getHours() < startTime.getHours()) && (
            <View style={styles.overnightWarning}>
              <Ionicons name="information-circle" size={20} color="#ff9800" />
              <View style={{ flex: 1 }}>
                <Text style={styles.overnightText}>
                  {t('Ca qua đêm - kết thúc vào ngày hôm sau')}
                </Text>
                <Text
                  style={[styles.overnightText, { fontSize: 12, marginTop: 4 }]}
                >
                  {t('Các thời gian kết thúc sẽ được tính vào ngày hôm sau')}
                </Text>
              </View>
            </View>
          )}

          {/* Days Applied */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, darkMode && styles.darkLabel]}>
              {t('Áp dụng cho các ngày')}{' '}
              <Text style={styles.requiredMark}>*</Text>
            </Text>
            <View style={styles.daysContainer}>
              {daysOfWeek.map((day) => (
                <TouchableOpacity
                  key={day.key}
                  style={[
                    styles.dayButton,
                    daysApplied.includes(day.key) && styles.dayButtonSelected,
                  ]}
                  onPress={() => {
                    toggleDaySelection(day.key)
                    setIsFormDirty(true)
                  }}
                >
                  <Text
                    style={[
                      styles.dayButtonText,
                      daysApplied.includes(day.key) &&
                        styles.dayButtonTextSelected,
                    ]}
                  >
                    {day.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.daysApplied && (
              <Text style={styles.errorText}>{errors.daysApplied}</Text>
            )}
          </View>

          {/* Remind Before Start */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, darkMode && styles.darkLabel]}>
              {t('Nhắc nhở trước chấm công vào (phút)')}
            </Text>
            <TouchableOpacity
              style={[
                styles.input,
                styles.timeInput,
                darkMode && styles.darkInput,
                errors.remindBeforeStart && styles.inputError,
              ]}
              onPress={() =>
                setShowRemindBeforeDropdown(!showRemindBeforeDropdown)
              }
            >
              <Text style={[styles.timeText, darkMode && styles.darkTimeText]}>
                {remindBeforeStart}
              </Text>
              <Ionicons
                name="chevron-down-outline"
                size={24}
                color={darkMode ? '#fff' : '#333'}
              />
            </TouchableOpacity>
            {showRemindBeforeDropdown && (
              <View
                style={[
                  styles.dropdownContainer,
                  darkMode && styles.darkDropdownContainer,
                ]}
              >
                {reminderOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.dropdownItem,
                      remindBeforeStart === option &&
                        styles.dropdownItemSelected,
                      darkMode && styles.darkDropdownItem,
                      remindBeforeStart === option &&
                        darkMode &&
                        styles.darkDropdownItemSelected,
                    ]}
                    onPress={() => {
                      setRemindBeforeStart(option)
                      setShowRemindBeforeDropdown(false)
                      setIsFormDirty(true)
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        remindBeforeStart === option &&
                          styles.dropdownItemTextSelected,
                        darkMode && styles.darkDropdownItemText,
                      ]}
                    >
                      {option}
                    </Text>
                    {remindBeforeStart === option && (
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={darkMode ? '#fff' : '#8a56ff'}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {errors.remindBeforeStart && (
              <Text style={styles.errorText}>{errors.remindBeforeStart}</Text>
            )}
          </View>

          {/* Remind After End */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, darkMode && styles.darkLabel]}>
              {t('Nhắc nhở chấm công ra sau (phút)')}
            </Text>
            <TouchableOpacity
              style={[
                styles.input,
                styles.timeInput,
                darkMode && styles.darkInput,
                errors.remindAfterEnd && styles.inputError,
              ]}
              onPress={() =>
                setShowRemindAfterDropdown(!showRemindAfterDropdown)
              }
            >
              <Text style={[styles.timeText, darkMode && styles.darkTimeText]}>
                {remindAfterEnd}
              </Text>
              <Ionicons
                name="chevron-down-outline"
                size={24}
                color={darkMode ? '#fff' : '#333'}
              />
            </TouchableOpacity>
            {showRemindAfterDropdown && (
              <View
                style={[
                  styles.dropdownContainer,
                  darkMode && styles.darkDropdownContainer,
                ]}
              >
                {reminderOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.dropdownItem,
                      remindAfterEnd === option && styles.dropdownItemSelected,
                      darkMode && styles.darkDropdownItem,
                      remindAfterEnd === option &&
                        darkMode &&
                        styles.darkDropdownItemSelected,
                    ]}
                    onPress={() => {
                      setRemindAfterEnd(option)
                      setShowRemindAfterDropdown(false)
                      setIsFormDirty(true)
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        remindAfterEnd === option &&
                          styles.dropdownItemTextSelected,
                        darkMode && styles.darkDropdownItemText,
                      ]}
                    >
                      {option}
                    </Text>
                    {remindAfterEnd === option && (
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={darkMode ? '#fff' : '#8a56ff'}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {errors.remindAfterEnd && (
              <Text style={styles.errorText}>{errors.remindAfterEnd}</Text>
            )}
          </View>

          {/* Break Time */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, darkMode && styles.darkLabel]}>
              {t('Thời gian nghỉ (phút)')}
            </Text>
            <TextInput
              style={[
                styles.input,
                darkMode && styles.darkInput,
                errors.breakTime && styles.inputError,
              ]}
              value={breakTime}
              onChangeText={(text) => {
                setBreakTime(text)
                setIsFormDirty(true)
              }}
              keyboardType="numeric"
              placeholder="60"
              placeholderTextColor={darkMode ? '#666' : '#999'}
            />
            {errors.breakTime && (
              <Text style={styles.errorText}>{errors.breakTime}</Text>
            )}
          </View>

          {/* Show Punch Switch */}
          <View
            style={[
              styles.switchContainer,
              darkMode && styles.darkSwitchContainer,
            ]}
          >
            <Text style={[styles.switchLabel, darkMode && styles.darkLabel]}>
              {t('Yêu cầu ký công')}
            </Text>
            <Switch
              value={showPunch}
              onValueChange={(value) => {
                setShowPunch(value)
                setIsFormDirty(true)
              }}
              trackColor={{ false: '#767577', true: COLORS.PRIMARY }}
              thumbColor={showPunch ? '#f4f3f4' : '#f4f3f4'}
            />
          </View>

          {/* Active Switch */}
          <View
            style={[
              styles.switchContainer,
              darkMode && styles.darkSwitchContainer,
            ]}
          >
            <Text style={[styles.switchLabel, darkMode && styles.darkLabel]}>
              {t('Áp dụng')}
            </Text>
            <Switch
              value={isActive}
              onValueChange={(value) => {
                // Nếu đang tắt ca hiện tại, hiển thị xác nhận
                if (isCurrentShift && !value) {
                  Alert.alert(
                    t('Xác nhận tắt ca đang áp dụng'),
                    t(
                      'Ca này đang được áp dụng. Nếu tắt, ca này sẽ không còn được áp dụng nữa. Bạn có chắc chắn muốn tắt ca này không?'
                    ),
                    [
                      {
                        text: t('Hủy'),
                        style: 'cancel',
                      },
                      {
                        text: t('Tắt ca'),
                        style: 'destructive',
                        onPress: () => {
                          setIsActive(false)
                          setIsFormDirty(true)
                        },
                      },
                    ]
                  )
                } else {
                  setIsActive(value)
                  setIsFormDirty(true)
                }
              }}
              trackColor={{ false: '#767577', true: COLORS.PRIMARY }}
              thumbColor={isActive ? '#f4f3f4' : '#f4f3f4'}
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.resetButton, darkMode && styles.darkResetButton]}
              onPress={resetForm}
            >
              <Ionicons
                name="refresh-outline"
                size={22}
                color={darkMode ? COLORS.TEXT_DARK : COLORS.TEXT_LIGHT}
              />
              <Text
                style={[
                  styles.resetButtonText,
                  darkMode && styles.darkResetButtonText,
                ]}
              >
                {t('Đặt lại')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.saveButton,
                !isFormValid && styles.disabledButton,
                !isFormValid && darkMode && styles.darkDisabledButton,
              ]}
              onPress={handleSaveShift}
              disabled={!isFormValid}
            >
              <Ionicons
                name="save-outline"
                size={22}
                color={COLORS.TEXT_DARK}
              />
              <Text
                style={[
                  styles.saveButtonText,
                  !isFormValid && { opacity: 0.7 },
                ]}
              >
                {isEditing ? t('Cập nhật') : t('Thêm mới')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Thông báo lỗi */}
          {!isFormValid && (
            <Text style={styles.formErrorText}>
              {t('Vui lòng sửa các lỗi để tiếp tục')}
            </Text>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND_LIGHT,
  },
  darkContainer: {
    backgroundColor: COLORS.BACKGROUND_DARK,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  formContainer: {
    backgroundColor: COLORS.CARD_LIGHT,
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  darkFormContainer: {
    backgroundColor: COLORS.CARD_DARK,
    borderColor: COLORS.BORDER_DARK,
  },
  formHeader: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_LIGHT,
    flex: 1,
  },
  closeButton: {
    padding: 5,
    borderRadius: 20,
  },
  darkText: {
    color: COLORS.TEXT_DARK,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: COLORS.TEXT_LIGHT,
  },
  darkLabel: {
    color: COLORS.TEXT_DARK,
  },
  requiredMark: {
    color: '#ff3b30',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: COLORS.CARD_LIGHT,
    color: COLORS.TEXT_LIGHT,
  },
  darkInput: {
    borderColor: COLORS.BORDER_DARK,
    backgroundColor: COLORS.SECONDARY_CARD_DARK,
    color: COLORS.TEXT_DARK,
  },
  inputError: {
    borderColor: '#ff3b30',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
  },
  timeInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 16,
    color: COLORS.TEXT_LIGHT,
  },
  darkTimeText: {
    color: COLORS.TEXT_DARK,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  dayButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: COLORS.SECONDARY_CARD_LIGHT,
    marginRight: 8,
    marginBottom: 8,
  },
  dayButtonSelected: {
    backgroundColor: COLORS.PRIMARY,
  },
  dayButtonText: {
    fontSize: 14,
    color: COLORS.TEXT_LIGHT,
  },
  dayButtonTextSelected: {
    color: COLORS.TEXT_DARK,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_LIGHT,
  },
  darkSwitchContainer: {
    borderBottomColor: COLORS.BORDER_DARK,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.TEXT_LIGHT,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 8,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
    flexDirection: 'row',
  },
  resetButton: {
    backgroundColor: COLORS.SECONDARY_CARD_LIGHT,
    borderRadius: 8,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
    flexDirection: 'row',
  },
  darkResetButton: {
    backgroundColor: COLORS.SECONDARY_CARD_DARK,
    borderColor: COLORS.BORDER_DARK,
  },
  disabledButton: {
    backgroundColor: COLORS.DISABLED_LIGHT,
    opacity: 0.7,
    shadowOpacity: 0,
    elevation: 0,
  },
  darkDisabledButton: {
    backgroundColor: COLORS.DISABLED_DARK,
  },
  saveButtonText: {
    color: COLORS.TEXT_DARK,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  resetButtonText: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  darkResetButtonText: {
    color: COLORS.TEXT_DARK,
  },
  formErrorText: {
    color: '#ff3b30',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '500',
  },
  overnightWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ffcc80',
  },
  overnightText: {
    color: '#e65100',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  pickerContainer: {
    backgroundColor: COLORS.CARD_LIGHT,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 16,
  },
  darkPickerContainer: {
    backgroundColor: COLORS.CARD_DARK,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  pickerButton: {
    padding: 8,
  },
  pickerButtonText: {
    fontSize: 16,
    color: COLORS.PRIMARY,
  },
  doneButton: {
    fontWeight: 'bold',
  },
  iosPicker: {
    height: 200,
  },
  dropdownContainer: {
    position: 'absolute',
    top: 88,
    left: 0,
    right: 0,
    backgroundColor: COLORS.CARD_LIGHT,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  darkDropdownContainer: {
    backgroundColor: COLORS.CARD_DARK,
    borderColor: COLORS.BORDER_DARK,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_LIGHT,
  },
  darkDropdownItem: {
    borderBottomColor: COLORS.BORDER_DARK,
  },
  dropdownItemSelected: {
    backgroundColor: '#f0f0ff',
  },
  darkDropdownItemSelected: {
    backgroundColor: '#333355',
  },
  dropdownItemText: {
    fontSize: 16,
    color: COLORS.TEXT_LIGHT,
  },
  dropdownItemTextSelected: {
    color: COLORS.PRIMARY,
    fontWeight: '500',
  },
  darkDropdownItemText: {
    color: COLORS.TEXT_DARK,
  },
})

export default AddEditShiftScreen
