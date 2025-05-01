/**
 * Các hàm tiện ích để thực hiện các phép toán trên khoảng thời gian
 */

/**
 * Kiểm tra xem một thời điểm có nằm trong khoảng thời gian hay không
 * @param {Date} time Thời điểm cần kiểm tra
 * @param {Object} interval Khoảng thời gian {start: Date, end: Date}
 * @returns {boolean} true nếu thời điểm nằm trong khoảng thời gian
 */
export const isTimeInInterval = (time, interval) => {
  if (!time || !interval || !interval.start || !interval.end) return false
  return time >= interval.start && time <= interval.end
}

/**
 * Tìm phần giao của hai khoảng thời gian
 * @param {Object} interval1 Khoảng thời gian thứ nhất {start: Date, end: Date}
 * @param {Object} interval2 Khoảng thời gian thứ hai {start: Date, end: Date}
 * @returns {Object|null} Khoảng thời gian giao nhau hoặc null nếu không giao nhau
 */
export const intersection = (interval1, interval2) => {
  if (
    !interval1 ||
    !interval2 ||
    !interval1.start ||
    !interval1.end ||
    !interval2.start ||
    !interval2.end
  )
    return null

  const start = new Date(
    Math.max(interval1.start.getTime(), interval2.start.getTime())
  )
  const end = new Date(
    Math.min(interval1.end.getTime(), interval2.end.getTime())
  )

  if (start > end) return null

  return { start, end }
}

/**
 * Tìm phần chênh lệch của khoảng thời gian thứ nhất so với khoảng thời gian thứ hai
 * @param {Object} interval1 Khoảng thời gian thứ nhất {start: Date, end: Date}
 * @param {Object} interval2 Khoảng thời gian thứ hai {start: Date, end: Date}
 * @returns {Array} Mảng các khoảng thời gian chênh lệch
 */
export const difference = (interval1, interval2) => {
  if (
    !interval1 ||
    !interval1.start ||
    !interval1.end
  )
    return []

  if (
    !interval2 ||
    !interval2.start ||
    !interval2.end
  )
    return [interval1]

  const result = []

  // Phần trước interval2
  if (interval1.start < interval2.start) {
    const beforeEnd = new Date(Math.min(interval1.end.getTime(), interval2.start.getTime()))
    if (interval1.start < beforeEnd) {
      result.push({
        start: new Date(interval1.start),
        end: beforeEnd
      })
    }
  }

  // Phần sau interval2
  if (interval1.end > interval2.end) {
    const afterStart = new Date(Math.max(interval1.start.getTime(), interval2.end.getTime()))
    if (afterStart < interval1.end) {
      result.push({
        start: afterStart,
        end: new Date(interval1.end)
      })
    }
  }

  return result
}

/**
 * Tính thời lượng của một khoảng thời gian theo giờ
 * @param {Object} interval Khoảng thời gian {start: Date, end: Date}
 * @returns {number} Thời lượng tính bằng giờ
 */
export const durationInHours = (interval) => {
  if (!interval || !interval.start || !interval.end) return 0
  const durationMs = interval.end.getTime() - interval.start.getTime()
  return durationMs / (1000 * 60 * 60)
}

/**
 * Tính tổng thời lượng của một mảng các khoảng thời gian theo giờ
 * @param {Array} intervals Mảng các khoảng thời gian
 * @returns {number} Tổng thời lượng tính bằng giờ
 */
export const sumDurationInHours = (intervals) => {
  if (!intervals || !Array.isArray(intervals)) return 0
  return intervals.reduce((sum, interval) => sum + durationInHours(interval), 0)
}

/**
 * Tạo khoảng thời gian làm đêm cho một ngày cụ thể
 * @param {Date} baseDate Ngày cơ sở
 * @param {string} nightStartTime Thời gian bắt đầu ca đêm (định dạng HH:MM)
 * @param {string} nightEndTime Thời gian kết thúc ca đêm (định dạng HH:MM)
 * @returns {Object} Khoảng thời gian làm đêm
 */
export const createNightInterval = (baseDate, nightStartTime, nightEndTime) => {
  if (!baseDate || !nightStartTime || !nightEndTime) return null

  const [startHour, startMinute] = nightStartTime.split(':').map(Number)
  const [endHour, endMinute] = nightEndTime.split(':').map(Number)

  const nightStart = new Date(baseDate)
  nightStart.setHours(startHour, startMinute, 0, 0)

  const nightEnd = new Date(baseDate)
  nightEnd.setHours(endHour, endMinute, 0, 0)

  // Nếu thời gian kết thúc ca đêm nhỏ hơn thời gian bắt đầu, đó là ca qua đêm
  if (nightEnd < nightStart) {
    nightEnd.setDate(nightEnd.getDate() + 1)
  }

  return { start: nightStart, end: nightEnd }
}
