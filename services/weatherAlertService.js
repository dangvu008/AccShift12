'use client'

import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Notifications from 'expo-notifications'
import {
  getCurrentWeather,
  getWeatherForecast,
  getHourlyForecast,
} from './weatherService'
import { STORAGE_KEYS } from '../config/appConfig'
import locationUtils from '../utils/location'
import { translations } from '../utils/translations'

// Hàm dịch đơn giản, sử dụng ngôn ngữ mặc định là tiếng Việt
const t = (key) => {
  // Lấy ngôn ngữ từ AsyncStorage là bất đồng bộ, nên chúng ta sử dụng tiếng Việt làm mặc định
  return translations['vi'][key] || key
}

// Ngưỡng cảnh báo thời tiết cực đoan
const EXTREME_WEATHER_THRESHOLDS = {
  RAIN: 10, // mm/h
  HIGH_TEMP: 35, // °C
  LOW_TEMP: 10, // °C
  WIND: 10, // m/s
  SNOW: 1, // mm/h
}

// Các loại điều kiện thời tiết cực đoan
const WEATHER_CONDITIONS = {
  RAIN: 'rain',
  HIGH_TEMP: 'high_temp',
  LOW_TEMP: 'low_temp',
  WIND: 'wind',
  THUNDERSTORM: 'thunderstorm',
  SNOW: 'snow',
}

// Danh sách cảnh báo đã hiển thị
let displayedAlerts = []

/**
 * Kiểm tra thời tiết cực đoan
 * @param {Object} weatherData Dữ liệu thời tiết
 * @returns {Object} Thông tin cảnh báo
 */
