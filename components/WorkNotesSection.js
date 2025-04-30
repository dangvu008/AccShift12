'use client'

import { useContext, useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { AppContext } from '../context/AppContext'
import { getNotes, getShifts } from '../utils/database'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { STORAGE_KEYS } from '../utils/constants'

const WorkNotesSection = ({ navigation }) => {
  const { t, darkMode, currentShift, shifts } = useContext(AppContext)
  const [filteredNotes, setFilteredNotes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedNoteId, setExpandedNoteId] = useState(null)

  // Load and filter notes
  useEffect(() => {
    const loadNotes = async () => {
      setIsLoading(true)
      const allNotes = await getNotes()
      const allShifts = await getShifts()

      // Tính toán nextReminderTime cho mỗi ghi chú
      const notesWithReminders = calculateNextReminderTimes(allNotes, allShifts)

      // Sắp xếp ghi chú: ưu tiên ghi chú có nextReminderTime, sau đó là theo thời gian cập nhật
      const sortedNotes = notesWithReminders.sort((a, b) => {
        // Nếu cả hai đều có nextReminderTime, sắp xếp theo thời gian nhắc nhở
        if (a.nextReminderTime && b.nextReminderTime) {
          return a.nextReminderTime - b.nextReminderTime
        }
        // Nếu chỉ một trong hai có nextReminderTime, ưu tiên ghi chú có nhắc nhở
        if (a.nextReminderTime) return -1
        if (b.nextReminderTime) return 1

        // Nếu không có nextReminderTime, sắp xếp theo thời gian cập nhật mới nhất
        return new Date(b.updatedAt) - new Date(a.updatedAt)
      })

      // Giới hạn 3 ghi chú
      setFilteredNotes(sortedNotes.slice(0, 3))
      setIsLoading(false)
    }

    loadNotes()
  }, [currentShift, shifts, calculateNextReminderTimes])

  // Tính toán nextReminderTime cho tất cả các ghi chú
  const calculateNextReminderTimes = useCallback((notes, allShifts) => {
    const now = new Date()
    const dayMap = { CN: 0, T2: 1, T3: 2, T4: 3, T5: 4, T6: 5, T7: 6 }
    const reverseDayMap = {
      0: 'CN',
      1: 'T2',
      2: 'T3',
      3: 'T4',
      4: 'T5',
      5: 'T6',
      6: 'T7',
    }

    return notes.map((note) => {
      let nextReminderTime = null
      let reminderDescription = ''

      // Trường hợp 1: Note có reminderDateTime và thời điểm đó chưa qua
      if (note.reminderTime) {
        const reminderDate = parseReminderTime(note.reminderTime)
        if (reminderDate && reminderDate > now) {
          nextReminderTime = reminderDate
          reminderDescription = formatReminderTime(reminderDate)
        }
      }

      // Trường hợp 2: Note có associatedShiftIds
      if (
        !nextReminderTime &&
        note.linkedShifts &&
        note.linkedShifts.length > 0
      ) {
        // Tìm thời điểm nhắc nhở gần nhất từ các ca liên kết
        let earliestReminder = null
        let associatedShiftName = ''

        for (const shiftId of note.linkedShifts) {
          const shift = allShifts.find((s) => s.id === shiftId)
          if (!shift || !shift.daysApplied || !shift.departureTime) continue

          // Tính toán thời điểm nhắc nhở cho mỗi ngày của ca
          for (const day of shift.daysApplied) {
            const dayNumber = dayMap[day]
            if (dayNumber === undefined) continue

            // Tính toán thời gian nhắc nhở (5 phút trước departureTime)
            const reminderTime = calculateShiftReminderTime(
              dayNumber,
              shift.departureTime,
              5, // 5 phút trước departureTime
              now
            )

            if (
              reminderTime &&
              (!earliestReminder || reminderTime < earliestReminder)
            ) {
              earliestReminder = reminderTime
              associatedShiftName = shift.name
            }
          }
        }

        if (earliestReminder) {
          nextReminderTime = earliestReminder
          reminderDescription = `${associatedShiftName}, ${formatReminderTime(
            earliestReminder
          )}`
        }
      }

      return {
        ...note,
        nextReminderTime,
        reminderDescription,
      }
    })
  }, [])

  // Phân tích chuỗi thời gian nhắc nhở thành đối tượng Date
  const parseReminderTime = (reminderTimeStr) => {
    try {
      if (!reminderTimeStr) return null

      // Xử lý các định dạng thời gian khác nhau
      if (reminderTimeStr.includes('/')) {
        // Định dạng đầy đủ: DD/MM/YYYY HH:MM
        const [datePart, timePart] = reminderTimeStr.split(' ')
        if (!datePart || !timePart) return null

        const [day, month, year] = datePart.split('/').map(Number)
        const [hours, minutes] = timePart.split(':').map(Number)

        if (
          isNaN(day) ||
          isNaN(month) ||
          isNaN(year) ||
          isNaN(hours) ||
          isNaN(minutes)
        ) {
          return null
        }

        const date = new Date()
        date.setFullYear(year)
        date.setMonth(month - 1)
        date.setDate(day)
        date.setHours(hours, minutes, 0, 0)
        return date
      } else {
        // Định dạng chỉ có giờ: HH:MM
        const [hours, minutes] = reminderTimeStr.split(':').map(Number)

        if (isNaN(hours) || isNaN(minutes)) {
          return null
        }

        const date = new Date()
        date.setHours(hours, minutes, 0, 0)

        // Nếu thời gian đã qua trong ngày, chuyển sang ngày mai
        if (date <= new Date()) {
          date.setDate(date.getDate() + 1)
        }

        return date
      }
    } catch (error) {
      console.error('Lỗi khi phân tích thời gian nhắc nhở:', error)
      return null
    }
  }

  // Tính toán thời gian nhắc nhở cho ca làm việc
  const calculateShiftReminderTime = (
    dayOfWeek,
    departureTimeStr,
    minutesBefore,
    now
  ) => {
    try {
      const today = now.getDay()
      const [hours, minutes] = departureTimeStr.split(':').map(Number)

      // Tính số ngày cần thêm để đến ngày trong tuần tiếp theo
      let daysToAdd = dayOfWeek - today
      if (daysToAdd < 0) daysToAdd += 7

      // Nếu là hôm nay, kiểm tra xem thời gian đã qua chưa
      if (daysToAdd === 0) {
        const departureMinutes = hours * 60 + minutes
        const currentMinutes = now.getHours() * 60 + now.getMinutes()
        const reminderMinutes = departureMinutes - minutesBefore

        if (reminderMinutes <= currentMinutes) {
          // Thời gian nhắc nhở hôm nay đã qua, chuyển sang tuần sau
          daysToAdd = 7
        }
      }

      // Tạo đối tượng Date cho thời gian nhắc nhở
      const reminderTime = new Date(now)
      reminderTime.setDate(reminderTime.getDate() + daysToAdd)
      reminderTime.setHours(hours, minutes - minutesBefore, 0, 0)

      return reminderTime
    } catch (error) {
      console.error('Lỗi khi tính toán thời gian nhắc nhở ca làm việc:', error)
      return null
    }
  }

  // Định dạng thời gian nhắc nhở để hiển thị
  const formatReminderTime = (date) => {
    if (!date) return ''

    const now = new Date()
    const today = now.setHours(0, 0, 0, 0)
    const reminderDay = new Date(date).setHours(0, 0, 0, 0)
    const dayNames = {
      0: 'CN',
      1: 'T2',
      2: 'T3',
      3: 'T4',
      4: 'T5',
      5: 'T6',
      6: 'T7',
    }

    // Định dạng giờ:phút
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const timeStr = `${hours}:${minutes}`

    // Xác định cách hiển thị ngày
    if (reminderDay === today) {
      return `Hôm nay, ${timeStr}`
    } else if (reminderDay === today + 86400000) {
      // 24 giờ tính bằng mili giây
      return `Ngày mai, ${timeStr}`
    } else {
      const dayOfWeek = dayNames[date.getDay()]
      return `${dayOfWeek}, ${timeStr}`
    }
  }

  const handleAddNote = () => {
    navigation.navigate('NoteDetail')
  }

  const handleEditNote = (noteId) => {
    navigation.navigate('NoteDetail', { noteId })
  }

  const handleDeleteNote = (noteId) => {
    // Hiển thị xác nhận trước khi xóa
    Alert.alert(
      t('Xóa ghi chú'),
      t('Bạn có chắc chắn muốn xóa ghi chú này không?'),
      [
        {
          text: t('Hủy'),
          style: 'cancel',
        },
        {
          text: t('Xóa'),
          style: 'destructive',
          onPress: async () => {
            try {
              // Lấy danh sách ghi chú hiện tại
              const allNotes = await getNotes()
              // Lọc bỏ ghi chú cần xóa
              const updatedNotes = allNotes.filter((note) => note.id !== noteId)
              // Lưu lại danh sách ghi chú đã cập nhật
              await AsyncStorage.setItem(
                STORAGE_KEYS.NOTES,
                JSON.stringify(updatedNotes)
              )
              // Cập nhật state để hiển thị lại danh sách
              setFilteredNotes(
                filteredNotes.filter((note) => note.id !== noteId)
              )
            } catch (error) {
              console.error('Lỗi khi xóa ghi chú:', error)
              Alert.alert(
                t('Lỗi'),
                t('Không thể xóa ghi chú. Vui lòng thử lại.')
              )
            }
          },
        },
      ]
    )
  }

  // Xử lý khi nhấn vào ghi chú (mở rộng/thu gọn)
  const handleNotePress = (noteId) => {
    setExpandedNoteId(expandedNoteId === noteId ? null : noteId)
  }

  return (
    <View style={[styles.container, darkMode && styles.darkCard]}>
      <View style={styles.header}>
        <Text style={[styles.title, darkMode && styles.darkText]}>
          {t('Work Notes')}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => navigation.navigate('Notes')}
          >
            <Ionicons name="list" size={20} color="#8a56ff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addNoteButton}
            onPress={handleAddNote}
          >
            <Ionicons name="add" size={24} color="#8a56ff" />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.emptyText, darkMode && styles.darkSubtitle]}>
            {t('Loading notes...')}
          </Text>
        </View>
      ) : filteredNotes.length > 0 ? (
        <View style={styles.notesContainer}>
          {filteredNotes.map((note) => {
            const isExpanded = expandedNoteId === note.id

            return (
              <TouchableOpacity
                key={note.id}
                style={[styles.noteItem, isExpanded && styles.noteItemExpanded]}
                onPress={() => handleNotePress(note.id)}
                activeOpacity={0.7}
              >
                <View style={styles.noteContent}>
                  <Text
                    style={[styles.noteTitle, darkMode && styles.darkText]}
                    numberOfLines={isExpanded ? undefined : 1}
                    ellipsizeMode="tail"
                  >
                    {note.title || ''}
                  </Text>

                  <Text
                    style={[styles.noteText, darkMode && styles.darkSubtitle]}
                    numberOfLines={isExpanded ? undefined : 2}
                    ellipsizeMode="tail"
                  >
                    {note.content || ''}
                  </Text>

                  <View style={styles.noteFooter}>
                    {note.reminderDescription ? (
                      <View style={styles.reminderBadge}>
                        <Ionicons
                          name="alarm-outline"
                          size={12}
                          color="#fff"
                          style={styles.reminderIcon}
                        />
                        <Text style={styles.reminderText}>
                          {note.reminderDescription}
                        </Text>
                      </View>
                    ) : note.reminderTime ? (
                      <View style={styles.reminderBadge}>
                        <Ionicons
                          name="alarm-outline"
                          size={12}
                          color="#fff"
                          style={styles.reminderIcon}
                        />
                        <Text style={styles.reminderText}>
                          {note.reminderTime}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                <View style={styles.noteActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={(e) => {
                      e.stopPropagation()
                      handleEditNote(note.id)
                    }}
                  >
                    <Ionicons
                      name="pencil"
                      size={18}
                      color={darkMode ? '#aaa' : '#666'}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={(e) => {
                      e.stopPropagation()
                      handleDeleteNote(note.id)
                    }}
                  >
                    <Ionicons
                      name="trash"
                      size={18}
                      color={darkMode ? '#aaa' : '#666'}
                    />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )
          })}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, darkMode && styles.darkSubtitle]}>
            {t('No work notes for today')}
          </Text>
          <TouchableOpacity
            style={styles.emptyAddButton}
            onPress={handleAddNote}
          >
            <Text style={styles.emptyAddButtonText}>{t('Add Note')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  darkCard: {
    backgroundColor: '#1e1e1e',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  darkText: {
    color: '#fff',
  },
  darkSubtitle: {
    color: '#aaa',
  },
  viewAllButton: {
    padding: 8,
    marginRight: 8,
  },
  addNoteButton: {
    padding: 6,
  },

  loadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  emptyAddButton: {
    backgroundColor: '#8a56ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  emptyAddButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  notesContainer: {
    maxHeight: 300,
  },
  noteItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: 'transparent',
    borderRadius: 8,
    marginBottom: 4,
  },
  noteItemExpanded: {
    backgroundColor: '#f9f5ff',
    padding: 8,
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  noteContent: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  noteText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  noteFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8a56ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  reminderIcon: {
    marginRight: 4,
  },
  reminderText: {
    color: '#fff',
    fontSize: 12,
  },
  noteActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
  },
  actionButton: {
    padding: 6,
  },
})

export default WorkNotesSection
