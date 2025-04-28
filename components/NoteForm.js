import React, { useState, useEffect, useContext, useCallback } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Platform,
  Alert,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import DateTimePicker from '@react-native-community/datetimepicker'
import { AppContext } from '../context/AppContext'
import { STORAGE_KEYS } from '../utils/constants'
import {
  getNotes,
  getShifts,
  saveNote,
  deleteNote,
  checkDuplicateNote,
} from '../utils/database'

const NoteForm = ({ noteId, onSave, onDelete }) => {
  const { t, darkMode } = useContext(AppContext)

  // Form state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [reminderTime, setReminderTime] = useState('')
  const [hasReminder, setHasReminder] = useState(true)
  const [reminderDate, setReminderDate] = useState(new Date())
  const [linkedShifts, setLinkedShifts] = useState([])
  const [reminderDays, setReminderDays] = useState([])
  const [useShiftReminder, setUseShiftReminder] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [shifts, setShifts] = useState([])
  const [errors, setErrors] = useState({})
  const [isFormValid, setIsFormValid] = useState(false)

  // Constants
  const MAX_TITLE_LENGTH = 100
  const MAX_CONTENT_LENGTH = 300
  const DAYS_OF_WEEK = [
    { key: 'T2', label: 'T2' },
    { key: 'T3', label: 'T3' },
    { key: 'T4', label: 'T4' },
    { key: 'T5', label: 'T5' },
    { key: 'T6', label: 'T6' },
    { key: 'T7', label: 'T7' },
    { key: 'CN', label: 'CN' },
  ]

  // Date/time picker state
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)

  // Load note data and shifts
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        // Load shifts
        const allShifts = await getShifts()
        setShifts(allShifts.filter((shift) => shift.isActive))

        // Load note data if editing
        if (noteId) {
          await loadNoteData()
        }
      } catch (error) {
        console.error('Error loading data:', error)
        Alert.alert(t('Lỗi'), t('Không thể tải dữ liệu'))
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [noteId])

  // Validate form when values change
  useEffect(() => {
    validateForm()
  }, [
    title,
    content,
    hasReminder,
    useShiftReminder,
    linkedShifts,
    reminderDays,
  ])

  const loadNoteData = async () => {
    try {
      const notes = await getNotes()
      const note = notes.find((n) => n.id === noteId)

      if (note) {
        setTitle(note.title || '')
        setContent(note.content || '')

        // Set linked shifts
        setLinkedShifts(note.linkedShifts || [])

        // Set reminder days
        setReminderDays(note.reminderDays || [])

        // Determine if using shift-based reminders
        const isUsingShiftReminders =
          note.linkedShifts && note.linkedShifts.length > 0
        setUseShiftReminder(isUsingShiftReminders)

        if (note.reminderTime) {
          setHasReminder(true)
          setReminderTime(note.reminderTime)

          // Parse reminder time to set date object
          const [datePart, timePart] = note.reminderTime.split(' ')
          if (datePart && timePart) {
            const [day, month, year] = datePart.split('/').map(Number)
            const [hours, minutes] = timePart.split(':').map(Number)

            const date = new Date()
            date.setFullYear(year, month - 1, day)
            date.setHours(hours, minutes, 0, 0)
            setReminderDate(date)
          }
        }
      }
    } catch (error) {
      console.error('Error loading note data:', error)
      Alert.alert(t('Lỗi'), t('Không thể tải dữ liệu ghi chú'))
    }
  }

  // Validate form
  const validateForm = async () => {
    const newErrors = {}

    // Validate title
    if (!title.trim()) {
      newErrors.title = t('Tiêu đề không được để trống')
    } else if (title.length > MAX_TITLE_LENGTH) {
      newErrors.title = t(
        `Tiêu đề không được vượt quá ${MAX_TITLE_LENGTH} ký tự`
      )
    }

    // Validate content
    if (!content.trim()) {
      newErrors.content = t('Nội dung không được để trống')
    } else if (content.length > MAX_CONTENT_LENGTH) {
      newErrors.content = t(
        `Nội dung không được vượt quá ${MAX_CONTENT_LENGTH} ký tự`
      )
    }

    // Validate reminder settings
    if (hasReminder) {
      if (!useShiftReminder) {
        // If not using shift-based reminders, validate reminder days
        if (reminderDays.length === 0) {
          newErrors.reminderDays = t('Vui lòng chọn ít nhất một ngày nhắc nhở')
        }
      } else {
        // If using shift-based reminders, validate linked shifts
        if (linkedShifts.length === 0) {
          newErrors.linkedShifts = t('Vui lòng chọn ít nhất một ca làm việc')
        }
      }
    }

    setErrors(newErrors)
    setIsFormValid(Object.keys(newErrors).length === 0)
    return Object.keys(newErrors).length === 0
  }

  // Toggle day selection for reminder days
  const toggleDaySelection = (day) => {
    if (reminderDays.includes(day)) {
      setReminderDays(reminderDays.filter((d) => d !== day))
    } else {
      setReminderDays([...reminderDays, day])
    }
  }

  // Toggle shift selection for linked shifts
  const toggleShiftSelection = (shiftId) => {
    if (linkedShifts.includes(shiftId)) {
      setLinkedShifts(linkedShifts.filter((id) => id !== shiftId))
    } else {
      setLinkedShifts([...linkedShifts, shiftId])
    }
  }

  // Handle save button press
  const handleSave = async () => {
    // Validate form before saving
    const isValid = await validateForm()
    if (!isValid) {
      return
    }

    // Check for duplicate note
    const isDuplicate = await checkDuplicateNote(
      title.trim(),
      content.trim(),
      noteId
    )

    if (isDuplicate) {
      Alert.alert(
        t('Ghi chú trùng lặp'),
        t('Đã tồn tại ghi chú có cùng tiêu đề và nội dung. Bạn vẫn muốn lưu?'),
        [
          {
            text: t('Hủy'),
            style: 'cancel',
          },
          {
            text: t('Lưu'),
            onPress: () => saveNoteData(),
          },
        ]
      )
    } else {
      // Show confirmation dialog
      Alert.alert(
        noteId ? t('Cập nhật ghi chú') : t('Thêm ghi chú mới'),
        noteId
          ? t('Bạn có chắc chắn muốn cập nhật ghi chú này?')
          : t('Bạn có chắc chắn muốn thêm ghi chú mới này?'),
        [
          {
            text: t('Hủy'),
            style: 'cancel',
          },
          {
            text: t('Lưu'),
            onPress: () => saveNoteData(),
          },
        ]
      )
    }
  }

  // Save note data
  const saveNoteData = async () => {
    try {
      // Format reminder time
      const formattedReminderTime = hasReminder
        ? `${reminderDate.getDate().toString().padStart(2, '0')}/${(
            reminderDate.getMonth() + 1
          )
            .toString()
            .padStart(2, '0')}/${reminderDate.getFullYear()} ${reminderDate
            .getHours()
            .toString()
            .padStart(2, '0')}:${reminderDate
            .getMinutes()
            .toString()
            .padStart(2, '0')}`
        : null

      // Prepare note data
      const noteData = {
        id: noteId || Date.now().toString(),
        title: title.trim(),
        content: content.trim(),
        reminderTime: formattedReminderTime,
        linkedShifts: useShiftReminder ? linkedShifts : [],
        reminderDays: !useShiftReminder ? reminderDays : [],
        updatedAt: new Date().toISOString(),
      }

      // If new note, add creation timestamp
      if (!noteId) {
        noteData.createdAt = new Date().toISOString()
      }

      // Save note
      await saveNote(noteData)

      // Call onSave callback
      if (onSave) {
        onSave(noteData.id)
      }
    } catch (error) {
      console.error('Error saving note:', error)
      Alert.alert(t('Lỗi'), t('Không thể lưu ghi chú'))
    }
  }

  // Handle delete button press
  const handleDelete = async () => {
    if (!noteId) return

    Alert.alert(t('Xóa ghi chú'), t('Bạn có chắc chắn muốn xóa ghi chú này?'), [
      {
        text: t('Hủy'),
        style: 'cancel',
      },
      {
        text: t('Xóa'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteNote(noteId)
            if (onDelete) {
              onDelete(noteId, true)
            }
          } catch (error) {
            console.error('Error deleting note:', error)
            Alert.alert(t('Lỗi'), t('Không thể xóa ghi chú'))
          }
        },
      },
    ])
  }

  const handleDateChange = (event, selectedDate) => {
    // Hide picker immediately on Android
    if (Platform.OS === 'android') {
      setShowDatePicker(false)
    }

    // On iOS, only hide picker when user presses Done
    if (Platform.OS === 'ios' && event.type === 'set') {
      setShowDatePicker(false)
    }

    // Only update if user selected a date (not cancelled)
    if (selectedDate && event.type !== 'dismissed') {
      const currentDate = new Date(reminderDate)
      currentDate.setFullYear(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate()
      )
      setReminderDate(currentDate)
    }
  }

  const handleTimeChange = (event, selectedTime) => {
    // Hide picker immediately on Android
    if (Platform.OS === 'android') {
      setShowTimePicker(false)
    }

    // On iOS, only hide picker when user presses Done
    if (Platform.OS === 'ios' && event.type === 'set') {
      setShowTimePicker(false)
    }

    // Only update if user selected a time (not cancelled)
    if (selectedTime && event.type !== 'dismissed') {
      const currentDate = new Date(reminderDate)
      currentDate.setHours(selectedTime.getHours(), selectedTime.getMinutes())
      setReminderDate(currentDate)
    }
  }

  const formatDate = (date) => {
    return `${date.getDate().toString().padStart(2, '0')}/${(
      date.getMonth() + 1
    )
      .toString()
      .padStart(2, '0')}/${date.getFullYear()}`
  }

  const formatTime = (date) => {
    return `${date.getHours().toString().padStart(2, '0')}:${date
      .getMinutes()
      .toString()
      .padStart(2, '0')}`
  }

  // Render loading indicator
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, darkMode && styles.darkContainer]}>
        <ActivityIndicator size="large" color="#8a56ff" />
        <Text style={[styles.loadingText, darkMode && styles.darkText]}>
          {t('Đang tải...')}
        </Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      {/* Title */}
      <View style={styles.formGroup}>
        <Text style={[styles.label, darkMode && styles.darkText]}>
          {t('Tiêu đề')} <Text style={styles.requiredMark}>*</Text>
        </Text>
        <TextInput
          style={[
            styles.input,
            darkMode && styles.darkInput,
            errors.title && styles.inputError,
          ]}
          value={title}
          onChangeText={setTitle}
          placeholder={t('Nhập tiêu đề')}
          placeholderTextColor={darkMode ? '#666' : '#999'}
          maxLength={MAX_TITLE_LENGTH}
        />
        <View style={styles.inputFooter}>
          {errors.title ? (
            <Text style={styles.errorText}>{errors.title}</Text>
          ) : (
            <Text style={[styles.charCounter, darkMode && styles.darkSubText]}>
              {title.length}/{MAX_TITLE_LENGTH}
            </Text>
          )}
        </View>
      </View>

      {/* Content */}
      <View style={styles.formGroup}>
        <Text style={[styles.label, darkMode && styles.darkText]}>
          {t('Nội dung')} <Text style={styles.requiredMark}>*</Text>
        </Text>
        <TextInput
          style={[
            styles.textArea,
            darkMode && styles.darkInput,
            errors.content && styles.inputError,
          ]}
          value={content}
          onChangeText={setContent}
          placeholder={t('Nhập nội dung ghi chú')}
          placeholderTextColor={darkMode ? '#666' : '#999'}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          maxLength={MAX_CONTENT_LENGTH}
        />
        <View style={styles.inputFooter}>
          {errors.content ? (
            <Text style={styles.errorText}>{errors.content}</Text>
          ) : (
            <Text style={[styles.charCounter, darkMode && styles.darkSubText]}>
              {content.length}/{MAX_CONTENT_LENGTH}
            </Text>
          )}
        </View>
      </View>

      {/* Reminder */}
      <View style={styles.formGroup}>
        <View style={styles.switchRow}>
          <Text style={[styles.label, darkMode && styles.darkText]}>
            {t('Đặt nhắc nhở')}
          </Text>
          <Switch
            value={hasReminder}
            onValueChange={setHasReminder}
            trackColor={{ false: '#767577', true: '#8a56ff' }}
            thumbColor={hasReminder ? '#f4f3f4' : '#f4f3f4'}
          />
        </View>

        {hasReminder && (
          <>
            <View style={styles.reminderContainer}>
              {/* Date Picker */}
              <TouchableOpacity
                style={[styles.dateTimeButton, darkMode && styles.darkInput]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text
                  style={[styles.dateTimeText, darkMode && styles.darkText]}
                >
                  {formatDate(reminderDate)}
                </Text>
                <Ionicons
                  name="calendar-outline"
                  size={24}
                  color={darkMode ? '#fff' : '#333'}
                />
              </TouchableOpacity>

              {/* Time Picker */}
              <TouchableOpacity
                style={[styles.dateTimeButton, darkMode && styles.darkInput]}
                onPress={() => setShowTimePicker(true)}
              >
                <Text
                  style={[styles.dateTimeText, darkMode && styles.darkText]}
                >
                  {formatTime(reminderDate)}
                </Text>
                <Ionicons
                  name="time-outline"
                  size={24}
                  color={darkMode ? '#fff' : '#333'}
                />
              </TouchableOpacity>
            </View>

            {/* Reminder Type Selection */}
            <View style={styles.reminderTypeContainer}>
              <View style={styles.switchRow}>
                <Text style={[styles.subLabel, darkMode && styles.darkText]}>
                  {t('Nhắc nhở theo ca làm việc')}
                </Text>
                <Switch
                  value={useShiftReminder}
                  onValueChange={setUseShiftReminder}
                  trackColor={{ false: '#767577', true: '#8a56ff' }}
                  thumbColor={useShiftReminder ? '#f4f3f4' : '#f4f3f4'}
                />
              </View>
            </View>

            {/* Linked Shifts */}
            {useShiftReminder ? (
              <View style={styles.linkedItemsContainer}>
                <Text style={[styles.subLabel, darkMode && styles.darkText]}>
                  {t('Chọn ca làm việc')}{' '}
                  <Text style={styles.requiredMark}>*</Text>
                </Text>
                {shifts.length > 0 ? (
                  <View style={styles.checkboxContainer}>
                    {shifts.map((shift) => (
                      <TouchableOpacity
                        key={shift.id}
                        style={styles.checkboxRow}
                        onPress={() => toggleShiftSelection(shift.id)}
                      >
                        <View
                          style={[
                            styles.checkbox,
                            linkedShifts.includes(shift.id) &&
                              styles.checkboxSelected,
                          ]}
                        >
                          {linkedShifts.includes(shift.id) && (
                            <Ionicons name="checkmark" size={16} color="#fff" />
                          )}
                        </View>
                        <Text
                          style={[
                            styles.checkboxLabel,
                            darkMode && styles.darkText,
                          ]}
                          numberOfLines={1}
                        >
                          {shift.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <Text
                    style={[styles.noDataText, darkMode && styles.darkSubText]}
                  >
                    {t('Không có ca làm việc nào')}
                  </Text>
                )}
                {errors.linkedShifts && (
                  <Text style={styles.errorText}>{errors.linkedShifts}</Text>
                )}
              </View>
            ) : (
              <View style={styles.linkedItemsContainer}>
                <Text style={[styles.subLabel, darkMode && styles.darkText]}>
                  {t('Chọn ngày nhắc')}{' '}
                  <Text style={styles.requiredMark}>*</Text>
                </Text>
                <View style={styles.daysContainer}>
                  {DAYS_OF_WEEK.map((day) => (
                    <TouchableOpacity
                      key={day.key}
                      style={[
                        styles.dayButton,
                        reminderDays.includes(day.key) &&
                          styles.dayButtonSelected,
                      ]}
                      onPress={() => toggleDaySelection(day.key)}
                    >
                      <Text
                        style={[
                          styles.dayButtonText,
                          reminderDays.includes(day.key) &&
                            styles.dayButtonTextSelected,
                        ]}
                      >
                        {day.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {errors.reminderDays && (
                  <Text style={styles.errorText}>{errors.reminderDays}</Text>
                )}
              </View>
            )}

            {/* Date Picker for Android */}
            {Platform.OS === 'android' && showDatePicker && (
              <DateTimePicker
                value={reminderDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
                themeVariant={darkMode ? 'dark' : 'light'}
              />
            )}

            {/* Time Picker for Android */}
            {Platform.OS === 'android' && showTimePicker && (
              <DateTimePicker
                value={reminderDate}
                mode="time"
                is24Hour={true}
                display="default"
                onChange={handleTimeChange}
                themeVariant={darkMode ? 'dark' : 'light'}
              />
            )}

            {/* Date Picker for iOS */}
            {Platform.OS === 'ios' && showDatePicker && (
              <Modal
                transparent={true}
                animationType="slide"
                visible={showDatePicker}
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
                        onPress={() => setShowDatePicker(false)}
                        style={styles.pickerButton}
                      >
                        <Text style={styles.pickerButtonText}>{t('Hủy')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setShowDatePicker(false)}
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
                      value={reminderDate}
                      mode="date"
                      display="spinner"
                      onChange={handleDateChange}
                      style={styles.iosPicker}
                      themeVariant={darkMode ? 'dark' : 'light'}
                    />
                  </View>
                </View>
              </Modal>
            )}

            {/* Time Picker for iOS */}
            {Platform.OS === 'ios' && showTimePicker && (
              <Modal
                transparent={true}
                animationType="slide"
                visible={showTimePicker}
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
                        onPress={() => setShowTimePicker(false)}
                        style={styles.pickerButton}
                      >
                        <Text style={styles.pickerButtonText}>{t('Hủy')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setShowTimePicker(false)}
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
                      value={reminderDate}
                      mode="time"
                      is24Hour={true}
                      display="spinner"
                      onChange={handleTimeChange}
                      style={styles.iosPicker}
                      themeVariant={darkMode ? 'dark' : 'light'}
                    />
                  </View>
                </View>
              </Modal>
            )}
          </>
        )}
      </View>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        {noteId && (
          <TouchableOpacity
            style={[styles.button, styles.deleteButton]}
            onPress={handleDelete}
          >
            <Text style={styles.buttonText}>{t('Xóa')}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            styles.button,
            styles.saveButton,
            !isFormValid && styles.disabledButton,
          ]}
          onPress={handleSave}
          disabled={!isFormValid}
        >
          <Text style={styles.buttonText}>{t('Lưu')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxHeight: '70%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
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
  subLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  darkText: {
    color: '#fff',
  },
  darkSubText: {
    color: '#aaa',
  },
  requiredMark: {
    color: '#ff5252',
    fontWeight: 'bold',
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
  inputError: {
    borderColor: '#ff5252',
  },
  errorText: {
    color: '#ff5252',
    fontSize: 14,
    marginTop: 4,
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  charCounter: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },
  textArea: {
    height: 120,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reminderContainer: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reminderTypeContainer: {
    marginTop: 16,
    marginBottom: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  linkedItemsContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  checkboxContainer: {
    marginTop: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  checkboxSelected: {
    backgroundColor: '#8a56ff',
    borderColor: '#8a56ff',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333',
  },
  noDataText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 8,
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
  dateTimeButton: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateTimeText: {
    fontSize: 16,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    marginBottom: 16,
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
  disabledButton: {
    backgroundColor: '#cccccc',
    opacity: 0.7,
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

export default NoteForm