const checkExtremeConditions = (weatherData) => {
  if (!weatherData) return { hasAlert: false }

  const temp = weatherData.main.temp
  const windSpeed = weatherData.wind.speed
  const weatherId = weatherData.weather[0].id
  const rain = weatherData.rain ? weatherData.rain['1h'] || 0 : 0
  const snow = weatherData.snow ? weatherData.snow['1h'] || 0 : 0

  // Các điều kiện cực đoan
  const isExtremeHeat = temp > EXTREME_WEATHER_THRESHOLDS.HIGH_TEMP
  const isExtremeCold = temp < EXTREME_WEATHER_THRESHOLDS.LOW_TEMP
  const isStrongWind = windSpeed > EXTREME_WEATHER_THRESHOLDS.WIND
  const isThunderstorm = weatherId >= 200 && weatherId < 300
  const isHeavyRain = rain > EXTREME_WEATHER_THRESHOLDS.RAIN
  const isSnow = snow > EXTREME_WEATHER_THRESHOLDS.SNOW

  const conditions = []

  if (isExtremeHeat) {
    conditions.push({
      type: 'high_temp',
      severity: 'high',
      message: `${t('Abnormally high temperature')} (${Math.round(temp)}°C)`,
      suggestion: t('Drink plenty of water and avoid outdoor activities'),
    })
  }

  if (isExtremeCold) {
    conditions.push({
      type: 'low_temp',
      severity: 'high',
      message: `${t('Abnormally low temperature')} (${Math.round(temp)}°C)`,
      suggestion: t('Dress warmly and limit time outdoors'),
    })
  }

  if (isStrongWind) {
    conditions.push({
      type: 'wind',
      severity: 'moderate',
      message: `${t('Strong winds')} (${Math.round(windSpeed)} m/s)`,
      suggestion: t('Be cautious of flying debris and avoid open areas'),
    })
  }

  if (isThunderstorm) {
    conditions.push({
      type: 'thunderstorm',
      severity: 'high',
      message: t('Thunderstorm detected'),
      suggestion: t('Seek shelter indoors and avoid electrical equipment'),
    })
  }

  if (isHeavyRain) {
    conditions.push({
      type: 'rain',
      severity: 'high',
      message: `${t('Heavy rain')} (${rain.toFixed(1)} mm/h)`,
      suggestion: t('Be aware of flooding and poor visibility'),
    })
  }

  if (isSnow) {
    conditions.push({
      type: 'snow',
      severity: 'moderate',
      message: `${t('Snowfall')} (${snow.toFixed(1)} mm/h)`,
      suggestion: t('Roads may be slippery, drive carefully'),
    })
  }

  return {
    hasAlert: conditions.length > 0,
    conditions,
    location: weatherData.name,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Lấy vị trí kiểm tra thời tiết dựa trên thời điểm và cài đặt người dùng
 * @param {string} timeType 'departure' hoặc 'return'
 * @param {Object} userSettings Cài đặt người dùng
 * @returns {Object|null} Vị trí kiểm tra hoặc null nếu không có
 */
const getCheckLocation = (timeType, userSettings) => {
  if (!userSettings || !userSettings.weatherLocation) return null

  // Kiểm tra lúc đi (quanh departureTime): Luôn sử dụng vị trí nhà
  if (timeType === 'departure') {
    return userSettings.weatherLocation.home
  }

  // Kiểm tra lúc về (quanh officeEndTime)
  if (timeType === 'return') {
    // Nếu useSingleLocation là true HOẶC chưa có vị trí công ty: Sử dụng vị trí nhà
    if (
      userSettings.weatherLocation.useSingleLocation === true ||
      !userSettings.weatherLocation.work
    ) {
      return userSettings.weatherLocation.home
    }

    // Nếu useSingleLocation là false VÀ có vị trí công ty: Sử dụng vị trí công ty
    return userSettings.weatherLocation.work
  }

  return null
}

/**
 * Tìm dự báo thời tiết gần nhất với thời điểm cụ thể
 * @param {Array} forecastList Danh sách dự báo thời tiết
 * @param {string} timeString Thời gian cần tìm (định dạng "HH:MM")
 * @returns {Object|null} Dự báo thời tiết gần nhất hoặc null nếu không tìm thấy
 */
const findForecastForTime = (forecastList, timeString) => {
  if (!forecastList || forecastList.length === 0 || !timeString) return null

  // Chuyển đổi timeString thành số phút trong ngày
  const [hours, minutes] = timeString.split(':').map(Number)
  const targetMinutes = hours * 60 + minutes

  // Tạo một bản sao của danh sách dự báo để không ảnh hưởng đến dữ liệu gốc
  const forecasts = [...forecastList]

  // Chuyển đổi thời gian dự báo thành số phút trong ngày và tính khoảng cách
  forecasts.forEach((forecast) => {
    const forecastDate = new Date(forecast.dt * 1000)
    const forecastHours = forecastDate.getHours()
    const forecastMinutes = forecastDate.getMinutes()
    const forecastTotalMinutes = forecastHours * 60 + forecastMinutes

    // Tính khoảng cách thời gian (có xử lý trường hợp qua ngày)
    let timeDiff = Math.abs(forecastTotalMinutes - targetMinutes)
    if (timeDiff > 12 * 60) {
      // Nếu khoảng cách > 12 giờ, có thể là qua ngày
      timeDiff = 24 * 60 - timeDiff
    }

    forecast.timeDiff = timeDiff
  })

  // Sắp xếp theo khoảng cách thời gian tăng dần
  forecasts.sort((a, b) => a.timeDiff - b.timeDiff)

  // Trả về dự báo gần nhất
  return forecasts[0]
}

/**
 * Phân tích dự báo thời tiết và tạo cảnh báo
 * @param {Object} shift Ca làm việc
 * @param {Object} homeLocation Vị trí nhà
 * @param {Object} workLocation Vị trí công ty
 * @param {boolean} useSingleLocation Sử dụng chung một vị trí
 * @returns {Promise<Object>} Thông tin cảnh báo
 */
const analyzeWeatherForecast = async (
  shift,
  homeLocation,
  workLocation,
  useSingleLocation
) => {
  try {
    if (!shift || !homeLocation) return { hasAlert: false }

    // Lấy dự báo thời tiết cho vị trí nhà
    const homeForecast = await getHourlyForecast(
      homeLocation.lat,
      homeLocation.lon
    )

    // Lấy dự báo thời tiết cho vị trí công ty (nếu có và không dùng chung vị trí)
    let workForecast = []
    if (workLocation && !useSingleLocation) {
      workForecast = await getHourlyForecast(workLocation.lat, workLocation.lon)
    } else {
      // Nếu dùng chung vị trí hoặc không có vị trí công ty, sử dụng dự báo của nhà
      workForecast = homeForecast
    }

    // Phân tích dự báo tại NHÀ (lúc sắp đi)
    const departureTime = shift.departureTime || shift.startTime
    const homeDepartureForecast = findForecastForTime(
      homeForecast,
      departureTime
    )

    // Phân tích dự báo tại CÔNG TY (lúc sẽ tan làm)
    const returnTime = shift.officeEndTime || shift.endTime
    const workReturnForecast = findForecastForTime(workForecast, returnTime)

    // Kiểm tra điều kiện cực đoan
    const departureAlert = homeDepartureForecast
      ? checkExtremeConditions(homeDepartureForecast)
      : { hasAlert: false }
    const returnAlert = workReturnForecast
      ? checkExtremeConditions(workReturnForecast)
      : { hasAlert: false }

    // Tạo thông báo cụ thể
    const alerts = []
    const departureTimeFormatted = departureTime
    const returnTimeFormatted = returnTime

    if (departureAlert.hasAlert) {
      // Tạo thông báo cho thời điểm đi làm
      const departureAlertMessages = []

      departureAlert.conditions.forEach((condition) => {
        let message = ''

        switch (condition.type) {
          case WEATHER_CONDITIONS.RAIN:
            message = `Cảnh báo: Sắp có mưa tại nhà (~${departureTimeFormatted}). Nhớ mang áo mưa!`
            break
          case WEATHER_CONDITIONS.HIGH_TEMP:
            message = `Cảnh báo: Nhiệt độ tại nhà khá cao (~${departureTimeFormatted}). Nên chuẩn bị đồ thoáng mát.`
            break
          case WEATHER_CONDITIONS.LOW_TEMP:
            message = `Cảnh báo: Nhiệt độ tại nhà khá thấp (~${departureTimeFormatted}). Nên mặc ấm.`
            break
          case WEATHER_CONDITIONS.WIND:
            message = `Cảnh báo: Gió mạnh tại nhà (~${departureTimeFormatted}). Cẩn thận khi di chuyển.`
            break
          case WEATHER_CONDITIONS.THUNDERSTORM:
            message = `Cảnh báo: Có giông bão tại nhà (~${departureTimeFormatted}). Cân nhắc mang ô/áo mưa.`
            break
          case WEATHER_CONDITIONS.SNOW:
            message = `Cảnh báo: Có tuyết rơi tại nhà (~${departureTimeFormatted}). Mặc đủ ấm và cẩn thận đường trơn.`
            break
          default:
            message = `Cảnh báo: ${condition.message} tại nhà (~${departureTimeFormatted}).`
        }

        departureAlertMessages.push(message)
      })

      alerts.push({
        timeType: 'departure',
        locationName: 'nhà',
        time: departureTimeFormatted,
        messages: departureAlertMessages,
        conditions: departureAlert.conditions,
        forecast: homeDepartureForecast,
      })
    }

    if (returnAlert.hasAlert) {
      // Tạo thông báo cho thời điểm tan làm
      const returnAlertMessages = []
      const locationName = useSingleLocation ? 'nhà' : 'công ty'

      returnAlert.conditions.forEach((condition) => {
        let message = ''

        switch (condition.type) {
          case WEATHER_CONDITIONS.RAIN:
            message = `Lưu ý: Dự báo có mưa tại ${locationName} lúc tan làm (~${returnTimeFormatted}). Hãy chuẩn bị áo mưa từ nhà!`
            break
          case WEATHER_CONDITIONS.HIGH_TEMP:
            message = `Lưu ý: Dự báo nhiệt độ tại ${locationName} rất cao lúc tan làm (~${returnTimeFormatted}). Cân nhắc trang phục phù hợp mang từ nhà.`
            break
          case WEATHER_CONDITIONS.LOW_TEMP:
            message = `Lưu ý: Dự báo nhiệt độ tại ${locationName} khá thấp lúc tan làm (~${returnTimeFormatted}). Nên mang thêm áo ấm từ nhà.`
            break
          case WEATHER_CONDITIONS.WIND:
            message = `Lưu ý: Dự báo gió mạnh tại ${locationName} lúc tan làm (~${returnTimeFormatted}). Cẩn thận khi di chuyển.`
            break
          case WEATHER_CONDITIONS.THUNDERSTORM:
            message = `Lưu ý: Dự báo có giông bão tại ${locationName} lúc tan làm (~${returnTimeFormatted}). Chuẩn bị ô/áo mưa từ nhà.`
            break
          case WEATHER_CONDITIONS.SNOW:
            message = `Lưu ý: Dự báo có tuyết rơi tại ${locationName} lúc tan làm (~${returnTimeFormatted}). Chuẩn bị quần áo ấm từ nhà.`
            break
          default:
            message = `Lưu ý: ${condition.message} tại ${locationName} lúc tan làm (~${returnTimeFormatted}).`
        }

        returnAlertMessages.push(message)
      })

      alerts.push({
        timeType: 'return',
        locationName: useSingleLocation ? 'nhà' : 'công ty',
        time: returnTimeFormatted,
        messages: returnAlertMessages,
        conditions: returnAlert.conditions,
        forecast: workReturnForecast,
      })
    }

    // Tổng hợp cảnh báo
    const hasAlert = alerts.length > 0

    if (hasAlert) {
      return {
        hasAlert,
        alerts,
        shift,
      }
    }

    return { hasAlert: false }
  } catch (error) {
    console.error('Lỗi khi phân tích dự báo thời tiết:', error)
    return { hasAlert: false }
  }
}

/**
 * Kiểm tra thời tiết cực đoan cho một ca làm việc
 * @param {Object} shift Ca làm việc
 * @returns {Promise<Object>} Thông tin cảnh báo
 */
export const checkWeatherForShift = async (shift) => {
  try {
    // Lấy cài đặt người dùng
    const userSettingsJson = await AsyncStorage.getItem(
      STORAGE_KEYS.USER_SETTINGS
    )
    if (!userSettingsJson) return { hasAlert: false }

    const userSettings = JSON.parse(userSettingsJson)

    // Kiểm tra điều kiện kích hoạt
    if (
      !userSettings.weatherWarningEnabled ||
      !userSettings.weatherLocation ||
      !userSettings.weatherLocation.home
    ) {
      return { hasAlert: false }
    }

    // Lấy vị trí nhà và công ty
    const homeLocation = userSettings.weatherLocation.home
    const workLocation = userSettings.weatherLocation.work
    const useSingleLocation =
      userSettings.weatherLocation.useSingleLocation === true

    // Sử dụng phân tích dự báo thời tiết mới
    return await analyzeWeatherForecast(
      shift,
      homeLocation,
      workLocation,
      useSingleLocation
    )
  } catch (error) {
    console.error('Lỗi khi kiểm tra thời tiết cho ca làm việc:', error)
    return { hasAlert: false }
  }
}

/**
 * Lên lịch kiểm tra thời tiết cho một ca làm việc
 * @param {Object} shift Ca làm việc
 */
export const scheduleWeatherCheck = async (shift) => {
  try {
    // Lấy cài đặt người dùng
    const userSettingsJson = await AsyncStorage.getItem(
      STORAGE_KEYS.USER_SETTINGS
    )
    if (!userSettingsJson) return

    const userSettings = JSON.parse(userSettingsJson)

    // Kiểm tra điều kiện kích hoạt
    if (
      !userSettings.weatherWarningEnabled ||
      !userSettings.weatherLocation ||
      !userSettings.weatherLocation.home ||
      !shift ||
      !shift.startTime
    ) {
      return
    }

    // Tính thời gian kiểm tra (1 giờ trước departureTime)
    const now = new Date()
    const [departureHours, departureMinutes] = shift.startTime
      .split(':')
      .map(Number)

    const checkTime = new Date(now)
    checkTime.setHours(departureHours - 1, departureMinutes, 0)

    // Nếu thời gian kiểm tra đã qua, đặt lịch cho ngày mai
    if (checkTime < now) {
      checkTime.setDate(checkTime.getDate() + 1)
    }

    // Lên lịch kiểm tra
    const trigger = checkTime

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Kiểm tra thời tiết',
        body: `Kiểm tra thời tiết cho ca ${shift.name}`,
        data: { type: 'weather_check', shiftId: shift.id },
      },
      trigger,
    })

    console.log(
      `Đã lên lịch kiểm tra thời tiết cho ca ${
        shift.name
      } vào ${checkTime.toLocaleString()}`
    )
  } catch (error) {
    console.error('Lỗi khi lên lịch kiểm tra thời tiết:', error)
  }
}

