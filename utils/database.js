import AsyncStorage from '@react-native-async-storage/async-storage'
import { STORAGE_KEYS } from './constants'

// Initialize database and load sample data
export const initializeDatabase = async () => {
  try {
    console.log('Bắt đầu khởi tạo cơ sở dữ liệu...')

    // Check if shifts are already initialized
    let shiftsJson
    try {
      shiftsJson = await AsyncStorage.getItem(STORAGE_KEYS.SHIFT_LIST)
      console.log(
        'Đã đọc dữ liệu ca làm việc từ AsyncStorage:',
        shiftsJson ? 'Có dữ liệu' : 'Không có dữ liệu'
      )
    } catch (storageError) {
      console.error(
        'Lỗi khi đọc dữ liệu ca làm việc từ AsyncStorage:',
        storageError
      )
      shiftsJson = null
    }

    if (!shiftsJson) {
      console.log('Không tìm thấy dữ liệu ca làm việc, tạo dữ liệu mẫu...')
      // Initialize with sample shifts
      const sampleShifts = [
        {
          id: '1',
          name: 'Ca Sáng',
          startTime: '08:00',
          endTime: '12:00',
          officeEndTime: '12:15',
          daysApplied: ['T2', 'T3', 'T4', 'T5', 'T6'],
          reminderBefore: 15,
          reminderAfter: 15,
          breakTime: 60,
          roundUpMinutes: 30,
          showCheckInButton: true,
          showCheckInButtonWhileWorking: true,
          isActive: true,
          isDefault: false,
        },
        {
          id: '2',
          name: 'Ca Chiều',
          startTime: '13:00',
          endTime: '17:00',
          officeEndTime: '17:15',
          daysApplied: ['T2', 'T3', 'T4', 'T5', 'T6'],
          reminderBefore: 15,
          reminderAfter: 15,
          breakTime: 60,
          roundUpMinutes: 30,
          showCheckInButton: true,
          showCheckInButtonWhileWorking: true,
          isActive: true,
          isDefault: false,
        },
        {
          id: '3',
          name: 'Ca Tối',
          startTime: '18:00',
          endTime: '22:00',
          officeEndTime: '22:15',
          daysApplied: ['T2', 'T3', 'T4', 'T5', 'T6'],
          reminderBefore: 15,
          reminderAfter: 15,
          breakTime: 60,
          roundUpMinutes: 30,
          showCheckInButton: true,
          showCheckInButtonWhileWorking: true,
          isActive: true,
          isDefault: false,
        },
        {
          id: '4',
          name: 'Ca Hành Chính',
          startTime: '08:00',
          endTime: '17:00',
          breakTime: 60,
          daysApplied: ['T2', 'T3', 'T4', 'T5', 'T6'],
          isActive: true,
          isDefault: true,
        },
      ]

      try {
        await AsyncStorage.setItem(
          STORAGE_KEYS.SHIFT_LIST,
          JSON.stringify(sampleShifts)
        )
        console.log('Đã lưu dữ liệu mẫu ca làm việc thành công')

        // Kiểm tra lại xem dữ liệu đã được lưu chưa
        const checkShiftsJson = await AsyncStorage.getItem(
          STORAGE_KEYS.SHIFT_LIST
        )
        if (checkShiftsJson) {
          console.log('Xác nhận dữ liệu ca làm việc đã được lưu thành công')
        } else {
          console.error('Dữ liệu ca làm việc không được lưu thành công')
        }
      } catch (saveError) {
        console.error('Lỗi khi lưu dữ liệu mẫu ca làm việc:', saveError)
      }
    }

    // Check if check-in history is already initialized
    let checkInHistoryJson
    try {
      checkInHistoryJson = await AsyncStorage.getItem(
        STORAGE_KEYS.ATTENDANCE_RECORDS
      )
      console.log(
        'Đã đọc dữ liệu điểm danh từ AsyncStorage:',
        checkInHistoryJson ? 'Có dữ liệu' : 'Không có dữ liệu'
      )
    } catch (storageError) {
      console.error(
        'Lỗi khi đọc dữ liệu điểm danh từ AsyncStorage:',
        storageError
      )
      checkInHistoryJson = null
    }

    if (!checkInHistoryJson) {
      console.log('Không tìm thấy dữ liệu điểm danh, khởi tạo mảng rỗng...')
      // Initialize with empty array
      try {
        await AsyncStorage.setItem(
          STORAGE_KEYS.ATTENDANCE_RECORDS,
          JSON.stringify([])
        )
        console.log('Đã khởi tạo dữ liệu điểm danh thành công')
      } catch (saveError) {
        console.error('Lỗi khi khởi tạo dữ liệu điểm danh:', saveError)
      }
    }

    // Check if notes are already initialized
    let notesJson
    try {
      notesJson = await AsyncStorage.getItem(STORAGE_KEYS.NOTES)
      console.log(
        'Đã đọc dữ liệu ghi chú từ AsyncStorage:',
        notesJson ? 'Có dữ liệu' : 'Không có dữ liệu'
      )
    } catch (storageError) {
      console.error(
        'Lỗi khi đọc dữ liệu ghi chú từ AsyncStorage:',
        storageError
      )
      notesJson = null
    }

    if (!notesJson) {
      console.log('Không tìm thấy dữ liệu ghi chú, khởi tạo mảng rỗng...')
      // Initialize with empty array
      try {
        await AsyncStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify([]))
        console.log('Đã khởi tạo dữ liệu ghi chú thành công')
      } catch (saveError) {
        console.error('Lỗi khi khởi tạo dữ liệu ghi chú:', saveError)
      }
    }

    console.log('Hoàn thành khởi tạo cơ sở dữ liệu')
    return true
  } catch (error) {
    console.error('Lỗi khi khởi tạo cơ sở dữ liệu:', error)
    return false
  }
}

