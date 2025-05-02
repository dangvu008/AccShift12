import AsyncStorage from '@react-native-async-storage/async-storage'
import { STORAGE_KEYS } from './constants'
import { Platform, Alert } from 'react-native'

/**
 * Kiểm tra và ghi log trạng thái AsyncStorage
 * @returns {Promise<void>}
 */
export const debugAsyncStorage = async () => {
  try {
    console.log('===== DEBUG ASYNC STORAGE =====')
    console.log('Platform:', Platform.OS)

    // Kiểm tra các key chính
    const keys = [
      STORAGE_KEYS.NOTES,
      STORAGE_KEYS.SHIFT_LIST,
      STORAGE_KEYS.CURRENT_SHIFT,
    ]

    for (const key of keys) {
      try {
        const value = await AsyncStorage.getItem(key)
        console.log(`Key: ${key}`)
        console.log(`- Exists: ${value !== null}`)
        if (value) {
          console.log(`- Length: ${value.length}`)
          try {
            const parsed = JSON.parse(value)
            console.log(`- Type: ${Array.isArray(parsed) ? 'Array' : 'Object'}`)
            console.log(
              `- Count: ${Array.isArray(parsed) ? parsed.length : 'N/A'}`
            )
          } catch (e) {
            console.log(`- Parse error: ${e.message}`)
          }
        }
      } catch (e) {
        console.log(`Error checking key ${key}: ${e.message}`)
      }
    }

    console.log('===== END DEBUG =====')
  } catch (e) {
    console.error('Debug error:', e)
  }
}

/**
 * Tạo dữ liệu mẫu cho phần ghi chú
 * @param {boolean} force Buộc tạo mới dữ liệu mẫu ngay cả khi đã có dữ liệu
 * @returns {Promise<boolean>} Kết quả tạo dữ liệu mẫu
 */
