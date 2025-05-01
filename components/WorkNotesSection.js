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
import { useFocusEffect } from '@react-navigation/native'

const WorkNotesSection = ({ navigation, route }) => {
  const { t, darkMode, currentShift, shifts } = useContext(AppContext)
  const [filteredNotes, setFilteredNotes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedNoteId, setExpandedNoteId] = useState(null)
  const [maxNotesDisplay, setMaxNotesDisplay] = useState(3) // Mặc định hiển thị 3 ghi chú
  const [showMaxNotesOptions, setShowMaxNotesOptions] = useState(false)

  // Parse reminder time string to Date object
  const parseReminderTime = (reminderTimeStr) => {
    try {
      if (!reminderTimeStr) return null

      // Handle different time formats
      if (reminderTimeStr.includes('/')) {
        // Full format: DD/MM/YYYY HH:MM
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
        // Time-only format: HH:MM
        const [hours, minutes] = reminderTimeStr.split(':').map(Number)

        if (isNaN(hours) || isNaN(minutes)) {
          return null
        }

        const date = new Date()
        date.setHours(hours, minutes, 0, 0)

        // If time has already passed today, set it for tomorrow
        if (date <= new Date()) {
          date.setDate(date.getDate() + 1)
        }

        return date
      }
    } catch (error) {
      console.error('Error parsing reminder time:', error)
      return null
    }
  }

  // Calculate reminder time for a shift
  const calculateShiftReminderTime = (
    dayOfWeek,
    departureTimeStr,
    minutesBefore,
    now
  ) => {
    try {
      const today = now.getDay()
      const [hours, minutes] = departureTimeStr.split(':').map(Number)

      // Calculate days to add to reach the next occurrence of the day
      let daysToAdd = dayOfWeek - today
      if (daysToAdd < 0) daysToAdd += 7

      // If it's today, check if the time has already passed
      if (daysToAdd === 0) {
        const departureMinutes = hours * 60 + minutes
        const currentMinutes = now.getHours() * 60 + now.getMinutes()
        const reminderMinutes = departureMinutes - minutesBefore

        if (reminderMinutes <= currentMinutes) {
          // Today's reminder time has passed, move to next week
          daysToAdd = 7
        }
      }

      // Create Date object for the reminder time
      const reminderTime = new Date(now)
      reminderTime.setDate(reminderTime.getDate() + daysToAdd)
      reminderTime.setHours(hours, minutes - minutesBefore, 0, 0)

      return reminderTime
    } catch (error) {
      console.error('Error calculating shift reminder time:', error)
      return null
    }
  }

  // Format reminder time for display
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

    // Format hours:minutes
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const timeStr = `${hours}:${minutes}`

    // Determine how to display the day
    if (reminderDay === today) {
      return `Hôm nay, ${timeStr}`
    } else if (reminderDay === today + 86400000) {
      // 24 hours in milliseconds
      return `Ngày mai, ${timeStr}`
    } else {
      const dayOfWeek = dayNames[date.getDay()]
      return `${dayOfWeek}, ${timeStr}`
    }
  }

  // Calculate nextReminderTime for all notes
  const calculateNextReminderTimes = useCallback((notes, allShifts) => {
    const now = new Date()
    const dayMap = { CN: 0, T2: 1, T3: 2, T4: 3, T5: 4, T6: 5, T7: 6 }

    // If no notes, return empty array
    if (!notes || notes.length === 0) {
      return []
    }

    return notes.map((note) => {
      let nextReminderTime = null
      let reminderDescription = ''

      // Case 1: Note has reminderTime and it's in the future
      if (note.reminderTime) {
        const reminderDate = parseReminderTime(note.reminderTime)
        if (reminderDate && reminderDate > now) {
          nextReminderTime = reminderDate
          reminderDescription = formatReminderTime(reminderDate)
        }
      }

      // Case 2: Note has linkedShifts
      if (
        !nextReminderTime &&
        note.linkedShifts &&
        note.linkedShifts.length > 0
      ) {
        // Find the earliest reminder time from linked shifts
        let earliestReminder = null
        let associatedShiftName = ''

        for (const shiftId of note.linkedShifts) {
          const shift = allShifts.find((s) => s.id === shiftId)
          if (!shift || !shift.daysApplied) {
            continue
          }

          // Use startTime instead of departureTime as departureTime doesn't exist in the data
          const departureTime = shift.startTime
          if (!departureTime) {
            continue
          }

          // Calculate reminder time for each day of the shift
          for (const day of shift.daysApplied) {
            const dayNumber = dayMap[day]
            if (dayNumber === undefined) {
              continue
            }

            // Calculate reminder time (5 minutes before startTime)
            const reminderTime = calculateShiftReminderTime(
              dayNumber,
              departureTime,
              5, // 5 minutes before startTime
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

      // Always return the note, even if it doesn't have a nextReminderTime
      return {
        ...note,
        nextReminderTime,
        reminderDescription,
      }
    })
  }, [])

  // Lấy số lượng ghi chú hiển thị từ AsyncStorage
  useEffect(() => {
    const loadMaxNotesDisplay = async () => {
      try {
        const userSettings = await AsyncStorage.getItem(
          STORAGE_KEYS.USER_SETTINGS
        )
        if (userSettings) {
          const settings = JSON.parse(userSettings)
          if (settings.maxNotesDisplay) {
            setMaxNotesDisplay(settings.maxNotesDisplay)
          }
        }
      } catch (error) {
        console.error('Lỗi khi tải cài đặt số lượng ghi chú:', error)
      }
    }

    loadMaxNotesDisplay()
  }, [])

  // Lưu số lượng ghi chú hiển thị vào AsyncStorage
  const saveMaxNotesDisplay = async (value) => {
    try {
      const userSettings = await AsyncStorage.getItem(
        STORAGE_KEYS.USER_SETTINGS
      )
      let settings = userSettings ? JSON.parse(userSettings) : {}
      settings.maxNotesDisplay = value
      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_SETTINGS,
        JSON.stringify(settings)
      )
      return true
    } catch (error) {
      console.error('Lỗi khi lưu cài đặt số lượng ghi chú:', error)
      return false
    }
  }

  // Xử lý thay đổi số lượng ghi chú hiển thị
  const handleMaxNotesChange = async (value) => {
    setMaxNotesDisplay(value)
    setShowMaxNotesOptions(false)
    await saveMaxNotesDisplay(value)

    // Tải lại danh sách ghi chú với số lượng mới
    loadNotes()
  }

  // Load and filter notes
  const loadNotes = useCallback(async () => {
    let isMounted = true
    setIsLoading(true)

    try {
      const allNotes = await getNotes()
      const allShifts = await getShifts()

      if (!isMounted) return

      // Calculate nextReminderTime for each note
      const notesWithReminders = calculateNextReminderTimes(allNotes, allShifts)

      // Lọc bỏ các ghi chú đã ẩn khỏi trang chủ
      const visibleNotes = notesWithReminders.filter(
        (note) => !note.isHiddenFromHome
      )

      // Áp dụng logic cốt lõi theo yêu cầu
      let urgentNote = null
      let candidateList = []

      // Tìm ghi chú cấp thiết nhất (có nextReminderTime sớm nhất)
      visibleNotes.forEach((note) => {
        if (note.nextReminderTime) {
          if (
            !urgentNote ||
            note.nextReminderTime < urgentNote.nextReminderTime
          ) {
            urgentNote = note
          }
        }
      })

      // Lọc ra các ghi chú còn lại có nextReminderTime trong tương lai
      candidateList = visibleNotes.filter(
        (note) =>
          note.id !== (urgentNote ? urgentNote.id : null) &&
          note.nextReminderTime
      )

      // Sắp xếp candidateList: Ưu tiên theo isPriority, sau đó theo nextReminderTime
      candidateList.sort((a, b) => {
        // First, prioritize notes marked as priority
        if (a.isPriority && !b.isPriority) return -1
        if (!a.isPriority && b.isPriority) return 1

        // If both have same priority status, sort by nextReminderTime
        return a.nextReminderTime - b.nextReminderTime
      })

      // Tạo danh sách hiển thị
      let displayNotes = []

      // Vị trí đầu tiên: Luôn là urgentNote nếu có
      if (urgentNote) {
        displayNotes.push(urgentNote)
      }

      // Các vị trí còn lại: Lấy từ đầu danh sách candidateList
      const remainingSlots = maxNotesDisplay - displayNotes.length
      if (remainingSlots > 0 && candidateList.length > 0) {
        displayNotes = [
          ...displayNotes,
          ...candidateList.slice(0, remainingSlots),
        ]
      }

      // Nếu vẫn chưa đủ số lượng, thêm các ghi chú không có nextReminderTime
      const notesWithoutReminder = visibleNotes.filter(
        (note) => !note.nextReminderTime
      )

      // Sắp xếp theo thời gian cập nhật
      notesWithoutReminder.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )

      // Thêm vào danh sách hiển thị nếu còn chỗ
      const slotsLeft = maxNotesDisplay - displayNotes.length
      if (slotsLeft > 0 && notesWithoutReminder.length > 0) {
        displayNotes = [
          ...displayNotes,
          ...notesWithoutReminder.slice(0, slotsLeft),
        ]
      }

      // Sắp xếp lại theo thứ tự thời gian nextReminderTime tăng dần
      displayNotes.sort((a, b) => {
        if (a.nextReminderTime && b.nextReminderTime) {
          return a.nextReminderTime - b.nextReminderTime
        }
        if (a.nextReminderTime) return -1
        if (b.nextReminderTime) return 1
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      })

      if (!isMounted) return

      setFilteredNotes(displayNotes)
    } catch (error) {
      console.error('Error loading notes:', error)
    } finally {
      if (isMounted) {
        setIsLoading(false)
      }
    }

    return () => {
      isMounted = false
    }
  }, [calculateNextReminderTimes, maxNotesDisplay])

  // Load notes when component mounts or dependencies change
  useEffect(() => {
    loadNotes()
  }, [loadNotes])

  // Tải lại dữ liệu khi màn hình được focus
  useFocusEffect(
    useCallback(() => {
      console.log('WorkNotesSection được focus, tải lại dữ liệu ghi chú')
      loadNotes()
      return () => {
        // Cleanup khi component bị unfocus
      }
    }, [loadNotes])
  )

  // Theo dõi thay đổi từ tham số route
  useEffect(() => {
    if (route?.params?.notesUpdated) {
      console.log(
        'WorkNotesSection: Phát hiện cập nhật ghi chú từ tham số route, timestamp:',
        route.params.timestamp
      )
      loadNotes()
    }
  }, [route?.params?.notesUpdated, route?.params?.timestamp, loadNotes])

  // Handle adding a new note
  const handleAddNote = () => {
    navigation.navigate('NoteDetail')
  }

  // Handle editing a note
  const handleEditNote = (noteId) => {
    navigation.navigate('NoteDetail', { noteId })
  }

  // Handle hiding a note from home screen
  const handleHideNote = (noteId) => {
    // Show confirmation before hiding
    Alert.alert(
      t('Ẩn ghi chú'),
      t(
        'Bạn có muốn ẩn ghi chú này khỏi trang chủ và tắt nhắc nhở tiếp theo không?'
      ),
      [
        {
          text: t('Hủy'),
          style: 'cancel',
        },
        {
          text: t('Ẩn'),
          onPress: async () => {
            try {
              // Get current notes
              const allNotes = await getNotes()
              // Find the note to hide
              const noteIndex = allNotes.findIndex((note) => note.id === noteId)

              if (noteIndex !== -1) {
                // Update the note with isHiddenFromHome flag
                allNotes[noteIndex] = {
                  ...allNotes[noteIndex],
                  isHiddenFromHome: true,
                  updatedAt: new Date().toISOString(),
                }

                // Save the updated notes list
                await AsyncStorage.setItem(
                  STORAGE_KEYS.NOTES,
                  JSON.stringify(allNotes)
                )

                // Update state to refresh the display
                setFilteredNotes(
                  filteredNotes.filter((note) => note.id !== noteId)
                )

                // Hủy thông báo nhắc nhở nếu có
                try {
                  const { AppContext } = require('../context/AppContext')
                  const { alarmManager } = AppContext
                  if (alarmManager) {
                    await alarmManager.cancelAlarmsByPrefix(`note_${noteId}`)
                  }
                } catch (alarmError) {
                  console.error('Error canceling note alarms:', alarmError)
                }
              }
            } catch (error) {
              console.error('Error hiding note:', error)
              Alert.alert(
                t('Lỗi'),
                t('Không thể ẩn ghi chú. Vui lòng thử lại.')
              )
            }
          },
        },
      ]
    )
  }

  // Handle note press (expand/collapse)
  const handleNotePress = (noteId) => {
    setExpandedNoteId(expandedNoteId === noteId ? null : noteId)
  }

  return (
    <View style={[styles.container, darkMode && styles.darkCard]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, darkMode && styles.darkText]}>
            {t('Work Notes')}
          </Text>
          <TouchableOpacity
            style={styles.maxNotesButton}
            onPress={() => setShowMaxNotesOptions(!showMaxNotesOptions)}
          >
            <Text
              style={[styles.maxNotesText, darkMode && styles.darkSubtitle]}
            >
              {t('Hiển thị')}: {maxNotesDisplay}
            </Text>
            <Ionicons
              name={showMaxNotesOptions ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={darkMode ? '#aaa' : '#666'}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.viewAllButton, darkMode && styles.darkViewAllButton]}
            onPress={() => {
              console.log('View All button pressed')
              try {
                // Điều hướng trực tiếp đến màn hình Notes trong SettingsStack
                // Sử dụng cách điều hướng rõ ràng hơn để tránh xung đột
                navigation.navigate('SettingsStack', {
                  screen: 'Notes',
                  initial: false,
                })
                console.log('Đã điều hướng đến SettingsStack -> Notes')
              } catch (error) {
                console.error('Lỗi khi điều hướng đến màn hình Notes:', error)
              }
            }}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <View style={styles.viewAllButtonContent}>
              <Ionicons name="list" size={20} color="#8a56ff" />
              <Text style={styles.viewAllButtonText}>{t('View All')}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addNoteButton}
            onPress={handleAddNote}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={24} color="#8a56ff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tùy chọn số lượng ghi chú hiển thị */}
      {showMaxNotesOptions && (
        <View
          style={[
            styles.maxNotesOptionsContainer,
            darkMode && styles.darkMaxNotesOptionsContainer,
          ]}
        >
          {[2, 3, 5].map((num) => (
            <TouchableOpacity
              key={num}
              style={[
                styles.maxNotesOption,
                maxNotesDisplay === num && styles.selectedMaxNotesOption,
              ]}
              onPress={() => handleMaxNotesChange(num)}
            >
              <Text
                style={[
                  styles.maxNotesOptionText,
                  maxNotesDisplay === num && styles.selectedMaxNotesOptionText,
                  darkMode && styles.darkText,
                ]}
              >
                {num} {t('ghi chú')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

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
                      navigation.navigate('NoteDetail', { noteId: note.id })
                    }}
                  >
                    <Ionicons
                      name="pencil-outline"
                      size={18}
                      color={darkMode ? '#aaa' : '#666'}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={(e) => {
                      e.stopPropagation()
                      handleHideNote(note.id)
                    }}
                  >
                    <Ionicons
                      name="eye-off-outline"
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
  titleContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  darkText: {
    color: '#fff',
  },
  darkSubtitle: {
    color: '#aaa',
  },
  maxNotesButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  maxNotesText: {
    fontSize: 12,
    color: '#666',
    marginRight: 4,
  },
  maxNotesOptionsContainer: {
    backgroundColor: '#fff',
    marginBottom: 12,
    borderRadius: 8,
    padding: 8,
    flexDirection: 'row',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  darkMaxNotesOptionsContainer: {
    backgroundColor: '#2a2a2a',
  },
  maxNotesOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  selectedMaxNotesOption: {
    backgroundColor: '#f0e6ff',
  },
  maxNotesOptionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  selectedMaxNotesOptionText: {
    color: '#8a56ff',
    fontWeight: '500',
  },
  viewAllButton: {
    padding: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f0e6ff',
  },
  darkViewAllButton: {
    backgroundColor: '#3a2a5a',
  },
  viewAllButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllButtonText: {
    color: '#8a56ff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  addNoteButton: {
    padding: 8,
    borderRadius: 20,
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
    marginHorizontal: 3,
  },
})

export default WorkNotesSection