// Get shifts
export const getShifts = async () => {
  try {
    console.log('Đang lấy dữ liệu ca làm việc...')

    let shiftsJson
    try {
      shiftsJson = await AsyncStorage.getItem(STORAGE_KEYS.SHIFT_LIST)
      console.log(
        'Kết quả đọc dữ liệu ca làm việc:',
        shiftsJson ? 'Thành công' : 'Không có dữ liệu'
      )
    } catch (storageError) {
      console.error(
        'Lỗi khi đọc dữ liệu ca làm việc từ AsyncStorage:',
        storageError
      )
      shiftsJson = null
    }

    if (shiftsJson) {
      try {
        const shifts = JSON.parse(shiftsJson)
        console.log(`Đã tìm thấy ${shifts.length} ca làm việc`)
        return shifts
      } catch (parseError) {
        console.error('Lỗi khi phân tích dữ liệu ca làm việc:', parseError)
        // Nếu có lỗi khi parse, tiếp tục tạo dữ liệu mẫu
      }
    }

    // Trả về dữ liệu mẫu nếu không có dữ liệu nào được lưu trữ hoặc có lỗi
    console.log('Tạo dữ liệu mẫu ca làm việc...')
    const sampleShifts = [
      {
        id: '1',
        name: 'Ca Sáng',
        startTime: '08:00',
        endTime: '12:00',
        officeEndTime: '12:15',
        daysApplied: ['T2', 'T3', 'T4', 'T5', 'T6'],
        reminderBefore: 15,
        reminderAfter: 15,
        breakTime: 60,
        roundUpMinutes: 30,
        showCheckInButton: true,
        showCheckInButtonWhileWorking: true,
        isActive: true,
        isDefault: false,
      },
      {
        id: '2',
        name: 'Ca Chiều',
        startTime: '13:00',
        endTime: '17:00',
        officeEndTime: '17:15',
        daysApplied: ['T2', 'T3', 'T4', 'T5', 'T6'],
        reminderBefore: 15,
        reminderAfter: 15,
        breakTime: 60,
        roundUpMinutes: 30,
        showCheckInButton: true,
        showCheckInButtonWhileWorking: true,
        isActive: true,
        isDefault: false,
      },
      {
        id: '3',
        name: 'Ca Tối',
        startTime: '18:00',
        endTime: '22:00',
        officeEndTime: '22:15',
        daysApplied: ['T2', 'T3', 'T4', 'T5', 'T6'],
        reminderBefore: 15,
        reminderAfter: 15,
        breakTime: 60,
        roundUpMinutes: 30,
        showCheckInButton: true,
        showCheckInButtonWhileWorking: true,
        isActive: true,
        isDefault: false,
      },
      {
        id: '4',
        name: 'Ca Hành Chính',
        startTime: '08:00',
        endTime: '17:00',
        breakTime: 60,
        daysApplied: ['T2', 'T3', 'T4', 'T5', 'T6'],
        isActive: true,
        isDefault: true,
      },
    ]

    // Lưu dữ liệu mẫu vào AsyncStorage
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.SHIFT_LIST,
        JSON.stringify(sampleShifts)
      )
      console.log('Đã lưu dữ liệu mẫu ca làm việc thành công')

      // Kiểm tra lại xem dữ liệu đã được lưu chưa
      const checkShiftsJson = await AsyncStorage.getItem(
        STORAGE_KEYS.SHIFT_LIST
      )
      if (checkShiftsJson) {
        console.log('Xác nhận dữ liệu ca làm việc đã được lưu thành công')
      } else {
        console.error('Dữ liệu ca làm việc không được lưu thành công')
      }
    } catch (saveError) {
      console.error('Lỗi khi lưu dữ liệu mẫu ca làm việc:', saveError)
    }

    return sampleShifts
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu ca làm việc:', error)
    return []
  }
}