export const createSampleNotes = async (force = false) => {
  try {
    console.log('Bắt đầu tạo dữ liệu mẫu cho ghi chú...')
    console.log('Platform:', Platform.OS)
    console.log('Force mode:', force ? 'Bật' : 'Tắt')

    // Đánh dấu đã thử tạo dữ liệu mẫu
    try {
      await AsyncStorage.setItem('sample_notes_attempted', 'true')
    } catch (markError) {
      console.error('Lỗi khi đánh dấu đã thử tạo dữ liệu mẫu:', markError)
    }

    // Debug AsyncStorage trước khi bắt đầu
    await debugAsyncStorage()

    // Kiểm tra xem đã có ghi chú nào chưa
    let notesJson
    try {
      notesJson = await AsyncStorage.getItem(STORAGE_KEYS.NOTES)
      console.log(
        'Đã đọc dữ liệu ghi chú từ AsyncStorage:',
        notesJson ? 'Có dữ liệu' : 'Không có dữ liệu'
      )
      if (notesJson) {
        console.log('Độ dài dữ liệu ghi chú:', notesJson.length)
      }
    } catch (storageError) {
      console.error(
        'Lỗi khi đọc dữ liệu ghi chú từ AsyncStorage:',
        storageError
      )
      notesJson = null
    }

    let existingNotes = []
    if (notesJson) {
      try {
        existingNotes = JSON.parse(notesJson)
        console.log('Số lượng ghi chú hiện có:', existingNotes.length)
      } catch (parseError) {
        console.error('Lỗi khi parse dữ liệu ghi chú:', parseError)
        existingNotes = []
      }
    }

    // Nếu đã có ghi chú và không phải chế độ force, không tạo dữ liệu mẫu
    if (existingNotes.length > 0 && !force) {
      console.log('Đã có dữ liệu ghi chú, không tạo dữ liệu mẫu')
      return false
    }

    // Nếu ở chế độ force hoặc không có dữ liệu, xóa dữ liệu cũ trước (nếu có)
    if (force || existingNotes.length > 0) {
      console.log('Xóa dữ liệu ghi chú cũ trước khi tạo mới')
      try {
        await AsyncStorage.removeItem(STORAGE_KEYS.NOTES)
        console.log('Đã xóa dữ liệu ghi chú cũ')
      } catch (removeError) {
        console.error('Lỗi khi xóa dữ liệu ghi chú cũ:', removeError)
      }

      // Khởi tạo mảng rỗng
      try {
        await AsyncStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify([]))
        console.log('Đã khởi tạo mảng ghi chú rỗng')
      } catch (initError) {
        console.error('Lỗi khi khởi tạo mảng ghi chú rỗng:', initError)
      }
    }

    // Lấy danh sách ca làm việc để liên kết
    let shiftsJson
    try {
      shiftsJson = await AsyncStorage.getItem(STORAGE_KEYS.SHIFT_LIST)
      console.log(
        'Đã đọc dữ liệu ca làm việc từ AsyncStorage:',
        shiftsJson ? 'Có dữ liệu' : 'Không có dữ liệu'
      )
      if (shiftsJson) {
        console.log('Độ dài dữ liệu ca làm việc:', shiftsJson.length)
      }
    } catch (storageError) {
      console.error(
        'Lỗi khi đọc dữ liệu ca làm việc từ AsyncStorage:',
        storageError
      )
      shiftsJson = null
    }

    let shifts = []
    if (shiftsJson) {
      try {
        shifts = JSON.parse(shiftsJson)
        console.log('Số lượng ca làm việc đã đọc được:', shifts.length)
        if (shifts.length > 0) {
          console.log('ID ca làm việc đầu tiên:', shifts[0].id)
        }
      } catch (parseError) {
        console.error('Lỗi khi parse dữ liệu ca làm việc:', parseError)
        shifts = []
      }
    } else {
      console.log(
        'Không tìm thấy dữ liệu ca làm việc, sẽ tạo ghi chú không có liên kết'
      )
    }

    // Tạo ngày nhắc nhở trong tương lai
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(8, 0, 0, 0)

    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    nextWeek.setHours(9, 30, 0, 0)

    // Định dạng ngày nhắc nhở
    const formatDate = (date) => {
      const day = date.getDate().toString().padStart(2, '0')
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const year = date.getFullYear()
      const hours = date.getHours().toString().padStart(2, '0')
      const minutes = date.getMinutes().toString().padStart(2, '0')
      return `${day}/${month}/${year} ${hours}:${minutes}`
    }

    console.log('Tạo danh sách ghi chú mẫu...')

    // Tạo ID duy nhất cho mỗi ghi chú
    const baseTime = Date.now()

    // Tạo danh sách ghi chú mẫu
    const sampleNotes = [
      {
        id: `note_${baseTime}`,
        title: 'Họp nhóm dự án',
        content:
          'Chuẩn bị báo cáo tiến độ và các vấn đề phát sinh trong tuần. Nhớ mang theo tài liệu và laptop.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        reminderTime: formatDate(tomorrow),
        linkedShifts: shifts.length > 0 ? [shifts[0].id] : [],
        reminderDays: [],
        isAlarmEnabled: true,
        lastRemindedAt: null,
      },
      {
        id: `note_${baseTime + 1}`,
        title: 'Nộp báo cáo tháng',
        content:
          'Hoàn thiện báo cáo tháng và gửi cho quản lý trước 17h. Đảm bảo đã kiểm tra số liệu và định dạng.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        reminderTime: formatDate(nextWeek),
        linkedShifts: [],
        reminderDays: [],
        isAlarmEnabled: true,
        lastRemindedAt: null,
      },
      {
        id: `note_${baseTime + 2}`,
        title: 'Kiểm tra thiết bị',
        content:
          'Kiểm tra tình trạng các thiết bị trong phòng họp. Báo IT nếu có vấn đề với máy chiếu hoặc hệ thống âm thanh.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        reminderTime: null,
        linkedShifts: shifts.length > 1 ? [shifts[1].id] : [],
        reminderDays: ['T2', 'T4', 'T6'],
        isAlarmEnabled: true,
        lastRemindedAt: null,
      },
      {
        id: `note_${baseTime + 3}`,
        title: 'Đặt lịch khám sức khỏe định kỳ',
        content:
          'Liên hệ phòng nhân sự để đăng ký lịch khám sức khỏe định kỳ. Nhớ mang theo thẻ bảo hiểm và CMND.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        reminderTime: null,
        linkedShifts: shifts.length > 0 ? [shifts[0].id] : [],
        reminderDays: [],
        isAlarmEnabled: true,
        lastRemindedAt: null,
      },
      {
        id: `note_${baseTime + 4}`,
        title: 'Cập nhật phần mềm',
        content:
          'Cập nhật các phần mềm làm việc lên phiên bản mới nhất. Liên hệ IT nếu gặp vấn đề trong quá trình cập nhật.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        reminderTime: null,
        linkedShifts: [],
        reminderDays: ['T3', 'T5'],
        isAlarmEnabled: true,
        lastRemindedAt: null,
      },
    ]

    console.log(`Đã tạo ${sampleNotes.length} ghi chú mẫu`)

    // Lưu danh sách ghi chú mẫu vào AsyncStorage
    try {
      console.log('Bắt đầu lưu dữ liệu mẫu cho phần ghi chú...')
      const notesString = JSON.stringify(sampleNotes)
      console.log(
        'Dữ liệu ghi chú đã được chuyển thành chuỗi JSON, độ dài:',
        notesString.length
      )

      // Xác định phương pháp lưu trữ dựa trên nền tảng
      let saveSuccess = false

      // Trên thiết bị Android thật, luôn sử dụng phương pháp lưu từng ghi chú một
      let useIndividualSave =
        Platform.OS === 'android' && !Platform.constants?.isEmulator

      console.log(
        `Phương pháp lưu trữ: ${
          useIndividualSave ? 'Từng ghi chú một' : 'Tất cả cùng lúc'
        }`
      )

      if (!useIndividualSave) {
        // Phương pháp 1: Lưu tất cả cùng lúc (cho web và máy ảo)
        try {
          await AsyncStorage.setItem(STORAGE_KEYS.NOTES, notesString)
          console.log('Đã lưu tất cả ghi chú mẫu cùng lúc thành công')
          saveSuccess = true
        } catch (bulkSaveError) {
          console.error('Lỗi khi lưu tất cả ghi chú cùng lúc:', bulkSaveError)
          console.log('Thử phương pháp lưu từng ghi chú một...')
          useIndividualSave = true
        }
      }

      // Phương pháp 2: Lưu từng ghi chú một (cho Android thật hoặc khi phương pháp 1 thất bại)
      if (useIndividualSave && !saveSuccess) {
        try {
          // Đảm bảo mảng rỗng đã được khởi tạo
          await AsyncStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify([]))
          console.log('Đã khởi tạo mảng ghi chú rỗng')

          // Lưu từng ghi chú một với độ trễ nhỏ giữa các lần lưu
          for (let i = 0; i < sampleNotes.length; i++) {
            const note = sampleNotes[i]
            console.log(
              `Đang lưu ghi chú ${i + 1}/${sampleNotes.length}: ${note.title}`
            )

            // Đọc danh sách hiện tại
            const currentNotesJson = await AsyncStorage.getItem(
              STORAGE_KEYS.NOTES
            )
            const currentNotes = currentNotesJson
              ? JSON.parse(currentNotesJson)
              : []

            // Thêm ghi chú mới
            currentNotes.push(note)

            // Lưu lại
            await AsyncStorage.setItem(
              STORAGE_KEYS.NOTES,
              JSON.stringify(currentNotes)
            )
            console.log(`Đã lưu ghi chú ${i + 1}/${sampleNotes.length}`)

            // Thêm độ trễ nhỏ giữa các lần lưu để tránh quá tải AsyncStorage
            await new Promise((resolve) => setTimeout(resolve, 100))
          }

          console.log('Đã lưu tất cả ghi chú theo phương pháp từng ghi chú một')
          saveSuccess = true
        } catch (individualSaveError) {
          console.error('Lỗi khi lưu từng ghi chú một:', individualSaveError)

          // Thử phương pháp cuối cùng: Lưu ít ghi chú hơn
          try {
            console.log('Thử lưu ít ghi chú hơn (chỉ 2 ghi chú đầu tiên)...')
            await AsyncStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify([]))

            // Chỉ lưu 2 ghi chú đầu tiên
            const reducedNotes = sampleNotes.slice(0, 2)
            await AsyncStorage.setItem(
              STORAGE_KEYS.NOTES,
              JSON.stringify(reducedNotes)
            )
            console.log('Đã lưu 2 ghi chú đầu tiên thành công')
            saveSuccess = true
          } catch (reducedSaveError) {
            console.error('Lỗi khi lưu ít ghi chú hơn:', reducedSaveError)
          }
        }
      }

      if (!saveSuccess) {
        console.error('Không thể lưu ghi chú mẫu bằng tất cả các phương pháp')

        // Thử tạo một ghi chú đơn giản nhất
        try {
          const simpleNote = {
            id: `simple_note_${Date.now()}`,
            title: 'Ghi chú đơn giản',
            content:
              'Đây là ghi chú đơn giản được tạo lúc ' +
              new Date().toLocaleString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            reminderTime: null,
            linkedShifts: [],
            reminderDays: [],
            isAlarmEnabled: false,
            lastRemindedAt: null,
          }

          await AsyncStorage.setItem(
            STORAGE_KEYS.NOTES,
            JSON.stringify([simpleNote])
          )
          console.log('Đã tạo một ghi chú đơn giản nhất')
          saveSuccess = true
        } catch (simpleNoteError) {
          console.error('Lỗi khi tạo ghi chú đơn giản nhất:', simpleNoteError)
          return false
        }
      }

      // Kiểm tra lại xem dữ liệu đã được lưu chưa
      const checkNotesJson = await AsyncStorage.getItem(STORAGE_KEYS.NOTES)
      if (checkNotesJson) {
        console.log('Xác nhận dữ liệu ghi chú đã được lưu thành công')
        console.log('Độ dài dữ liệu đã lưu:', checkNotesJson.length)

        try {
          const parsedNotes = JSON.parse(checkNotesJson)
          console.log('Số lượng ghi chú đã lưu:', parsedNotes.length)

          // Debug lại AsyncStorage sau khi lưu
          await debugAsyncStorage()

          return true
        } catch (parseError) {
          console.error('Lỗi khi parse dữ liệu ghi chú đã lưu:', parseError)
        }
      } else {
        console.error('Dữ liệu ghi chú không được lưu thành công')
      }

      return saveSuccess
    } catch (saveError) {
      console.error('Lỗi khi lưu dữ liệu mẫu cho phần ghi chú:', saveError)
      return false
    }
  } catch (error) {
    console.error('Lỗi khi tạo dữ liệu mẫu cho phần ghi chú:', error)
    return false
  }
}