/**
 * Hiển thị cảnh báo thời tiết
 * @param {Object} alertData Dữ liệu cảnh báo
 */
export const showWeatherAlert = async (alertData) => {
  try {
    if (!alertData || !alertData.hasAlert) return

    // Tạo ID duy nhất cho cảnh báo
    const alertId = `${alertData.shift.id}_${new Date().toISOString()}`

    // Kiểm tra xem cảnh báo đã hiển thị chưa
    if (displayedAlerts.includes(alertId)) return

    // Thêm vào danh sách đã hiển thị
    displayedAlerts.push(alertId)

    // Giới hạn số lượng cảnh báo đã hiển thị
    if (displayedAlerts.length > 10) {
      displayedAlerts = displayedAlerts.slice(-10)
    }

    // Tạo nội dung cảnh báo
    let title = `Cảnh báo thời tiết - Ca ${alertData.shift.name}`
    let body = ''

    // Tổng hợp các thông báo từ tất cả các cảnh báo
    const allMessages = []
    alertData.alerts.forEach((alert) => {
      if (alert.messages && alert.messages.length > 0) {
        allMessages.push(...alert.messages)
      }
    })

    // Nếu có thông báo mới, sử dụng chúng
    if (allMessages.length > 0) {
      body = allMessages.join('\n\n')
    } else {
      // Ngược lại, sử dụng định dạng cũ
      alertData.alerts.forEach((alert) => {
        const locationText =
          alert.timeType === 'departure'
            ? 'đi làm từ nhà'
            : `về nhà từ ${alert.locationName}`

        alert.conditions.forEach((condition) => {
          body += `${condition.message} khi ${locationText}. ${condition.suggestion}\n`
        })
      })
    }

    // Lưu cảnh báo vào AsyncStorage
    const alertsJson = await AsyncStorage.getItem(STORAGE_KEYS.WEATHER_ALERTS)
    let alerts = alertsJson ? JSON.parse(alertsJson) : []

    alerts.push({
      id: alertId,
      title,
      body,
      timestamp: new Date().toISOString(),
      read: false,
      data: alertData,
    })

    // Giới hạn số lượng cảnh báo lưu trữ
    if (alerts.length > 20) {
      alerts = alerts.slice(-20)
    }

    await AsyncStorage.setItem(
      STORAGE_KEYS.WEATHER_ALERTS,
      JSON.stringify(alerts)
    )

    // Hiển thị thông báo
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { type: 'weather_alert', alertId },
      },
      trigger: null, // Hiển thị ngay lập tức
    })

    console.log('Đã hiển thị cảnh báo thời tiết:', title)

    return alertId
  } catch (error) {
    console.error('Lỗi khi hiển thị cảnh báo thời tiết:', error)
    return null
  }
}

