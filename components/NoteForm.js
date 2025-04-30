import React, { useState, useEffect, useContext, useCallback } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import DateTimePicker from '@react-native-community/datetimepicker'
import { AppContext } from '../context/AppContext'
import { COLORS } from '../utils/theme'
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
  const [reminderDate, setReminderDate] = useState(new Date())
  const [linkedShifts, setLinkedShifts] = useState([])
  const [reminderType, setReminderType] = useState('specific') // 'specific' hoặc 'shift'
  const [isLoading, setIsLoading] = useState(true)
  const [shifts, setShifts] = useState([])
  const [errors, setErrors] = useState({})
  const [isFormValid, setIsFormValid] = useState(false)

  // Constants
  const MAX_TITLE_LENGTH = 100
  const MAX_CONTENT_LENGTH = 300

  // Date/time picker state
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)

  // Define loadNoteData with useCallback
  const loadNoteData = useCallback(async () => {
    try {
      const notes = await getNotes()
      const note = notes.find((n) => n.id === noteId)

      if (note) {
        setTitle(note.title || '')
        setContent(note.content || '')

        // Set linked shifts
        setLinkedShifts(note.linkedShifts || [])

        // Determine if using shift-based reminders
        const isUsingShiftReminders =
          note.linkedShifts && note.linkedShifts.length > 0
        setReminderType(isUsingShiftReminders ? 'shift' : 'specific')

        if (note.reminderTime) {
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
  }, [noteId, t])

  // Validate form
  const validateForm = useCallback(async () => {
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
    if (reminderType === 'specific') {
      // Kiểm tra thời gian nhắc nhở phải trong tương lai
      const now = new Date()
      if (reminderDate <= now) {
        newErrors.reminderDate = t(
          'Thời gian nhắc nhở phải là thời điểm trong tương lai'
        )
      }
    } else if (reminderType === 'shift') {
      // Kiểm tra phải chọn ít nhất một ca làm việc
      if (linkedShifts.length === 0) {
        newErrors.linkedShifts = t('Vui lòng chọn ít nhất một ca làm việc')
      }
    }

    setErrors(newErrors)
    setIsFormValid(Object.keys(newErrors).length === 0)
    return Object.keys(newErrors).length === 0
  }, [
    title,
    content,
    reminderType,
    reminderDate,
    linkedShifts,
    t,
    MAX_TITLE_LENGTH,
    MAX_CONTENT_LENGTH,
  ])

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
  }, [noteId, loadNoteData, t])

  // Validate form when values change
  useEffect(() => {
    validateForm()
  }, [title, content, reminderType, reminderDate, linkedShifts, validateForm])

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
      const formattedReminderTime = `${reminderDate
        .getDate()
        .toString()
        .padStart(2, '0')}/${(reminderDate.getMonth() + 1)
        .toString()
        .padStart(2, '0')}/${reminderDate.getFullYear()} ${reminderDate
        .getHours()
        .toString()
        .padStart(2, '0')}:${reminderDate
        .getMinutes()
        .toString()
        .padStart(2, '0')}`

      // Prepare note data
      const noteData = {
        id: noteId || Date.now().toString(),
        title: title.trim(),
        content: content.trim(),
        reminderTime: formattedReminderTime,
        linkedShifts: reminderType === 'shift' ? linkedShifts : [],
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
    // Trên Android, event.type không tồn tại và selectedDate sẽ là null nếu người dùng hủy
    if (Platform.OS === 'android') {
      setShowDatePicker(false)

      // Chỉ cập nhật nếu selectedDate không phải là null (người dùng không hủy)
      if (selectedDate) {
        const currentDate = new Date(reminderDate)
        currentDate.setFullYear(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate()
        )
        setReminderDate(currentDate)
      }
    }
    // Trên iOS, chỉ ẩn picker khi người dùng nhấn Done và cập nhật giá trị
    else if (Platform.OS === 'ios') {
      if (event.type === 'set') {
        setShowDatePicker(false)
        const currentDate = new Date(reminderDate)
        currentDate.setFullYear(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate()
        )
        setReminderDate(currentDate)
      } else if (event.type === 'dismissed') {
        setShowDatePicker(false)
      }
    }
    // Xử lý cho web hoặc các nền tảng khác
    else {
      setShowDatePicker(false)
      if (selectedDate) {
        const currentDate = new Date(reminderDate)
        currentDate.setFullYear(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate()
        )
        setReminderDate(currentDate)
      }
    }
  }

  const handleTimeChange = (event, selectedTime) => {
    // Trên Android, event.type không tồn tại và selectedTime sẽ là null nếu người dùng hủy
    if (Platform.OS === 'android') {
      setShowTimePicker(false)

      // Chỉ cập nhật nếu selectedTime không phải là null (người dùng không hủy)
      if (selectedTime) {
        const currentDate = new Date(reminderDate)
        currentDate.setHours(selectedTime.getHours(), selectedTime.getMinutes())
        setReminderDate(currentDate)
      }
    }
    // Trên iOS, chỉ ẩn picker khi người dùng nhấn Done và cập nhật giá trị
    else if (Platform.OS === 'ios') {
      if (event.type === 'set') {
        setShowTimePicker(false)
        const currentDate = new Date(reminderDate)
        currentDate.setHours(selectedTime.getHours(), selectedTime.getMinutes())
        setReminderDate(currentDate)
      } else if (event.type === 'dismissed') {
        setShowTimePicker(false)
      }
    }
    // Xử lý cho web hoặc các nền tảng khác
    else {
      setShowTimePicker(false)
      if (selectedTime) {
        const currentDate = new Date(reminderDate)
        currentDate.setHours(selectedTime.getHours(), selectedTime.getMinutes())
        setReminderDate(currentDate)
      }
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
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
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

      {/* Reminder Type Selection */}
      <View style={styles.formGroup}>
        <Text style={[styles.label, darkMode && styles.darkText]}>
          {t('Cài đặt nhắc nhở')} <Text style={styles.requiredMark}>*</Text>
        </Text>

        <View style={styles.reminderTypeSelector}>
          <TouchableOpacity
            style={[
              styles.reminderTypeOption,
              reminderType === 'specific' && styles.reminderTypeSelected,
              darkMode && styles.darkReminderTypeOption,
            ]}
            onPress={() => setReminderType('specific')}
          >
            <View style={styles.radioButton}>
              {reminderType === 'specific' && (
                <View style={styles.radioButtonInner} />
              )}
            </View>
            <Text
              style={[styles.reminderTypeText, darkMode && styles.darkText]}
            >
              {t('Đặt lịch cụ thể')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.reminderTypeOption,
              reminderType === 'shift' && styles.reminderTypeSelected,
              darkMode && styles.darkReminderTypeOption,
            ]}
            onPress={() => setReminderType('shift')}
          >
            <View style={styles.radioButton}>
              {reminderType === 'shift' && (
                <View style={styles.radioButtonInner} />
              )}
            </View>
            <Text
              style={[styles.reminderTypeText, darkMode && styles.darkText]}
            >
              {t('Nhắc theo ca')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Specific Date/Time Reminder */}
        {reminderType === 'specific' && (
          <View style={styles.reminderContainer}>
            <Text style={[styles.subLabel, darkMode && styles.darkText]}>
              {t('Chọn thời gian nhắc nhở')}
            </Text>

            <View style={styles.dateTimeContainer}>
              {/* Date Picker */}
              <TouchableOpacity
                style={[
                  styles.dateTimeButton,
                  darkMode && styles.darkDateTimeButton,
                  errors.reminderDate && styles.inputError,
                ]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text
                  style={[
                    styles.dateTimeText,
                    darkMode && styles.darkDateTimeText,
                  ]}
                >
                  {formatDate(reminderDate)}
                </Text>
                <Ionicons
                  name="calendar-outline"
                  size={24}
                  color={darkMode ? COLORS.TEXT_DARK : COLORS.TEXT_LIGHT}
                />
              </TouchableOpacity>

              {/* Time Picker */}
              <TouchableOpacity
                style={[
                  styles.dateTimeButton,
                  darkMode && styles.darkDateTimeButton,
                  errors.reminderDate && styles.inputError,
                ]}
                onPress={() => setShowTimePicker(true)}
              >
                <Text
                  style={[
                    styles.dateTimeText,
                    darkMode && styles.darkDateTimeText,
                  ]}
                >
                  {formatTime(reminderDate)}
                </Text>
                <Ionicons
                  name="time-outline"
                  size={24}
                  color={darkMode ? COLORS.TEXT_DARK : COLORS.TEXT_LIGHT}
                />
              </TouchableOpacity>
            </View>

            {errors.reminderDate && (
              <Text style={styles.errorText}>{errors.reminderDate}</Text>
            )}
          </View>
        )}

        {/* Shift-based Reminder */}
        {reminderType === 'shift' && (
          <View
            style={[
              styles.linkedItemsContainer,
              darkMode && styles.darkLinkedItemsContainer,
            ]}
          >
            <Text style={[styles.subLabel, darkMode && styles.darkText]}>
              {t('Chọn ca làm việc')} <Text style={styles.requiredMark}>*</Text>
            </Text>

            <Text
              style={[
                styles.reminderDescription,
                darkMode && styles.darkSubText,
              ]}
            >
              {t(
                'Nhắc nhở sẽ được đặt trước 5 phút giờ xuất phát (departureTime) của (các) ca đã chọn.'
              )}
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
                        darkMode && styles.darkCheckbox,
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
                        darkMode && styles.darkCheckboxLabel,
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
                style={[styles.noDataText, darkMode && styles.darkNoDataText]}
              >
                {t('Không có ca làm việc nào')}
              </Text>
            )}
            {errors.linkedShifts && (
              <Text style={styles.errorText}>{errors.linkedShifts}</Text>
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
            minimumDate={new Date()}
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
                    <Text style={[styles.pickerButtonText, styles.doneButton]}>
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
                  minimumDate={new Date()}
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
                    <Text style={[styles.pickerButtonText, styles.doneButton]}>
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
      </View>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.iconButton,
            styles.resetButton,
            darkMode && styles.darkResetButton,
          ]}
          onPress={() => {
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
                    if (noteId) {
                      // Nếu đang sửa, tải lại dữ liệu gốc
                      loadNoteData()
                    } else {
                      // Nếu đang tạo mới, đặt về giá trị mặc định
                      setTitle('')
                      setContent('')
                      setReminderDate(new Date())
                      setLinkedShifts([])
                      setReminderType('specific')
                      setErrors({})
                    }
                  },
                },
              ]
            )
          }}
        >
          <Ionicons
            name="refresh-outline"
            size={24}
            color={darkMode ? COLORS.TEXT_DARK : COLORS.TEXT_LIGHT}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.iconButton,
            styles.saveButton,
            !isFormValid && styles.disabledButton,
            !isFormValid && darkMode && styles.darkDisabledButton,
          ]}
          onPress={handleSave}
          disabled={!isFormValid}
        >
          <Ionicons name="save-outline" size={24} color={COLORS.TEXT_DARK} />
        </TouchableOpacity>
      </View>

      {/* Thông báo lỗi */}
      {!isFormValid && (
        <Text style={styles.formErrorText}>
          {t('Vui lòng sửa các lỗi để tiếp tục')}
        </Text>
      )}
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
  darkContainer: {
    backgroundColor: COLORS.CARD_DARK,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.SUBTEXT_LIGHT,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: COLORS.TEXT_LIGHT,
  },
  subLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: COLORS.TEXT_LIGHT,
  },
  darkText: {
    color: COLORS.TEXT_DARK,
  },
  darkSubText: {
    color: COLORS.SUBTEXT_DARK,
  },
  requiredMark: {
    color: '#ff5252',
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
    borderColor: '#ff5252',
  },
  errorText: {
    color: '#ff5252',
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
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
    fontWeight: '500',
  },
  textArea: {
    height: 120,
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: COLORS.CARD_LIGHT,
    color: COLORS.TEXT_LIGHT,
  },
  reminderTypeSelector: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 16,
  },
  reminderTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 16,
    backgroundColor: COLORS.SECONDARY_CARD_LIGHT,
  },
  darkReminderTypeOption: {
    backgroundColor: COLORS.SECONDARY_CARD_DARK,
  },
  reminderTypeSelected: {
    backgroundColor: '#f0e6ff',
  },
  reminderTypeText: {
    fontSize: 14,
    color: COLORS.TEXT_LIGHT,
    marginLeft: 8,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.PRIMARY,
  },
  reminderContainer: {
    marginTop: 12,
    backgroundColor: COLORS.SECONDARY_CARD_LIGHT,
    padding: 12,
    borderRadius: 8,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  reminderDescription: {
    fontSize: 13,
    color: COLORS.SUBTEXT_LIGHT,
    marginTop: 4,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  linkedItemsContainer: {
    marginTop: 12,
    backgroundColor: COLORS.SECONDARY_CARD_LIGHT,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  darkLinkedItemsContainer: {
    backgroundColor: COLORS.SECONDARY_CARD_DARK,
  },
  checkboxContainer: {
    marginTop: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.CARD_LIGHT,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  darkCheckbox: {
    borderColor: COLORS.BORDER_DARK,
    backgroundColor: COLORS.SECONDARY_CARD_DARK,
  },
  checkboxSelected: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  checkboxLabel: {
    fontSize: 14,
    color: COLORS.TEXT_LIGHT,
    flex: 1,
  },
  darkCheckboxLabel: {
    color: COLORS.TEXT_DARK,
  },
  noDataText: {
    fontSize: 14,
    color: COLORS.SUBTEXT_LIGHT,
    fontStyle: 'italic',
    marginTop: 8,
  },
  darkNoDataText: {
    color: COLORS.SUBTEXT_DARK,
  },
  dateTimeButton: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.CARD_LIGHT,
  },
  darkDateTimeButton: {
    borderColor: COLORS.BORDER_DARK,
    backgroundColor: COLORS.SECONDARY_CARD_DARK,
  },
  dateTimeText: {
    fontSize: 16,
    color: COLORS.TEXT_LIGHT,
  },
  darkDateTimeText: {
    color: COLORS.TEXT_DARK,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    marginBottom: 12,
  },

  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginLeft: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  saveButton: {
    backgroundColor: COLORS.PRIMARY,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  deleteButton: {
    backgroundColor: '#ff5252',
  },
  resetButton: {
    backgroundColor: COLORS.SECONDARY_CARD_LIGHT,
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
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

  formErrorText: {
    color: '#ff5252',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '500',
  },
  pickerModalContainer: {
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
})

export default NoteForm