// Get check-in history
export const getCheckInHistory = async () => {
  try {
    const checkInHistoryJson = await AsyncStorage.getItem(
      STORAGE_KEYS.ATTENDANCE_RECORDS
    )
    return checkInHistoryJson ? JSON.parse(checkInHistoryJson) : []
  } catch (error) {
    console.error('Error getting check-in history:', error)
    return []
  }
}

// Get current shift
export const getCurrentShift = async () => {
  try {
    const currentShiftId = await AsyncStorage.getItem(
      STORAGE_KEYS.CURRENT_SHIFT
    )
    if (!currentShiftId) {
      // If no current shift is set, get the default shift
      const shifts = await getShifts()
      const defaultShift = shifts.find((shift) => shift.isDefault)
      return defaultShift || null
    }

    const shifts = await getShifts()
    return shifts.find((shift) => shift.id === currentShiftId) || null
  } catch (error) {
    console.error('Error getting current shift:', error)
    return null
  }
}

// Add shift
export const addShift = async (shiftData) => {
  try {
    const shifts = await getShifts()

    // If isDefault is true, set all other shifts to not default
    if (shiftData.isDefault) {
      shifts.forEach((shift) => {
        shift.isDefault = false
      })
    }

    const newShift = {
      id: Date.now().toString(),
      ...shiftData,
    }
    const updatedShifts = [...shifts, newShift]
    await AsyncStorage.setItem(
      STORAGE_KEYS.SHIFT_LIST,
      JSON.stringify(updatedShifts)
    )
    return newShift
  } catch (error) {
    console.error('Error adding shift:', error)
    return null
  }
}

// Update shift
export const updateShift = async (updatedShift) => {
  try {
    const shifts = await getShifts()

    // If isDefault is true, set all other shifts to not default
    if (updatedShift.isDefault) {
      shifts.forEach((shift) => {
        if (shift.id !== updatedShift.id) {
          shift.isDefault = false
        }
      })
    }

    const updatedShifts = shifts.map((shift) =>
      shift.id === updatedShift.id ? updatedShift : shift
    )
    await AsyncStorage.setItem(
      STORAGE_KEYS.SHIFT_LIST,
      JSON.stringify(updatedShifts)
    )
    return updatedShift
  } catch (error) {
    console.error('Error updating shift:', error)
    return null
  }
}

// Save shifts (for bulk operations)
export const saveShifts = async (shifts) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SHIFT_LIST, JSON.stringify(shifts))
    return true
  } catch (error) {
    console.error('Error saving shifts:', error)
    return false
  }
}

// Set current shift
export const setCurrentShift = async (shiftId) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_SHIFT, shiftId)
    return true
  } catch (error) {
    console.error('Error setting current shift:', error)
    return false
  }
}

// Delete shift
export const deleteShift = async (id) => {
  try {
    const shifts = await getShifts()
    const updatedShifts = shifts.filter((shift) => shift.id !== id)

    // If we deleted the default shift, set a new default
    if (
      shifts.find((shift) => shift.id === id && shift.isDefault) &&
      updatedShifts.length > 0
    ) {
      updatedShifts[0].isDefault = true
    }

    await AsyncStorage.setItem(
      STORAGE_KEYS.SHIFT_LIST,
      JSON.stringify(updatedShifts)
    )

    // If we deleted the current shift, clear the current shift
    const currentShiftId = await AsyncStorage.getItem(
      STORAGE_KEYS.CURRENT_SHIFT
    )
    if (currentShiftId === id) {
      await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_SHIFT)
    }

    return true
  } catch (error) {
    console.error('Error deleting shift:', error)
    return false
  }
}

// Add check-in record
export const addCheckInRecord = async (record) => {
  try {
    const checkInHistory = await getCheckInHistory()
    const newRecord = {
      id: Date.now().toString(),
      ...record,
    }
    const updatedHistory = [...checkInHistory, newRecord]
    await AsyncStorage.setItem(
      STORAGE_KEYS.ATTENDANCE_RECORDS,
      JSON.stringify(updatedHistory)
    )
    return newRecord
  } catch (error) {
    console.error('Error adding check-in record:', error)
    return null
  }
}

