import { WORK_STATUS } from '../config/appConfig'
import { storage } from './storage'
import { formatDate } from './helpers'

/**
 * Kiểm tra xem một thời điểm có nằm trong khoảng thời gian làm đêm hay không
 * @param {Date} time Thời điểm cần kiểm tra
 * @param {string} nightStartTime Thời gian bắt đầu ca đêm (định dạng HH:MM)
 * @param {string} nightEndTime Thời gian kết thúc ca đêm (định dạng HH:MM)
 * @returns {boolean} true nếu thời điểm nằm trong khoảng thời gian làm đêm
 */
const isNightTime = (time, nightStartTime, nightEndTime) => {
  // Parse thời gian bắt đầu và kết thúc ca đêm
  const [startHour, startMinute] = nightStartTime.split(':').map(Number)
  const [endHour, endMinute] = nightEndTime.split(':').map(Number)

  // Tạo đối tượng Date cho thời gian bắt đầu và kết thúc ca đêm
  const nightStart = new Date(time)
  nightStart.setHours(startHour, startMinute, 0, 0)

  const nightEnd = new Date(time)
  nightEnd.setHours(endHour, endMinute, 0, 0)

  // Nếu thời gian kết thúc ca đêm nhỏ hơn thời gian bắt đầu, đó là ca qua đêm
  if (nightEnd < nightStart) {
    nightEnd.setDate(nightEnd.getDate() + 1)
  }

  // Kiểm tra xem thời điểm có nằm trong khoảng thời gian làm đêm hay không
  if (time >= nightStart && time <= nightEnd) {
    return true
  }

  // Trường hợp đặc biệt: nếu thời điểm nằm sau 0h và trước thời gian kết thúc ca đêm
  const timeHour = time.getHours()
  const timeMinute = time.getMinutes()
  if (endHour < startHour && timeHour < endHour) {
    const compareTime = new Date(time)
    compareTime.setHours(endHour, endMinute, 0, 0)
    return time <= compareTime
  }

  return false
}

/**
 * Tính toán phần thời gian làm đêm trong một khoảng thời gian
 * @param {Date} startTime Thời gian bắt đầu
 * @param {Date} endTime Thời gian kết thúc
 * @param {string} nightStartTime Thời gian bắt đầu ca đêm (định dạng HH:MM)
 * @param {string} nightEndTime Thời gian kết thúc ca đêm (định dạng HH:MM)
 * @returns {number} Số phút làm đêm
 */
const calculateNightWorkMinutes = (
  startTime,
  endTime,
  nightStartTime,
  nightEndTime
) => {
  if (!startTime || !endTime) return 0

  // Parse thời gian bắt đầu và kết thúc ca đêm
  const [startHour, startMinute] = nightStartTime.split(':').map(Number)
  const [endHour, endMinute] = nightEndTime.split(':').map(Number)

  // Tạo đối tượng Date cho thời gian bắt đầu và kết thúc ca đêm trong ngày bắt đầu
  const nightStartDay1 = new Date(startTime)
  nightStartDay1.setHours(startHour, startMinute, 0, 0)

  const nightEndDay1 = new Date(startTime)
  nightEndDay1.setHours(endHour, endMinute, 0, 0)

  // Nếu thời gian kết thúc ca đêm nhỏ hơn thời gian bắt đầu, đó là ca qua đêm
  if (nightEndDay1 < nightStartDay1) {
    nightEndDay1.setDate(nightEndDay1.getDate() + 1)
  }

  // Tạo đối tượng Date cho thời gian bắt đầu và kết thúc ca đêm trong ngày tiếp theo
  const nightStartDay2 = new Date(nightStartDay1)
  nightStartDay2.setDate(nightStartDay2.getDate() + 1)

  const nightEndDay2 = new Date(nightEndDay1)
  nightEndDay2.setDate(nightEndDay2.getDate() + 1)

  // Tính toán thời gian làm đêm
  let nightMinutes = 0

  // Kiểm tra xem khoảng thời gian có giao với ca đêm ngày đầu tiên không
  if (startTime <= nightEndDay1 && endTime >= nightStartDay1) {
    const overlapStart = startTime > nightStartDay1 ? startTime : nightStartDay1
    const overlapEnd = endTime < nightEndDay1 ? endTime : nightEndDay1

    const overlapMs = overlapEnd.getTime() - overlapStart.getTime()
    nightMinutes += Math.max(0, Math.floor(overlapMs / (1000 * 60)))
  }

  // Kiểm tra xem khoảng thời gian có giao với ca đêm ngày tiếp theo không
  if (startTime <= nightEndDay2 && endTime >= nightStartDay2) {
    const overlapStart = startTime > nightStartDay2 ? startTime : nightStartDay2
    const overlapEnd = endTime < nightEndDay2 ? endTime : nightEndDay2

    const overlapMs = overlapEnd.getTime() - overlapStart.getTime()
    nightMinutes += Math.max(0, Math.floor(overlapMs / (1000 * 60)))
  }

  return nightMinutes
}

