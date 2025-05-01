// Định dạng thứ viết tắt dựa trên ngôn ngữ
export const formatShortWeekday = (day, language = 'vi') => {
  // Bảng ánh xạ số ngày trong tuần sang viết tắt
  const dayMappingVi = {
    0: 'CN', // Chủ Nhật
    1: 'T2', // Thứ Hai
    2: 'T3', // Thứ Ba
    3: 'T4', // Thứ Tư
    4: 'T5', // Thứ Năm
    5: 'T6', // Thứ Sáu
    6: 'T7', // Thứ Bảy
  }

  const dayMappingEn = {
    0: 'Sun', // Sunday
    1: 'Mon', // Monday
    2: 'Tue', // Tuesday
    3: 'Wed', // Wednesday
    4: 'Thu', // Thursday
    5: 'Fri', // Friday
    6: 'Sat', // Saturday
  }

  // Chọn bảng ánh xạ dựa trên ngôn ngữ
  const mapping = language === 'en' ? dayMappingEn : dayMappingVi

  // Trả về thứ viết tắt
  return mapping[day] || ''
}

// Định dạng ngày tháng ngắn gọn (dd/mm hoặc mm/dd)
export const formatShortDate = (date, language = 'vi') => {
  if (!date) return ''

  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')

  // Nếu ngôn ngữ là tiếng Anh, hiển thị mm/dd, ngược lại hiển thị dd/mm
  return language === 'en' ? `${month}/${day}` : `${day}/${month}`
}

// Định dạng số giờ làm việc thành dạng thập phân
export const formatDecimalHours = (minutes) => {
  if (!minutes) return '0.0'

  // Chuyển đổi phút thành giờ dạng thập phân và làm tròn đến 1 chữ số thập phân
  const hours = (minutes / 60).toFixed(1)

  // Nếu phần thập phân là .0 thì bỏ đi
  return hours.endsWith('.0') ? hours.slice(0, -2) : hours
}

// Định dạng thời gian từ phút sang giờ:phút
export const formatDuration = (minutes) => {
  if (!minutes) return '0:00'

  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  return `${hours}:${mins.toString().padStart(2, '0')}`
}
