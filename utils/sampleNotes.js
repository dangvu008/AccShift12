import AsyncStorage from '@react-native-async-storage/async-storage'
import { STORAGE_KEYS } from './constants'

/**
 * Tạo dữ liệu mẫu cho phần ghi chú
 * @returns {Promise<boolean>} Kết quả tạo dữ liệu mẫu
 */
export const createSampleNotes = async () => {
  try {
    // Kiểm tra xem đã có ghi chú nào chưa
    const notesJson = await AsyncStorage.getItem(STORAGE_KEYS.NOTES)
    const existingNotes = notesJson ? JSON.parse(notesJson) : []

    // Nếu đã có ghi chú, không tạo dữ liệu mẫu
    if (existingNotes.length > 0) {
      console.log('Đã có dữ liệu ghi chú, không tạo dữ liệu mẫu')
      return false
    }

    // Lấy danh sách ca làm việc để liên kết
    const shiftsJson = await AsyncStorage.getItem(STORAGE_KEYS.SHIFT_LIST)
    const shifts = shiftsJson ? JSON.parse(shiftsJson) : []

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

    // Tạo danh sách ghi chú mẫu
    const sampleNotes = [
      {
        id: `note_${Date.now()}`,
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
        id: `note_${Date.now() + 1}`,
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
        id: `note_${Date.now() + 2}`,
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
        id: `note_${Date.now() + 3}`,
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
        id: `note_${Date.now() + 4}`,
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

    // Lưu danh sách ghi chú mẫu vào AsyncStorage
    await AsyncStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(sampleNotes))
    console.log('Đã tạo dữ liệu mẫu cho phần ghi chú')
    return true
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
    await AsyncStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify([]))
    console.log('Đã xóa tất cả ghi chú')
    return true
  } catch (error) {
    console.error('Lỗi khi xóa tất cả ghi chú:', error)
    return false
  }
}

export default {
  createSampleNotes,
  clearAllNotes,
}
