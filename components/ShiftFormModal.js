import React, { useState, useEffect, useContext, useCallback } from 'react'
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Switch,
  Platform,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import DateTimePicker from '@react-native-community/datetimepicker'
import { AppContext } from '../context/AppContext'
import { STORAGE_KEYS } from '../utils/constants'

const ShiftFormModal = ({ visible, shiftId, onClose, onSaved }) => {
  const { t, darkMode } = useContext(AppContext)

  // Form state
  const [shiftName, setShiftName] = useState('')
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('17:00')
  const [breakTime, setBreakTime] = useState('60')
  const [isActive, setIsActive] = useState(true)
  const [isDefault, setIsDefault] = useState(false)
  const [daysApplied, setDaysApplied] = useState([
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
  ])

  // Time picker state
  const [showStartTimePicker, setShowStartTimePicker] = useState(false)
  const [showEndTimePicker, setShowEndTimePicker] = useState(false)
  const [startTimeDate, setStartTimeDate] = useState(new Date())
  const [endTimeDate, setEndTimeDate] = useState(new Date())

  // Load shift data if editing
  useEffect(() => {
    if (visible && shiftId) {
      loadShiftData()
    } else if (visible) {
      // Reset form for new shift
      setShiftName('')
      setStartTime('08:00')
      setEndTime('17:00')
      setBreakTime('60')
      setIsActive(true)
      setIsDefault(false)
      setDaysApplied(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])

      // Set date objects for pickers
      const startDate = new Date()
      startDate.setHours(8, 0, 0)
      setStartTimeDate(startDate)

      const endDate = new Date()
      endDate.setHours(17, 0, 0)
      setEndTimeDate(endDate)
    }
  }, [visible, shiftId, loadShiftData])

  const loadShiftData = useCallback(async () => {
    try {
      const shiftsData = await AsyncStorage.getItem(STORAGE_KEYS.SHIFT_LIST)
      if (shiftsData) {
        const shifts = JSON.parse(shiftsData)
        const shift = shifts.find((s) => s.id === shiftId)

        if (shift) {
          setShiftName(shift.name || '')
          setStartTime(shift.startTime || '08:00')
          setEndTime(shift.endTime || '17:00')
          setBreakTime(shift.breakTime?.toString() || '60')
          setIsActive(shift.isActive !== false)
          setIsDefault(shift.isDefault === true)
          setDaysApplied(
            shift.daysApplied || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
          )

          // Set date objects for pickers
          const [startHours, startMinutes] = (shift.startTime || '08:00')
            .split(':')
            .map(Number)
          const startDate = new Date()
          startDate.setHours(startHours, startMinutes, 0)
          setStartTimeDate(startDate)

          const [endHours, endMinutes] = (shift.endTime || '17:00')
            .split(':')
            .map(Number)
          const endDate = new Date()
          endDate.setHours(endHours, endMinutes, 0)
          setEndTimeDate(endDate)
        }
      }
    } catch (error) {
      console.error('Error loading shift data:', error)
    }
  }, [shiftId])

  const handleSave = async () => {
    if (!shiftName.trim()) {
      Alert.alert(t('Error'), t('Shift name is required'))
      return
    }

    try {
      const shiftsData = await AsyncStorage.getItem(STORAGE_KEYS.SHIFT_LIST)
      let shifts = shiftsData ? JSON.parse(shiftsData) : []

      // If isDefault is true, set all other shifts to not default
      if (isDefault) {
        shifts = shifts.map((shift) => ({
          ...shift,
          isDefault: false,
        }))
      }

      if (shiftId) {
        // Update existing shift
        shifts = shifts.map((shift) =>
          shift.id === shiftId
            ? {
                ...shift,
                name: shiftName.trim(),
                startTime,
                endTime,
                breakTime: parseInt(breakTime, 10) || 0,
                isActive,
                isDefault,
                daysApplied,
              }
            : shift
        )
      } else {
        // Add new shift
        const newShift = {
          id: Date.now().toString(),
          name: shiftName.trim(),
          startTime,
          endTime,
          breakTime: parseInt(breakTime, 10) || 0,
          isActive,
          isDefault,
          daysApplied,
        }
        shifts.push(newShift)
      }

      await AsyncStorage.setItem(
        STORAGE_KEYS.SHIFT_LIST,
        JSON.stringify(shifts)
      )

      if (onSaved) {
        onSaved(shiftId || shifts[shifts.length - 1].id)
      }

      onClose()
    } catch (error) {
      console.error('Error saving shift:', error)
      Alert.alert(t('Error'), t('Failed to save shift'))
    }
  }

  const handleDelete = async () => {
    if (!shiftId) return

    Alert.alert(
      t('Delete Shift'),
      t('Are you sure you want to delete this shift?'),
      [
        {
          text: t('Cancel'),
          style: 'cancel',
        },
        {
          text: t('Delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const shiftsData = await AsyncStorage.getItem(
                STORAGE_KEYS.SHIFT_LIST
              )
              if (shiftsData) {
                const shifts = JSON.parse(shiftsData)
                const updatedShifts = shifts.filter(
                  (shift) => shift.id !== shiftId
                )
                await AsyncStorage.setItem(
                  STORAGE_KEYS.SHIFT_LIST,
                  JSON.stringify(updatedShifts)
                )

                if (onSaved) {
                  onSaved(shiftId, true)
                }

                onClose()
              }
            } catch (error) {
              console.error('Error deleting shift:', error)
              Alert.alert(t('Error'), t('Failed to delete shift'))
            }
          },
        },
      ]
    )
  }

  const handleStartTimeChange = (event, selectedDate) => {
    // Trên Android, event.type không tồn tại và selectedDate sẽ là null nếu người dùng hủy
    if (Platform.OS === 'android') {
      setShowStartTimePicker(false)

      // Chỉ cập nhật nếu selectedDate không phải là null (người dùng không hủy)
      if (selectedDate) {
        setStartTimeDate(selectedDate)
        const hours = selectedDate.getHours().toString().padStart(2, '0')
        const minutes = selectedDate.getMinutes().toString().padStart(2, '0')
        setStartTime(`${hours}:${minutes}`)
      }
    }
    // Trên iOS, chỉ ẩn picker khi người dùng nhấn Done và cập nhật giá trị
    else if (Platform.OS === 'ios') {
      if (event.type === 'set') {
        setShowStartTimePicker(false)
        setStartTimeDate(selectedDate)
        const hours = selectedDate.getHours().toString().padStart(2, '0')
        const minutes = selectedDate.getMinutes().toString().padStart(2, '0')
        setStartTime(`${hours}:${minutes}`)
      } else if (event.type === 'dismissed') {
        setShowStartTimePicker(false)
      }
    }
    // Xử lý cho web hoặc các nền tảng khác
    else {
      setShowStartTimePicker(false)
      if (selectedDate) {
        setStartTimeDate(selectedDate)
        const hours = selectedDate.getHours().toString().padStart(2, '0')
        const minutes = selectedDate.getMinutes().toString().padStart(2, '0')
        setStartTime(`${hours}:${minutes}`)
      }
    }
  }

  const handleEndTimeChange = (event, selectedDate) => {
    // Trên Android, event.type không tồn tại và selectedDate sẽ là null nếu người dùng hủy
    if (Platform.OS === 'android') {
      setShowEndTimePicker(false)

      // Chỉ cập nhật nếu selectedDate không phải là null (người dùng không hủy)
      if (selectedDate) {
        setEndTimeDate(selectedDate)
        const hours = selectedDate.getHours().toString().padStart(2, '0')
        const minutes = selectedDate.getMinutes().toString().padStart(2, '0')
        setEndTime(`${hours}:${minutes}`)
      }
    }
    // Trên iOS, chỉ ẩn picker khi người dùng nhấn Done và cập nhật giá trị
    else if (Platform.OS === 'ios') {
      if (event.type === 'set') {
        setShowEndTimePicker(false)
        setEndTimeDate(selectedDate)
        const hours = selectedDate.getHours().toString().padStart(2, '0')
        const minutes = selectedDate.getMinutes().toString().padStart(2, '0')
        setEndTime(`${hours}:${minutes}`)
      } else if (event.type === 'dismissed') {
        setShowEndTimePicker(false)
      }
    }
    // Xử lý cho web hoặc các nền tảng khác
    else {
      setShowEndTimePicker(false)
      if (selectedDate) {
        setEndTimeDate(selectedDate)
        const hours = selectedDate.getHours().toString().padStart(2, '0')
        const minutes = selectedDate.getMinutes().toString().padStart(2, '0')
        setEndTime(`${hours}:${minutes}`)
      }
    }
  }

  const toggleDaySelection = (day) => {
    if (daysApplied.includes(day)) {
      setDaysApplied(daysApplied.filter((d) => d !== day))
    } else {
      setDaysApplied([...daysApplied, day])
    }
  }

  const daysOfWeek = [
    { key: 'Mon', label: t('T2') },
    { key: 'Tue', label: t('T3') },
    { key: 'Wed', label: t('T4') },
    { key: 'Thu', label: t('T5') },
    { key: 'Fri', label: t('T6') },
    { key: 'Sat', label: t('T7') },
    { key: 'Sun', label: t('CN') },
  ]

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[styles.modalContainer, darkMode && styles.darkModalContainer]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.title, darkMode && styles.darkText]}>
              {shiftId ? t('Chỉnh sửa ca làm việc') : t('Thêm ca làm việc')}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons
                name="close"
                size={24}
                color={darkMode ? '#fff' : '#000'}
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContent}>
            {/* Shift Name */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, darkMode && styles.darkText]}>
                {t('Tên ca làm việc')}
              </Text>
              <TextInput
                style={[styles.input, darkMode && styles.darkInput]}
                value={shiftName}
                onChangeText={setShiftName}
                placeholder={t('Nhập tên ca làm việc')}
                placeholderTextColor={darkMode ? '#666' : '#999'}
              />
            </View>

            {/* Start Time */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, darkMode && styles.darkText]}>
                {t('Giờ bắt đầu')}
              </Text>
              <TouchableOpacity
                style={[
                  styles.input,
                  styles.timeInput,
                  darkMode && styles.darkInput,
                ]}
                onPress={() => setShowStartTimePicker(true)}
              >
                <Text style={[styles.timeText, darkMode && styles.darkText]}>
                  {startTime}
                </Text>
                <Ionicons
                  name="time-outline"
                  size={24}
                  color={darkMode ? '#fff' : '#333'}
                />
              </TouchableOpacity>

              {/* Time Picker for Android */}
              {Platform.OS === 'android' && showStartTimePicker && (
                <DateTimePicker
                  value={startTimeDate}
                  mode="time"
                  is24Hour={true}
                  display="default"
                  onChange={handleStartTimeChange}
                  themeVariant={darkMode ? 'dark' : 'light'}
                />
              )}

              {/* Time Picker for iOS */}
              {Platform.OS === 'ios' && showStartTimePicker && (
                <Modal
                  transparent={true}
                  animationType="slide"
                  visible={showStartTimePicker}
                >
                  <View style={styles.pickerModalContainer}>
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
                          <Text style={styles.pickerButtonText}>
                            {t('Hủy')}
                          </Text>
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
                        value={startTimeDate}
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
              <Text style={[styles.label, darkMode && styles.darkText]}>
                {t('Giờ kết thúc')}
              </Text>
              <TouchableOpacity
                style={[
                  styles.input,
                  styles.timeInput,
                  darkMode && styles.darkInput,
                ]}
                onPress={() => setShowEndTimePicker(true)}
              >
                <Text style={[styles.timeText, darkMode && styles.darkText]}>
                  {endTime}
                </Text>
                <Ionicons
                  name="time-outline"
                  size={24}
                  color={darkMode ? '#fff' : '#333'}
                />
              </TouchableOpacity>

              {/* Time Picker for Android */}
              {Platform.OS === 'android' && showEndTimePicker && (
                <DateTimePicker
                  value={endTimeDate}
                  mode="time"
                  is24Hour={true}
                  display="default"
                  onChange={handleEndTimeChange}
                  themeVariant={darkMode ? 'dark' : 'light'}
                />
              )}

              {/* Time Picker for iOS */}
              {Platform.OS === 'ios' && showEndTimePicker && (
                <Modal
                  transparent={true}
                  animationType="slide"
                  visible={showEndTimePicker}
                >
                  <View style={styles.pickerModalContainer}>
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
                          <Text style={styles.pickerButtonText}>
                            {t('Hủy')}
                          </Text>
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
                        value={endTimeDate}
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

            {/* Break Time */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, darkMode && styles.darkText]}>
                {t('Thời gian nghỉ (phút)')}
              </Text>
              <TextInput
                style={[styles.input, darkMode && styles.darkInput]}
                value={breakTime}
                onChangeText={setBreakTime}
                placeholder="60"
                placeholderTextColor={darkMode ? '#666' : '#999'}
                keyboardType="number-pad"
              />
            </View>

            {/* Days Applied */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, darkMode && styles.darkText]}>
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
            </View>

            {/* Active Status */}
            <View style={styles.formGroup}>
              <View style={styles.switchRow}>
                <Text style={[styles.label, darkMode && styles.darkText]}>
                  {t('Kích hoạt')}
                </Text>
                <Switch
                  value={isActive}
                  onValueChange={setIsActive}
                  trackColor={{ false: '#767577', true: '#8a56ff' }}
                  thumbColor={isActive ? '#f4f3f4' : '#f4f3f4'}
                />
              </View>
            </View>

            {/* Default Status */}
            <View style={styles.formGroup}>
              <View style={styles.switchRow}>
                <Text style={[styles.label, darkMode && styles.darkText]}>
                  {t('Đặt làm mặc định')}
                </Text>
                <Switch
                  value={isDefault}
                  onValueChange={setIsDefault}
                  trackColor={{ false: '#767577', true: '#8a56ff' }}
                  thumbColor={isDefault ? '#f4f3f4' : '#f4f3f4'}
                />
              </View>
            </View>
          </ScrollView>

          <View style={styles.buttonContainer}>
            {shiftId && (
              <TouchableOpacity
                style={[styles.button, styles.deleteButton]}
                onPress={handleDelete}
              >
                <Text style={styles.buttonText}>{t('Xóa')}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
            >
              <Text style={styles.buttonText}>{t('Lưu')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  darkModalContainer: {
    backgroundColor: '#1e1e1e',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  darkText: {
    color: '#fff',
  },
  formContent: {
    marginBottom: 16,
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
    backgroundColor: '#2a2a2a',
    color: '#fff',
  },
  timeInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 16,
    color: '#333',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  dayButton: {
    paddingVertical: 6,
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
    color: '#333',
    fontWeight: '500',
  },
  dayButtonTextSelected: {
    color: '#fff',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 10,
  },
  saveButton: {
    backgroundColor: '#8a56ff',
  },
  deleteButton: {
    backgroundColor: '#ff5252',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  pickerModalContainer: {
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

export default ShiftFormModal