/**
 * Tính toán trạng thái làm việc cho một ngày cụ thể
 * @param {string} date Ngày cần tính toán (định dạng YYYY-MM-DD)
 * @param {Object} shift Ca làm việc áp dụng
 * @returns {Promise<Object>} Trạng thái làm việc đã tính toán
 */
export const calculateDailyWorkStatus = async (date, shift) => {
  try {
    // Lấy log chấm công của ngày
    const logs = await storage.getAttendanceLogs(date)

    // Nếu không có log nào, trả về trạng thái chưa cập nhật
    if (!logs || logs.length === 0) {
      return {
        date,
        status: WORK_STATUS.CHUA_CAP_NHAT,
        shiftId: shift?.id,
        shiftName: shift?.name,
        checkInTime: null,
        checkOutTime: null,
        workMinutes: 0,
        breakMinutes: shift?.breakMinutes || 0,
        otMinutes: 0,
        lateMinutes: 0,
        earlyMinutes: 0,
        isManuallyUpdated: false,
        calculatedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }

    // Tìm log check-in và check-out
    const goWorkLog = logs.find((log) => log.type === 'go_work')
    const checkInLog = logs.find((log) => log.type === 'check_in')
    const checkOutLog = logs.find((log) => log.type === 'check_out')
    const completeLog = logs.find((log) => log.type === 'complete')

    // Thời gian check-in và check-out
    const checkInTime = checkInLog ? new Date(checkInLog.timestamp) : null
    const checkOutTime = checkOutLog ? new Date(checkOutLog.timestamp) : null

    // Khởi tạo trạng thái mặc định
    let status = WORK_STATUS.CHUA_CAP_NHAT
    let workMinutes = 0
    let otMinutes = 0
    let lateMinutes = 0
    let earlyMinutes = 0

    // Hàm tính toán thời gian làm việc từ thời gian bắt đầu và kết thúc ca
    const calculateWorkTimeFromShift = (shift, baseDate) => {
      if (!shift)
        return {
          workMinutes: 0,
          otMinutes: 0,
          lateMinutes: 0,
          earlyMinutes: 0,
          status: WORK_STATUS.DU_CONG,
        }

      // Parse thời gian ca làm việc
      const [startHour, startMinute] = shift.startTime.split(':').map(Number)
      const [endHour, endMinute] = shift.officeEndTime.split(':').map(Number)

      // Tạo đối tượng Date cho thời gian bắt đầu và kết thúc ca
      const shiftStartTime = new Date(baseDate)
      shiftStartTime.setHours(startHour, startMinute, 0, 0)

      const shiftEndTime = new Date(baseDate)
      shiftEndTime.setHours(endHour, endMinute, 0, 0)

      // Nếu thời gian kết thúc ca nhỏ hơn thời gian bắt đầu, đó là ca qua đêm
      if (shiftEndTime < shiftStartTime) {
        shiftEndTime.setDate(shiftEndTime.getDate() + 1)
      }

      // Tính thời gian ca làm việc chuẩn (phút)
      const shiftDurationMs = shiftEndTime.getTime() - shiftStartTime.getTime()
      const shiftDurationMinutes = Math.floor(shiftDurationMs / (1000 * 60))

      // Trừ thời gian nghỉ
      const breakMinutes = shift?.breakMinutes || 0
      const workMinutes = Math.max(0, shiftDurationMinutes - breakMinutes)

      return {
        workMinutes,
        otMinutes: 0,
        lateMinutes: 0,
        earlyMinutes: 0,
        status: WORK_STATUS.DU_CONG,
        shiftStartTime,
        shiftEndTime,
      }
    }

    // Nếu có log go_work (bất kể chế độ nào), luôn tính thời gian làm việc từ ca
    if (goWorkLog) {
      const baseDate = new Date(goWorkLog.timestamp)
      const shiftTimes = calculateWorkTimeFromShift(shift, baseDate)

      // Cập nhật các giá trị
      workMinutes = shiftTimes.workMinutes
      otMinutes = shiftTimes.otMinutes
      lateMinutes = shiftTimes.lateMinutes
      earlyMinutes = shiftTimes.earlyMinutes
      status = shiftTimes.status

      // Nếu có cả check-in và check-out, chỉ sử dụng để tính OT và trạng thái đi muộn/về sớm
      if (checkInTime && checkOutTime && shift) {
        const shiftStartTime = shiftTimes.shiftStartTime
        const shiftEndTime = shiftTimes.shiftEndTime

        // Kiểm tra đi muộn
        if (checkInTime > shiftStartTime) {
          const lateMs = checkInTime.getTime() - shiftStartTime.getTime()
          lateMinutes = Math.floor(lateMs / (1000 * 60))

          // Làm tròn phút phạt
          if (shift.penaltyRoundingMinutes > 0) {
            lateMinutes =
              Math.ceil(lateMinutes / shift.penaltyRoundingMinutes) *
              shift.penaltyRoundingMinutes
          }
        }

        // Kiểm tra về sớm
        if (checkOutTime < shiftEndTime) {
          const earlyMs = shiftEndTime.getTime() - checkOutTime.getTime()
          earlyMinutes = Math.floor(earlyMs / (1000 * 60))

          // Làm tròn phút phạt
          if (shift.penaltyRoundingMinutes > 0) {
            earlyMinutes =
              Math.ceil(earlyMinutes / shift.penaltyRoundingMinutes) *
              shift.penaltyRoundingMinutes
          }
        }

        // Tính thời gian OT
        if (shift.endTime && shift.endTime !== shift.officeEndTime) {
          const [maxEndHour, maxEndMinute] = shift.endTime
            .split(':')
            .map(Number)

          const maxEndTime = new Date(checkInTime)
          maxEndTime.setHours(maxEndHour, maxEndMinute, 0, 0)

          // Nếu thời gian kết thúc tối đa nhỏ hơn thời gian bắt đầu, đó là ca qua đêm
          if (maxEndTime < shiftStartTime) {
            maxEndTime.setDate(maxEndTime.getDate() + 1)
          }

          // Nếu check-out sau thời gian kết thúc ca chuẩn, tính OT
          if (checkOutTime > shiftEndTime) {
            // Giới hạn thời gian OT đến thời gian kết thúc tối đa
            const otEndTime =
              checkOutTime < maxEndTime ? checkOutTime : maxEndTime

            const otMs = otEndTime.getTime() - shiftEndTime.getTime()
            otMinutes = Math.floor(otMs / (1000 * 60))
          }
        }

        // Xác định trạng thái
        if (lateMinutes > 0 && earlyMinutes > 0) {
          status = WORK_STATUS.DI_MUON_VE_SOM
        } else if (lateMinutes > 0) {
          status = WORK_STATUS.DI_MUON
        } else if (earlyMinutes > 0) {
          status = WORK_STATUS.VE_SOM
        } else {
          status = WORK_STATUS.DU_CONG
        }
      }
    } else if (checkInTime && checkOutTime) {
      // Trường hợp không có go_work nhưng có cả check-in và check-out
      // Tính thời gian làm việc (phút)
      const workDurationMs = checkOutTime.getTime() - checkInTime.getTime()
      workMinutes = Math.floor(workDurationMs / (1000 * 60))

      // Trừ thời gian nghỉ
      const breakMinutes = shift?.breakMinutes || 0
      workMinutes = Math.max(0, workMinutes - breakMinutes)

      // Nếu có thông tin ca làm việc, tính toán chi tiết hơn
      if (shift) {
        // Parse thời gian ca làm việc
        const [startHour, startMinute] = shift.startTime.split(':').map(Number)
        const [endHour, endMinute] = shift.officeEndTime.split(':').map(Number)

        // Tạo đối tượng Date cho thời gian bắt đầu và kết thúc ca
        const shiftStartTime = new Date(checkInTime)
        shiftStartTime.setHours(startHour, startMinute, 0, 0)

        const shiftEndTime = new Date(checkInTime)
        shiftEndTime.setHours(endHour, endMinute, 0, 0)

        // Nếu thời gian kết thúc ca nhỏ hơn thời gian bắt đầu, đó là ca qua đêm
        if (shiftEndTime < shiftStartTime) {
          shiftEndTime.setDate(shiftEndTime.getDate() + 1)
        }

        // Tính thời gian ca làm việc chuẩn (phút)
        const shiftDurationMs =
          shiftEndTime.getTime() - shiftStartTime.getTime()
        const shiftDurationMinutes = Math.floor(shiftDurationMs / (1000 * 60))

        // Sử dụng thời gian ca làm việc chuẩn thay vì thời gian thực tế
        workMinutes = Math.max(0, shiftDurationMinutes - breakMinutes)

        // Kiểm tra đi muộn
        if (checkInTime > shiftStartTime) {
          const lateMs = checkInTime.getTime() - shiftStartTime.getTime()
          lateMinutes = Math.floor(lateMs / (1000 * 60))

          // Làm tròn phút phạt
          if (shift.penaltyRoundingMinutes > 0) {
            lateMinutes =
              Math.ceil(lateMinutes / shift.penaltyRoundingMinutes) *
              shift.penaltyRoundingMinutes
          }
        }

        // Kiểm tra về sớm
        if (checkOutTime < shiftEndTime) {
          const earlyMs = shiftEndTime.getTime() - checkOutTime.getTime()
          earlyMinutes = Math.floor(earlyMs / (1000 * 60))

          // Làm tròn phút phạt
          if (shift.penaltyRoundingMinutes > 0) {
            earlyMinutes =
              Math.ceil(earlyMinutes / shift.penaltyRoundingMinutes) *
              shift.penaltyRoundingMinutes
          }
        }

        // Tính thời gian OT
        if (shift.endTime && shift.endTime !== shift.officeEndTime) {
          const [maxEndHour, maxEndMinute] = shift.endTime
            .split(':')
            .map(Number)

          const maxEndTime = new Date(checkInTime)
          maxEndTime.setHours(maxEndHour, maxEndMinute, 0, 0)

          // Nếu thời gian kết thúc tối đa nhỏ hơn thời gian bắt đầu, đó là ca qua đêm
          if (maxEndTime < shiftStartTime) {
            maxEndTime.setDate(maxEndTime.getDate() + 1)
          }

          // Nếu check-out sau thời gian kết thúc ca chuẩn, tính OT
          if (checkOutTime > shiftEndTime) {
            // Giới hạn thời gian OT đến thời gian kết thúc tối đa
            const otEndTime =
              checkOutTime < maxEndTime ? checkOutTime : maxEndTime

            const otMs = otEndTime.getTime() - shiftEndTime.getTime()
            otMinutes = Math.floor(otMs / (1000 * 60))
          }
        }

        // Xác định trạng thái
        if (lateMinutes > 0 && earlyMinutes > 0) {
          status = WORK_STATUS.DI_MUON_VE_SOM
        } else if (lateMinutes > 0) {
          status = WORK_STATUS.DI_MUON
        } else if (earlyMinutes > 0) {
          status = WORK_STATUS.VE_SOM
        } else {
          status = WORK_STATUS.DU_CONG
        }
      } else {
        // Không có thông tin ca làm việc, mặc định là đủ công
        status = WORK_STATUS.DU_CONG
      }
    } else if (checkInTime && !checkOutTime) {
      // Có check-in nhưng không có check-out

      // Kiểm tra xem đã qua thời gian dài chưa (> 16 giờ)
      const now = new Date()
      const timeSinceCheckIn = now.getTime() - checkInTime.getTime()
      const hoursSinceCheckIn = timeSinceCheckIn / (1000 * 60 * 60)

      if (hoursSinceCheckIn > 16) {
        // Đã qua 16 giờ, có thể quên check-out
        status = WORK_STATUS.QUEN_CHECK_OUT
      } else {
        // Chưa qua 16 giờ, thiếu log
        status = WORK_STATUS.THIEU_LOG
      }
    }

    // Lấy cài đặt người dùng
    const userSettings = await storage.getUserSettings()

    // Tính toán phân loại OT theo ngưỡng
    let otHoursByRate = {}
    let standardHoursNightPortionActual = 0
    let otHoursNightPortion = 0

    // Xác định loại ngày (thường, thứ 7, chủ nhật, lễ)
    const dayOfWeek = new Date(date).getDay() // 0: CN, 1-5: T2-T6, 6: T7
    let dayType = 'weekday' // Mặc định là ngày thường
    if (dayOfWeek === 0) dayType = 'sunday'
    else if (dayOfWeek === 6) dayType = 'saturday'
    // Ghi chú: Chưa có logic xác định ngày lễ, cần bổ sung sau

    // Xác định tỷ lệ OT cơ bản dựa trên loại ngày và cài đặt người dùng
    let baseOtRate = userSettings?.otRateWeekday || 150 // Mặc định 150% cho ngày thường
    if (dayType === 'saturday') baseOtRate = userSettings?.otRateSaturday || 200
    else if (dayType === 'sunday')
      baseOtRate = userSettings?.otRateSunday || 200
    else if (dayType === 'holiday')
      baseOtRate = userSettings?.otRateHoliday || 300

    // Tính toán OT theo ngưỡng nếu được bật
    if (userSettings?.otThresholdEnabled && otMinutes > 0) {
      // Chuyển đổi từ phút sang giờ
      const otHours = otMinutes / 60
      const thresholdHours = userSettings.otThresholdHours || 2

      // Xác định tỷ lệ OT bậc 2 dựa trên loại ngày
      let tier2Rate = userSettings.otRateWeekdayTier2 || 200
      if (dayType === 'saturday')
        tier2Rate = userSettings.otRateSaturdayTier2 || 250
      else if (dayType === 'sunday')
        tier2Rate = userSettings.otRateSundayTier2 || 250
      else if (dayType === 'holiday')
        tier2Rate = userSettings.otRateHolidayTier2 || 350

      // Phân loại OT theo ngưỡng
      if (otHours <= thresholdHours) {
        // Tất cả OT nằm trong ngưỡng 1
        otHoursByRate[baseOtRate] = otHours
      } else {
        // Phân chia OT vào các ngưỡng
        otHoursByRate[baseOtRate] = thresholdHours
        otHoursByRate[tier2Rate] = otHours - thresholdHours
      }
    } else {
      // Không áp dụng ngưỡng OT, tất cả OT có cùng tỷ lệ
      otHoursByRate[baseOtRate] = otMinutes / 60
    }

    // Tính toán giờ làm đêm nếu được bật
    if (userSettings?.nightWorkEnabled && checkInTime && checkOutTime) {
      const nightStartTime = userSettings.nightWorkStartTime || '22:00'
      const nightEndTime = userSettings.nightWorkEndTime || '05:00'

      // Tính phần giờ chuẩn làm đêm
      if (shift) {
        const [startHour, startMinute] = shift.startTime.split(':').map(Number)
        const [endHour, endMinute] = shift.officeEndTime.split(':').map(Number)

        const shiftStartTime = new Date(checkInTime)
        shiftStartTime.setHours(startHour, startMinute, 0, 0)

        const shiftEndTime = new Date(checkInTime)
        shiftEndTime.setHours(endHour, endMinute, 0, 0)

        // Nếu thời gian kết thúc ca nhỏ hơn thời gian bắt đầu, đó là ca qua đêm
        if (shiftEndTime < shiftStartTime) {
          shiftEndTime.setDate(shiftEndTime.getDate() + 1)
        }

        // Tính phần giờ chuẩn làm đêm
        standardHoursNightPortionActual =
          calculateNightWorkMinutes(
            shiftStartTime,
            shiftEndTime,
            nightStartTime,
            nightEndTime
          ) / 60 // Chuyển từ phút sang giờ
      }

      // Tính phần giờ OT làm đêm
      if (otMinutes > 0) {
        const [endHour, endMinute] = shift.officeEndTime.split(':').map(Number)
        const shiftEndTime = new Date(checkInTime)
        shiftEndTime.setHours(endHour, endMinute, 0, 0)

        // Nếu thời gian kết thúc ca nhỏ hơn thời gian bắt đầu, đó là ca qua đêm
        if (shiftEndTime > checkInTime) {
          shiftEndTime.setDate(shiftEndTime.getDate() + 1)
        }

        otHoursNightPortion =
          calculateNightWorkMinutes(
            shiftEndTime,
            checkOutTime,
            nightStartTime,
            nightEndTime
          ) / 60 // Chuyển từ phút sang giờ
      }
    }

    // Phân loại chi tiết giờ làm việc vào các bucket cố định
    const standardHours = workMinutes / 60
    const standardDayHours = standardHours - standardHoursNightPortionActual
    const otHours = otMinutes / 60
    const otDayHours = otHours - otHoursNightPortion

    // Khởi tạo các bucket giờ làm việc
    let standardDayHoursActual = standardDayHours
    let standardNightHoursActual = standardHoursNightPortionActual
    let otWeekdayDayHours = 0
    let otWeekdayNightHours = 0
    let otWeekendDayHours = 0
    let otWeekendNightHours = 0
    let otHolidayDayHours = 0
    let otHolidayNightHours = 0

    // Phân bổ giờ OT vào các bucket tương ứng
    if (dayType === 'weekday') {
      otWeekdayDayHours = otDayHours
      otWeekdayNightHours = otHoursNightPortion
    } else if (dayType === 'saturday' || dayType === 'sunday') {
      otWeekendDayHours = otDayHours
      otWeekendNightHours = otHoursNightPortion
    } else if (dayType === 'holiday') {
      otHolidayDayHours = otDayHours
      otHolidayNightHours = otHoursNightPortion
    }

    // Tính toán tỷ lệ cho giờ làm đêm dựa trên quy tắc tính lương đêm
    let standardNightRate = 100 // Tỷ lệ mặc định cho giờ chuẩn
    let otWeekdayNightRate = baseOtRate
    let otWeekendNightRate = baseOtRate
    let otHolidayNightRate = baseOtRate

    const nightPremiumRate = userSettings?.nightWorkRate || 30
    const nightOtRule = userSettings?.nightOtCalculationRule || 'sum'

    if (nightOtRule === 'sum') {
      // Tỷ lệ OT + Phụ cấp đêm
      standardNightRate = 100 + nightPremiumRate
      otWeekdayNightRate = baseOtRate + nightPremiumRate
      otWeekendNightRate =
        (dayType === 'saturday'
          ? userSettings?.otRateSaturday
          : userSettings?.otRateSunday) + nightPremiumRate
      otHolidayNightRate = userSettings?.otRateHoliday + nightPremiumRate
    } else if (nightOtRule === 'multiply') {
      // Tỷ lệ OT * (1 + Phụ cấp đêm/100)
      standardNightRate = 100 * (1 + nightPremiumRate / 100)
      otWeekdayNightRate = baseOtRate * (1 + nightPremiumRate / 100)
      otWeekendNightRate =
        (dayType === 'saturday'
          ? userSettings?.otRateSaturday
          : userSettings?.otRateSunday) *
        (1 + nightPremiumRate / 100)
      otHolidayNightRate =
        userSettings?.otRateHoliday * (1 + nightPremiumRate / 100)
    } else if (nightOtRule === 'fixed') {
      // Sử dụng tỷ lệ cố định
      standardNightRate = userSettings?.fixedRateStandardNight || 130
      otWeekdayNightRate = userSettings?.fixedRateOtWeekdayNight || 210
      otWeekendNightRate =
        dayType === 'saturday'
          ? userSettings?.fixedRateOtSaturdayNight || 270
          : userSettings?.fixedRateOtSundayNight || 270
      otHolidayNightRate = userSettings?.fixedRateOtHolidayNight || 390
    }
    // Nếu nightOtRule === 'base', giữ nguyên tỷ lệ OT cơ bản

    // Tạo đối tượng trạng thái làm việc
    const workStatus = {
      date,
      status,
      shiftId: shift?.id,
      shiftName: shift?.name,
      checkInTime: checkInTime ? checkInTime.toISOString() : null,
      checkOutTime: checkOutTime ? checkOutTime.toISOString() : null,
      workMinutes,
      breakMinutes: shift?.breakMinutes || 0,
      otMinutes,
      lateMinutes,
      earlyMinutes,
      // Thêm các trường mới cho tính toán OT và làm đêm
      otHoursByRate,
      // Thông tin giờ làm đêm
      standardHoursNightPortionActual,
      otHoursNightPortion,
      // Phân loại chi tiết giờ làm việc
      standardDayHours: standardDayHoursActual,
      standardNightHours: standardNightHoursActual,
      otWeekdayDayHours,
      otWeekdayNightHours,
      otWeekendDayHours,
      otWeekendNightHours,
      otHolidayDayHours,
      otHolidayNightHours,
      // Tỷ lệ áp dụng
      standardNightRate,
      otWeekdayNightRate,
      otWeekendNightRate,
      otHolidayNightRate,
      // Thông tin khác
      isManuallyUpdated: false,
      calculatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    return workStatus
  } catch (error) {
    console.error(
      `Lỗi khi tính toán trạng thái làm việc cho ngày ${date}:`,
      error
    )

    // Trả về trạng thái mặc định nếu có lỗi
    return {
      date,
      status: WORK_STATUS.CHUA_CAP_NHAT,
      error: error.message,
      calculatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }
}

/**
 * Tính toán và lưu trạng thái làm việc cho một ngày
 * @param {string} date Ngày cần tính toán (định dạng YYYY-MM-DD)
 * @param {Object} shift Ca làm việc áp dụng
 * @returns {Promise<Object>} Trạng thái làm việc đã tính toán và lưu
 */
export const calculateAndSaveDailyWorkStatus = async (date, shift) => {
  try {
    // Lấy trạng thái hiện tại
    const currentStatus = await storage.getDailyWorkStatus(date)

    // Nếu trạng thái đã được cập nhật thủ công, không tính toán lại
    if (currentStatus && currentStatus.isManuallyUpdated) {
      return currentStatus
    }

    // Tính toán trạng thái mới
    const newStatus = await calculateDailyWorkStatus(date, shift)

    // Lưu trạng thái mới
    await storage.setDailyWorkStatus(date, newStatus)

    return newStatus
  } catch (error) {
    console.error(
      `Lỗi khi tính toán và lưu trạng thái làm việc cho ngày ${date}:`,
      error
    )
    return null
  }
}

/**
 * Cập nhật trạng thái làm việc thủ công
 * @param {string} date Ngày cần cập nhật (định dạng YYYY-MM-DD)
 * @param {string} status Trạng thái mới
 * @param {Object} additionalData Dữ liệu bổ sung (tùy chọn)
 * @returns {Promise<Object>} Trạng thái làm việc đã cập nhật
 */
export const updateWorkStatusManually = async (
  date,
  status,
  additionalData = {}
) => {
  try {
    // Lấy trạng thái hiện tại
    const currentStatus = (await storage.getDailyWorkStatus(date)) || {}

    // Cập nhật trạng thái
    const updatedStatus = {
      ...currentStatus,
      ...additionalData,
      date,
      status,
      isManuallyUpdated: true,
      updatedAt: new Date().toISOString(),
    }

    // Lưu trạng thái mới
    await storage.setDailyWorkStatus(date, updatedStatus)

    return updatedStatus
  } catch (error) {
    console.error(
      `Lỗi khi cập nhật thủ công trạng thái làm việc cho ngày ${date}:`,
      error
    )
    return null
  }
}

/**
 * Tính toán trạng thái làm việc cho ngày hiện tại
 * @returns {Promise<Object>} Trạng thái làm việc đã tính toán và lưu
 */
export const calculateTodayWorkStatus = async () => {
  try {
    // Lấy ngày hiện tại
    const today = formatDate(new Date())

    // Lấy ca làm việc đang áp dụng
    const activeShift = await storage.getActiveShift()

    // Tính toán và lưu trạng thái
    return await calculateAndSaveDailyWorkStatus(today, activeShift)
  } catch (error) {
    console.error(
      'Lỗi khi tính toán trạng thái làm việc cho ngày hiện tại:',
      error
    )
    return null
  }
}

/**
 * Tính toán trạng thái làm việc cho một khoảng thời gian
 * @param {Date} startDate Ngày bắt đầu
 * @param {Date} endDate Ngày kết thúc
 * @returns {Promise<Array>} Danh sách trạng thái làm việc đã tính toán
 */
export const calculateWorkStatusForDateRange = async (startDate, endDate) => {
  try {
    const results = []

    // Lấy ca làm việc đang áp dụng
    const activeShift = await storage.getActiveShift()

    // Tính toán cho từng ngày trong khoảng
    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      const dateStr = formatDate(currentDate)

      // Tính toán và lưu trạng thái
      const status = await calculateAndSaveDailyWorkStatus(dateStr, activeShift)
      results.push(status)

      // Chuyển sang ngày tiếp theo
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return results
  } catch (error) {
    console.error(
      'Lỗi khi tính toán trạng thái làm việc cho khoảng thời gian:',
      error
    )
    return []
  }
}

export default {
  calculateDailyWorkStatus,
  calculateAndSaveDailyWorkStatus,
  updateWorkStatusManually,
  calculateTodayWorkStatus,
  calculateWorkStatusForDateRange,
}