// Get notes
export const getNotes = async () => {
  try {
    console.log('Đang lấy dữ liệu ghi chú...')

    let notesJson
    try {
      notesJson = await AsyncStorage.getItem(STORAGE_KEYS.NOTES)
      console.log(
        'Kết quả đọc dữ liệu ghi chú:',
        notesJson ? 'Thành công' : 'Không có dữ liệu'
      )
    } catch (storageError) {
      console.error(
        'Lỗi khi đọc dữ liệu ghi chú từ AsyncStorage:',
        storageError
      )
      notesJson = null
    }

    if (notesJson) {
      try {
        const notes = JSON.parse(notesJson)
        console.log(`Đã tìm thấy ${notes.length} ghi chú`)
        return notes
      } catch (parseError) {
        console.error('Lỗi khi phân tích dữ liệu ghi chú:', parseError)
        // Nếu có lỗi khi parse, trả về mảng rỗng
      }
    }

    // Nếu không có dữ liệu hoặc có lỗi, khởi tạo mảng rỗng
    console.log('Không tìm thấy dữ liệu ghi chú, trả về mảng rỗng')

    // Thử khởi tạo dữ liệu ghi chú mẫu
    try {
      const { createSampleNotes } = require('./sampleNotes')
      await createSampleNotes()

      // Thử đọc lại sau khi tạo dữ liệu mẫu
      const newNotesJson = await AsyncStorage.getItem(STORAGE_KEYS.NOTES)
      if (newNotesJson) {
        const notes = JSON.parse(newNotesJson)
        console.log(`Đã tạo và đọc được ${notes.length} ghi chú mẫu`)
        return notes
      }
    } catch (sampleError) {
      console.error('Lỗi khi tạo dữ liệu ghi chú mẫu:', sampleError)
    }

    return []
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu ghi chú:', error)
    return []
  }
}

// Add note
export const addNote = async (noteData) => {
  try {
    const notesJson = await AsyncStorage.getItem(STORAGE_KEYS.NOTES)
    let notes = notesJson ? JSON.parse(notesJson) : []
    const newNote = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      title: noteData.title || '',
      content: noteData.content || '',
      reminderTime: noteData.reminderTime || null,
      linkedShifts: noteData.linkedShifts || [],
      reminderDays: noteData.reminderDays || [],
    }
    notes = [...notes, newNote]
    await AsyncStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes))
    return newNote
  } catch (error) {
    console.error('Error adding note:', error)
    return null
  }
}

// Update note
export const updateNote = async (updatedNote) => {
  try {
    const notesJson = await AsyncStorage.getItem(STORAGE_KEYS.NOTES)
    let notes = notesJson ? JSON.parse(notesJson) : []

    // Make sure to update the updatedAt timestamp
    const noteWithTimestamp = {
      ...updatedNote,
      updatedAt: new Date().toISOString(),
    }

    notes = notes.map((note) =>
      note.id === noteWithTimestamp.id ? noteWithTimestamp : note
    )
    await AsyncStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes))
    return noteWithTimestamp
  } catch (error) {
    console.error('Error updating note:', error)
    return null
  }
}

// Get note by ID
export const getNoteById = async (id) => {
  try {
    const notesJson = await AsyncStorage.getItem(STORAGE_KEYS.NOTES)
    if (!notesJson) return null

    const notes = JSON.parse(notesJson)
    return notes.find((note) => note.id === id) || null
  } catch (error) {
    console.error('Error getting note by ID:', error)
    return null
  }
}

// Delete note
export const deleteNote = async (id) => {
  try {
    const notesJson = await AsyncStorage.getItem(STORAGE_KEYS.NOTES)
    let notes = notesJson ? JSON.parse(notesJson) : []
    notes = notes.filter((note) => note.id !== id)
    await AsyncStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes))
    return true
  } catch (error) {
    console.error('Error deleting note:', error)
    return false
  }
}

// Check for duplicate note
export const checkDuplicateNote = async (title, content, excludeId = null) => {
  try {
    const notesJson = await AsyncStorage.getItem(STORAGE_KEYS.NOTES)
    if (!notesJson) return false

    const notes = JSON.parse(notesJson)
    return notes.some(
      (note) =>
        note.title === title &&
        note.content === content &&
        (excludeId === null || note.id !== excludeId)
    )
  } catch (error) {
    console.error('Error checking duplicate note:', error)
    return false
  }
}

// Save note
export const saveNote = async (note) => {
  try {
    const notes = await getNotes()

    // Check if note already exists
    const existingNoteIndex = notes.findIndex((n) => n.id === note.id)

    if (existingNoteIndex >= 0) {
      // Update existing note
      notes[existingNoteIndex] = {
        ...notes[existingNoteIndex],
        ...note,
        updatedAt: new Date().toISOString(),
      }
    } else {
      // Add new note
      notes.push({
        ...note,
        id: note.id || Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }

    await AsyncStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes))
    return note
  } catch (error) {
    console.error('Error saving note:', error)
    throw error
  }
}