/**
 * Đánh dấu cảnh báo đã đọc
 * @param {string} alertId ID cảnh báo
 */
export const markAlertAsRead = async (alertId) => {
  try {
    const alertsJson = await AsyncStorage.getItem(STORAGE_KEYS.WEATHER_ALERTS)
    if (!alertsJson) return

    const alerts = JSON.parse(alertsJson)
    const alertIndex = alerts.findIndex((alert) => alert.id === alertId)

    if (alertIndex !== -1) {
      alerts[alertIndex].read = true
      await AsyncStorage.setItem(
        STORAGE_KEYS.WEATHER_ALERTS,
        JSON.stringify(alerts)
      )
    }
  } catch (error) {
    console.error('Lỗi khi đánh dấu cảnh báo đã đọc:', error)
  }
}

/**
 * Lấy danh sách cảnh báo
 * @param {boolean} onlyUnread Chỉ lấy cảnh báo chưa đọc
 * @returns {Promise<Array>} Danh sách cảnh báo
 */
export const getWeatherAlerts = async (onlyUnread = false) => {
  try {
    const alertsJson = await AsyncStorage.getItem(STORAGE_KEYS.WEATHER_ALERTS)
    if (!alertsJson) return []

    const alerts = JSON.parse(alertsJson)

    if (onlyUnread) {
      return alerts.filter((alert) => !alert.read)
    }

    return alerts
  } catch (error) {
    console.error(t('Error getting weather alerts'), error)
    return []
  }
}

/**
 * Xóa tất cả cảnh báo
 */
export const clearAllAlerts = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.WEATHER_ALERTS)
    displayedAlerts = []
  } catch (error) {
    console.error(t('Error clearing all alerts'), error)
  }
}

export default {
  checkWeatherForShift,
  scheduleWeatherCheck,
  showWeatherAlert,
  markAlertAsRead,
  getWeatherAlerts,
  clearAllAlerts,
}
