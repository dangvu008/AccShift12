import React, { useState, useEffect, useContext } from 'react'
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
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import DateTimePicker from '@react-native-community/datetimepicker'
import { AppContext } from '../context/AppContext'
import { STORAGE_KEYS } from '../utils/constants'

const NoteForm = ({ noteId, onSave, onDelete }) => {
  const { t, darkMode } = useContext(AppContext)

  // Form state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [reminderTime, setReminderTime] = useState('')
  const [hasReminder, setHasReminder] = useState(false)
  const [reminderDate, setReminderDate] = useState(new Date())

  // Date/time picker state
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)

  // Load note data if editing
  useEffect(() => {
    if (noteId) {
      loadNoteData()
    }
  }, [noteId])

  const loadNoteData = async () => {
    try {
      const notesData = await AsyncStorage.getItem(STORAGE_KEYS.NOTES)
      if (notesData) {
        const notes = JSON.parse(notesData)
        const note = notes.find((n) => n.id === noteId)

        if (note) {
          setTitle(note.title || '')
          setContent(note.content || '')

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
      }
    } catch (error) {
      console.error('Error loading note data:', error)
    }
  }

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert(t('Error'), t('Title is required'))
      return
    }

    try {
      const notesData = await AsyncStorage.getItem(STORAGE_KEYS.NOTES)
      let notes = notesData ? JSON.parse(notesData) : []

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

      if (noteId) {
        // Update existing note
        notes = notes.map((note) =>
          note.id === noteId
            ? {
                ...note,
                title: title.trim(),
                content: content.trim(),
                reminderTime: formattedReminderTime,
                updatedAt: new Date().toISOString(),
              }
            : note
        )
      } else {
        // Add new note
        const newNote = {
          id: Date.now().toString(),
          title: title.trim(),
          content: content.trim(),
          reminderTime: formattedReminderTime,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        notes.push(newNote)
      }

      await AsyncStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes))

      if (onSave) {
        onSave(noteId || notes[notes.length - 1].id)
      }
    } catch (error) {
      console.error('Error saving note:', error)
      Alert.alert(t('Error'), t('Failed to save note'))
    }
  }

  const handleDelete = async () => {
    if (!noteId) return

    Alert.alert(
      t('Delete Note'),
      t('Are you sure you want to delete this note?'),
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
              const notesData = await AsyncStorage.getItem(STORAGE_KEYS.NOTES)
              if (notesData) {
                const notes = JSON.parse(notesData)
                const updatedNotes = notes.filter((note) => note.id !== noteId)
                await AsyncStorage.setItem(
                  STORAGE_KEYS.NOTES,
                  JSON.stringify(updatedNotes)
                )

                if (onDelete) {
                  onDelete(noteId, true)
                }
              }
            } catch (error) {
              console.error('Error deleting note:', error)
              Alert.alert(t('Error'), t('Failed to delete note'))
            }
          },
        },
      ]
    )
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

  const handleTimeChange = (event, selectedTime) => {
    // Hide picker immediately on Android
    if (Platform.OS === 'android') {
      setShowTimePicker(false)
    }

    // On iOS, only hide picker when user presses Done
    if (Platform.OS === 'ios' && event.type === 'set') {
      setShowTimePicker(false)
    }

    if (selectedTime) {
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

  return (
    <ScrollView style={styles.container}>
      {/* Title */}
      <View style={styles.formGroup}>
        <Text style={[styles.label, darkMode && styles.darkText]}>
          {t('Tiêu đề')}
        </Text>
        <TextInput
          style={[styles.input, darkMode && styles.darkInput]}
          value={title}
          onChangeText={setTitle}
          placeholder={t('Nhập tiêu đề')}
          placeholderTextColor={darkMode ? '#666' : '#999'}
        />
      </View>

      {/* Content */}
      <View style={styles.formGroup}>
        <Text style={[styles.label, darkMode && styles.darkText]}>
          {t('Nội dung')}
        </Text>
        <TextInput
          style={[styles.textArea, darkMode && styles.darkInput]}
          value={content}
          onChangeText={setContent}
          placeholder={t('Nhập nội dung ghi chú')}
          placeholderTextColor={darkMode ? '#666' : '#999'}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />
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
          <View style={styles.reminderContainer}>
            {/* Date Picker */}
            <TouchableOpacity
              style={[styles.dateTimeButton, darkMode && styles.darkInput]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={[styles.dateTimeText, darkMode && styles.darkText]}>
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
              <Text style={[styles.dateTimeText, darkMode && styles.darkText]}>
                {formatTime(reminderDate)}
              </Text>
              <Ionicons
                name="time-outline"
                size={24}
                color={darkMode ? '#fff' : '#333'}
              />
            </TouchableOpacity>

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
          </View>
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
          style={[styles.button, styles.saveButton]}
          onPress={handleSave}
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
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  darkText: {
    color: '#fff',
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

export default NoteForm