/**
 * Xóa tất cả ghi chú
 * @returns {Promise<boolean>} Kết quả xóa
 */
export const clearAllNotes = async () => {
  try {
    console.log('Bắt đầu xóa tất cả ghi chú...')
    console.log('Platform:', Platform.OS)

    // Debug trước khi xóa
    await debugAsyncStorage()

    try {
      await AsyncStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify([]))
      console.log('Đã xóa tất cả ghi chú')
    } catch (setError) {
      console.error('Lỗi khi xóa bằng setItem:', setError)

      // Thử phương pháp khác nếu setItem thất bại
      try {
        await AsyncStorage.removeItem(STORAGE_KEYS.NOTES)
        console.log('Đã xóa tất cả ghi chú bằng removeItem')
      } catch (removeError) {
        console.error('Lỗi khi xóa bằng removeItem:', removeError)
        return false
      }
    }

    // Debug sau khi xóa
    await debugAsyncStorage()

    return true
  } catch (error) {
    console.error('Lỗi khi xóa tất cả ghi chú:', error)
    return false
  }
}

/**
 * Tạo một ghi chú đơn giản để kiểm tra
 * @returns {Promise<boolean>} Kết quả tạo ghi chú
 */
export const createTestNote = async () => {
  try {
    console.log('Tạo ghi chú kiểm tra đơn giản...')
    console.log('Platform:', Platform.OS)

    const testNote = {
      id: `test_note_${Date.now()}`,
      title: 'Ghi chú kiểm tra',
      content:
        'Đây là ghi chú kiểm tra được tạo lúc ' + new Date().toLocaleString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reminderTime: null,
      linkedShifts: [],
      reminderDays: [],
      isAlarmEnabled: false,
      lastRemindedAt: null,
    }

    // Kiểm tra xem đã có ghi chú nào chưa
    let saveSuccess = false

    // Phương pháp 1: Đọc danh sách hiện tại và thêm vào
    try {
      // Đọc danh sách hiện tại
      let notes = []
      const notesJson = await AsyncStorage.getItem(STORAGE_KEYS.NOTES)
      if (notesJson) {
        notes = JSON.parse(notesJson)
        console.log('Đã đọc được', notes.length, 'ghi chú hiện có')
      } else {
        console.log('Không tìm thấy ghi chú hiện có, tạo mảng mới')
      }

      // Thêm ghi chú mới
      notes.push(testNote)

      // Lưu lại
      await AsyncStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes))
      console.log('Đã lưu ghi chú kiểm tra thành công (phương pháp 1)')
      saveSuccess = true
    } catch (method1Error) {
      console.error(
        'Lỗi khi lưu ghi chú kiểm tra (phương pháp 1):',
        method1Error
      )

      // Phương pháp 2: Tạo mới hoàn toàn
      try {
        console.log('Thử phương pháp 2: Tạo mới hoàn toàn')
        await AsyncStorage.setItem(
          STORAGE_KEYS.NOTES,
          JSON.stringify([testNote])
        )
        console.log('Đã lưu ghi chú kiểm tra thành công (phương pháp 2)')
        saveSuccess = true
      } catch (method2Error) {
        console.error(
          'Lỗi khi lưu ghi chú kiểm tra (phương pháp 2):',
          method2Error
        )
      }
    }

    // Kiểm tra lại xem dữ liệu đã được lưu chưa
    if (saveSuccess) {
      try {
        const checkNotesJson = await AsyncStorage.getItem(STORAGE_KEYS.NOTES)
        if (checkNotesJson) {
          const parsedNotes = JSON.parse(checkNotesJson)
          console.log(
            'Kiểm tra lại: Đã lưu được',
            parsedNotes.length,
            'ghi chú'
          )
          return true
        } else {
          console.error('Kiểm tra lại: Không tìm thấy dữ liệu ghi chú')
        }
      } catch (checkError) {
        console.error('Lỗi khi kiểm tra lại dữ liệu ghi chú:', checkError)
      }
    }

    return saveSuccess
  } catch (error) {
    console.error('Lỗi khi tạo ghi chú kiểm tra:', error)
    return false
  }
}

export default {
  createSampleNotes,
  clearAllNotes,
  createTestNote,
  debugAsyncStorage,
}
