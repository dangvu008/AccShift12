import { createSampleNotes } from '../utils/sampleNotes'

/**
 * Script khởi tạo dữ liệu mẫu cho ứng dụng
 */
const initSampleData = async () => {
  try {
    console.log('Bắt đầu khởi tạo dữ liệu mẫu...')
    
    // Khởi tạo dữ liệu mẫu cho ghi chú
    const notesResult = await createSampleNotes()
    console.log('Kết quả khởi tạo ghi chú mẫu:', notesResult ? 'Thành công' : 'Không cần thiết')
    
    console.log('Hoàn thành khởi tạo dữ liệu mẫu')
  } catch (error) {
    console.error('Lỗi khi khởi tạo dữ liệu mẫu:', error)
  }
}

// Chạy script
initSampleData()
