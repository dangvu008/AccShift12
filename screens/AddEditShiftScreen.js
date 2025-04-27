'use client'

import { useState, useEffect, useContext } from 'react'
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
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import DateTimePicker from '@react-native-community/datetimepicker'
import { AppContext } from '../context/AppContext'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { STORAGE_KEYS } from '../config/appConfig'

const AddEditShiftScreen = ({ route, navigation }) => {
  const { t, darkMode } = useContext(AppContext)
  const { shiftId } = route.params || {}
  const isEditing = !!shiftId

  // Form state
  const [shiftName, setShiftName] = useState('')
  const [startTime, setStartTime] = useState(new Date())
  const [endTime, setEndTime] = useState(
    new Date(new Date().setHours(startTime.getHours() + 8))
  )
  const [breakTime, setBreakTime] = useState('60')
  const [isActive, setIsActive] = useState(true)
  const [isDefault, setIsDefault] = useState(false)
  const [daysApplied, setDaysApplied] = useState(['T2', 'T3', 'T4', 'T5', 'T6'])

  // Time picker state
  const [showStartTimePicker, setShowStartTimePicker] = useState(false)
  const [showEndTimePicker, setShowEndTimePicker] = useState(false)
  const [pickerMode, setPickerMode] = useState(null) // 'start' hoặc 'end'

  // Validation state
  const [errors, setErrors] = useState({})

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

  useEffect(() => {
    const loadShiftData = async () => {
    try {
      const shiftsData = await AsyncStorage.getItem(STORAGE_KEYS.SHIFT_LIST)
      if (shiftsData) {
        const shifts = JSON.parse(shiftsData)
        const shift = shifts.find((s) => s.id === shiftId)

        if (shift) {
          setShiftName(shift.name || '')

          // Convert string time to Date objects
          const [startHour, startMinute] = shift.startTime
            .split(':')
            .map(Number)
          const [endHour, endMinute] = shift.endTime.split(':').map(Number)

          const newStartTime = new Date()
          newStartTime.setHours(startHour, startMinute, 0, 0)
          setStartTime(newStartTime)

          const newEndTime = new Date()
          newEndTime.setHours(endHour, endMinute, 0, 0)
          setEndTime(newEndTime)

          setBreakTime(shift.breakTime.toString())
          setIsActive(shift.isActive !== false) // Default to true if undefined
          setIsDefault(shift.isDefault === true) // Default to false if undefined
          setDaysApplied(shift.daysApplied || ['T2', 'T3', 'T4', 'T5', 'T6'])
        }
      }
    } catch (error) {
      console.error('Error loading shift data:', error)
      Alert.alert(t('Error'), t('Failed to load shift data'))
    }
  }

  const handleStartTimeChange = (event, selectedTime) => {
    // Ẩn picker ngay lập tức trên Android
    if (Platform.OS === 'android') {
      setShowStartTimePicker(false)
    }

    // Trên iOS, chỉ ẩn picker khi người dùng nhấn Done
    if (Platform.OS === 'ios' && event.type === 'set') {
      setShowStartTimePicker(false)
    }

    // Chỉ cập nhật thời gian nếu người dùng đã chọn (không phải hủy)
    if (selectedTime && event.type !== 'dismissed') {
      setStartTime(selectedTime)

      // If end time is before start time and not an overnight shift,
      // adjust end time to be after start time
      const endHour = endTime.getHours()
      const startHour = selectedTime.getHours()

      if (endHour < startHour && endHour > 0 && startHour < 20) {
        const newEndTime = new Date(selectedTime)
        newEndTime.setHours(selectedTime.getHours() + 8)
        setEndTime(newEndTime)
      }
    }
  }

  const handleEndTimeChange = (event, selectedTime) => {
    // Ẩn picker ngay lập tức trên Android
    if (Platform.OS === 'android') {
      setShowEndTimePicker(false)
    }

    // Trên iOS, chỉ ẩn picker khi người dùng nhấn Done
    if (Platform.OS === 'ios' && event.type === 'set') {
      setShowEndTimePicker(false)
    }

    // Chỉ cập nhật thời gian nếu người dùng đã chọn (không phải hủy)
    if (selectedTime && event.type !== 'dismissed') {
      setEndTime(selectedTime)
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

  const validateForm = () => {
    const newErrors = {}

    if (!shiftName.trim()) {
      newErrors.shiftName = t('Shift name is required')
    }

    const breakTimeNum = parseInt(breakTime, 10)
    if (isNaN(breakTimeNum) || breakTimeNum < 0) {
      newErrors.breakTime = t('Break time must be a positive number')
    }

    if (daysApplied.length === 0) {
      newErrors.daysApplied = t('Select at least one day')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSaveShift = async () => {
    if (!validateForm()) {
      return
    }

    try {
      // Format times as strings (HH:MM)
      const formattedStartTime = formatTimeForDisplay(startTime)
      const formattedEndTime = formatTimeForDisplay(endTime)

      // Get existing shifts
      const shiftsData = await AsyncStorage.getItem(STORAGE_KEYS.SHIFT_LIST)
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
        startTime: formattedStartTime,
        endTime: formattedEndTime,
        breakTime: parseInt(breakTime, 10),
        isActive,
        isDefault,
        daysApplied,
      }

      if (isEditing) {
        // Update existing shift
        shifts = shifts.map((shift) =>
          shift.id === shiftId ? newShift : shift
        )
      } else {
        // Add new shift
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
      Alert.alert(t('Error'), t('Failed to save shift'))
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, darkMode && styles.darkContainer]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.formContainer}>
          {/* Shift Name */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, darkMode && styles.darkLabel]}>
              {t('Tên ca làm việc')}
            </Text>
            <TextInput
              style={[
                styles.input,
                darkMode && styles.darkInput,
                errors.shiftName && styles.inputError,
              ]}
              value={shiftName}
              onChangeText={setShiftName}
              placeholder={t('Nhập tên ca làm việc')}
              placeholderTextColor={darkMode ? '#666' : '#999'}
            />
            {errors.shiftName && (
              <Text style={styles.errorText}>{errors.shiftName}</Text>
            )}
          </View>

          {/* Start Time */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, darkMode && styles.darkLabel]}>
              {t('Giờ bắt đầu')}
            </Text>
            <TouchableOpacity
              style={[
                styles.input,
                styles.timeInput,
                darkMode && styles.darkInput,
              ]}
              onPress={() => {
                setPickerMode('start')
                setShowStartTimePicker(true)
              }}
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
            {Platform.OS === 'ios' && showStartTimePicker && (
              <Modal
                transparent={true}
                animationType="slide"
                visible={showStartTimePicker}
              >
                <View style={styles.modalContainer}>
                  <View
                    style={[
                      styles.pickerContainer,
                      darkMode && styles.darkPickerContainer,
                    ]}
                  >
                    <View style={styles.pickerHeader}>
                      <TouchableOpacity
                        onPress={() => setShowStartTimePicker(false)}
                        style={styles.pickerButton}
                      >
                        <Text style={styles.pickerButtonText}>{t('Hủy')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setShowStartTimePicker(false)}
                        style={styles.pickerButton}
                      >
                        <Text
                          style={[styles.pickerButtonText, styles.doneButton]}
                        >
                          {t('Xong')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={startTime}
                      mode="time"
                      is24Hour={true}
                      display="spinner"
                      onChange={handleStartTimeChange}
                      style={styles.iosPicker}
                      themeVariant={darkMode ? 'dark' : 'light'}
                    />
                  </View>
                </View>
              </Modal>
            )}
          </View>

          {/* End Time */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, darkMode && styles.darkLabel]}>
              {t('Giờ kết thúc')}
            </Text>
            <TouchableOpacity
              style={[
                styles.input,
                styles.timeInput,
                darkMode && styles.darkInput,
              ]}
              onPress={() => {
                setPickerMode('end')
                setShowEndTimePicker(true)
              }}
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
            {Platform.OS === 'ios' && showEndTimePicker && (
              <Modal
                transparent={true}
                animationType="slide"
                visible={showEndTimePicker}
              >
                <View style={styles.modalContainer}>
                  <View
                    style={[
                      styles.pickerContainer,
                      darkMode && styles.darkPickerContainer,
                    ]}
                  >
                    <View style={styles.pickerHeader}>
                      <TouchableOpacity
                        onPress={() => setShowEndTimePicker(false)}
                        style={styles.pickerButton}
                      >
                        <Text style={styles.pickerButtonText}>{t('Hủy')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setShowEndTimePicker(false)}
                        style={styles.pickerButton}
                      >
                        <Text
                          style={[styles.pickerButtonText, styles.doneButton]}
                        >
                          {t('Xong')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={endTime}
                      mode="time"
                      is24Hour={true}
                      display="spinner"
                      onChange={handleEndTimeChange}
                      style={styles.iosPicker}
                      themeVariant={darkMode ? 'dark' : 'light'}
                    />
                  </View>
                </View>
              </Modal>
            )}
          </View>

          {/* Overnight Shift Indicator */}
          {endTime.getHours() < startTime.getHours() && (
            <View style={styles.overnightWarning}>
              <Ionicons name="information-circle" size={20} color="#ff9800" />
              <Text style={styles.overnightText}>
                {t('Ca qua đêm - kết thúc vào ngày hôm sau')}
              </Text>
            </View>
          )}

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
              onChangeText={setBreakTime}
              keyboardType="numeric"
              placeholder={t('Nhập thời gian nghỉ')}
              placeholderTextColor={darkMode ? '#666' : '#999'}
            />
            {errors.breakTime && (
              <Text style={styles.errorText}>{errors.breakTime}</Text>
            )}
          </View>

          {/* Days Applied */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, darkMode && styles.darkLabel]}>
              {t('Áp dụng cho các ngày')}
            </Text>
            <View style={styles.daysContainer}>
              {daysOfWeek.map((day) => (
                <TouchableOpacity
                  key={day.key}
                  style={[
                    styles.dayButton,
                    daysApplied.includes(day.key) && styles.dayButtonSelected,
                  ]}
                  onPress={() => toggleDaySelection(day.key)}
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

          {/* Active Switch */}
          <View style={styles.switchContainer}>
            <Text style={[styles.switchLabel, darkMode && styles.darkLabel]}>
              {t('Kích hoạt')}
            </Text>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
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
              onValueChange={setIsDefault}
              trackColor={{ false: '#767577', true: '#8a56ff' }}
              thumbColor={isDefault ? '#f4f3f4' : '#f4f3f4'}
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveShift}>
            <Text style={styles.saveButtonText}>
              {isEditing ? t('Cập nhật') : t('Thêm mới')}
            </Text>
          </TouchableOpacity>
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
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#8a56ff',
    borderRadius: 8,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  overnightWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  overnightText: {
    color: '#e65100',
    marginLeft: 8,
    fontSize: 14,
  },
})

export default AddEditShiftScreen
