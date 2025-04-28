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

const AddEditShiftScreen = ({ route, navigation }) => {
  const { t, darkMode } = useContext(AppContext)
  const { shiftId } = route.params || {}
  const isEditing = !!shiftId

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
  const [isActive, setIsActive] = useState(true)
  const [isDefault, setIsDefault] = useState(false)
  const [showPunch, setShowPunch] = useState(true)
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
          setIsActive(shift.isActive !== false)
          setIsDefault(shift.isDefault === true)
          setShowPunch(shift.showPunch !== false)
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

  // Generic time picker handler
  const handleTimeChange = (pickerType, event, selectedTime) => {
    // Trên Android, event.type không tồn tại và selectedTime sẽ là null nếu người dùng hủy
    if (Platform.OS === 'android') {
      // Ẩn picker ngay lập tức
      switch (pickerType) {
        case 'departure': {
          setShowDepartureTimePicker(false)
          break
        }
        case 'start': {
          setShowStartTimePicker(false)
          break
        }
        case 'officeEnd': {
          setShowOfficeEndTimePicker(false)
          break
        }
        case 'end': {
          setShowEndTimePicker(false)
          break
        }
      }

      // Chỉ cập nhật nếu selectedTime không phải là null (người dùng không hủy)
      if (selectedTime) {
        setIsFormDirty(true)
        updateTimeValue(pickerType, selectedTime)
      }
    }
    // Trên iOS, chỉ ẩn picker khi người dùng nhấn Done và cập nhật giá trị
    else if (Platform.OS === 'ios') {
      if (event.type === 'set') {
        switch (pickerType) {
          case 'departure': {
            setShowDepartureTimePicker(false)
            break
          }
          case 'start': {
            setShowStartTimePicker(false)
            break
          }
          case 'officeEnd': {
            setShowOfficeEndTimePicker(false)
            break
          }
          case 'end': {
            setShowEndTimePicker(false)
            break
          }
        }

        setIsFormDirty(true)
        updateTimeValue(pickerType, selectedTime)
      } else if (event.type === 'dismissed') {
        switch (pickerType) {
          case 'departure': {
            setShowDepartureTimePicker(false)
            break
          }
          case 'start': {
            setShowStartTimePicker(false)
            break
          }
          case 'officeEnd': {
            setShowOfficeEndTimePicker(false)
            break
          }
          case 'end': {
            setShowEndTimePicker(false)
            break
          }
        }
      }
    }
    // Xử lý cho web hoặc các nền tảng khác
    else {
      switch (pickerType) {
        case 'departure': {
          setShowDepartureTimePicker(false)
          break
        }
        case 'start': {
          setShowStartTimePicker(false)
          break
        }
        case 'officeEnd': {
          setShowOfficeEndTimePicker(false)
          break
        }
        case 'end': {
          setShowEndTimePicker(false)
          break
        }
      }

      if (selectedTime) {
        setIsFormDirty(true)
        updateTimeValue(pickerType, selectedTime)
      }
    }
  }

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
  }

  // Specific handlers for each time picker
  const handleDepartureTimeChange = (event, selectedTime) => {
    handleTimeChange('departure', event, selectedTime)
  }

  const handleStartTimeChange = (event, selectedTime) => {
    handleTimeChange('start', event, selectedTime)
  }

  const handleOfficeEndTimeChange = (event, selectedTime) => {
    handleTimeChange('officeEnd', event, selectedTime)
  }

  const handleEndTimeChange = (event, selectedTime) => {
    handleTimeChange('end', event, selectedTime)
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
              setIsActive(true)
              setIsDefault(false)
              setShowPunch(true)
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

                // If isDefault is true, set all other shifts to not default
                if (isDefault) {
                  shifts = shifts.map((shift) => ({
                    ...shift,
                    isDefault: false,
                  }))
                }

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
                  isDefault,
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
        <View style={styles.formContainer}>
          <View style={styles.formHeader}>
            <Text style={[styles.formTitle, darkMode && styles.darkText]}>
              {isEditing
                ? t('Chỉnh sửa ca làm việc')
                : t('Thêm ca làm việc mới')}
            </Text>
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
            <TextInput
              style={[
                styles.input,
                darkMode && styles.darkInput,
                errors.remindBeforeStart && styles.inputError,
              ]}
              value={remindBeforeStart}
              onChangeText={(text) => {
                setRemindBeforeStart(text)
                setIsFormDirty(true)
              }}
              keyboardType="numeric"
              placeholder="15"
              placeholderTextColor={darkMode ? '#666' : '#999'}
            />
            {errors.remindBeforeStart && (
              <Text style={styles.errorText}>{errors.remindBeforeStart}</Text>
            )}
          </View>

          {/* Remind After End */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, darkMode && styles.darkLabel]}>
              {t('Nhắc nhở chấm công ra sau (phút)')}
            </Text>
            <TextInput
              style={[
                styles.input,
                darkMode && styles.darkInput,
                errors.remindAfterEnd && styles.inputError,
              ]}
              value={remindAfterEnd}
              onChangeText={(text) => {
                setRemindAfterEnd(text)
                setIsFormDirty(true)
              }}
              keyboardType="numeric"
              placeholder="15"
              placeholderTextColor={darkMode ? '#666' : '#999'}
            />
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
          <View style={styles.switchContainer}>
            <Text style={[styles.switchLabel, darkMode && styles.darkLabel]}>
              {t('Yêu cầu ký công')}
            </Text>
            <Switch
              value={showPunch}
              onValueChange={(value) => {
                setShowPunch(value)
                setIsFormDirty(true)
              }}
              trackColor={{ false: '#767577', true: '#8a56ff' }}
              thumbColor={showPunch ? '#f4f3f4' : '#f4f3f4'}
            />
          </View>

          {/* Active Switch */}
          <View style={styles.switchContainer}>
            <Text style={[styles.switchLabel, darkMode && styles.darkLabel]}>
              {t('Kích hoạt')}
            </Text>
            <Switch
              value={isActive}
              onValueChange={(value) => {
                setIsActive(value)
                setIsFormDirty(true)
              }}
              trackColor={{ false: '#767577', true: '#8a56ff' }}
              thumbColor={isActive ? '#f4f3f4' : '#f4f3f4'}
            />
          </View>

          {/* Default Switch */}
          <View style={styles.switchContainer}>
            <Text style={[styles.switchLabel, darkMode && styles.darkLabel]}>
              {t('Đặt làm mặc định')}
            </Text>
            <Switch
              value={isDefault}
              onValueChange={(value) => {
                setIsDefault(value)
                setIsFormDirty(true)
              }}
              trackColor={{ false: '#767577', true: '#8a56ff' }}
              thumbColor={isDefault ? '#f4f3f4' : '#f4f3f4'}
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.resetButton} onPress={resetForm}>
              <Text style={styles.resetButtonText}>{t('Đặt lại')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveButton, !isFormValid && styles.disabledButton]}
              onPress={handleSaveShift}
              disabled={!isFormValid}
            >
              <Text
                style={[
                  styles.saveButtonText,
                  !isFormValid && { opacity: 0.7 },
                ]}
              >
                {isEditing ? t('Cập nhật') : t('Thêm mới')}
              </Text>
              {!isFormValid && (
                <Text style={styles.disabledButtonHint}>
                  {t('Vui lòng sửa các lỗi để tiếp tục')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  formHeader: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 10,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  darkText: {
    color: '#f0f0f0',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  darkLabel: {
    color: '#f0f0f0',
  },
  requiredMark: {
    color: '#ff3b30',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  darkInput: {
    borderColor: '#444',
    backgroundColor: '#222',
    color: '#fff',
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
    color: '#333',
  },
  darkTimeText: {
    color: '#fff',
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
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    marginBottom: 8,
  },
  dayButtonSelected: {
    backgroundColor: '#8a56ff',
  },
  dayButtonText: {
    fontSize: 14,
    color: '#333',
  },
  dayButtonTextSelected: {
    color: '#fff',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: '#8a56ff',
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
  },
  resetButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
    opacity: 0.7,
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resetButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButtonHint: {
    color: '#fff',
    fontSize: 10,
    marginTop: 4,
    opacity: 0.8,
    position: 'absolute',
    bottom: 5,
    textAlign: 'center',
    width: '100%',
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
    backgroundColor: '#fff',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 16,
  },
  darkPickerContainer: {
    backgroundColor: '#1e1e1e',
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
    color: '#8a56ff',
  },
  doneButton: {
    fontWeight: 'bold',
  },
  iosPicker: {
    height: 200,
  },
})

export default AddEditShiftScreen
