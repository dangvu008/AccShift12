export const API_CONFIG = {
  WEATHER_BASE_URL: 'https://api.openweathermap.org/data/2.5',
  CACHE_TTL: 1 * 60 * 60 * 1000, // 1 giờ (giảm từ 3 giờ để cập nhật thường xuyên hơn)
  CACHE_TTL_FALLBACK: 15 * 60 * 1000, // 15 phút cho dữ liệu dự phòng
  KEY_USAGE_LIMIT_PER_MINUTE: 60,
  KEY_USAGE_RESET_INTERVAL: 60 * 1000, // 1 phút
  DEFAULT_LOCATION: {
    lat: 21.0278, // Hà Nội
    lon: 105.8342,
  },
  RETRY_DELAY: 2000, // 2 giây chờ giữa các lần thử lại
  MAX_RETRY_COUNT: 5, // Tăng số lần thử lại tối đa
  TIMEOUT: 15000, // 15 giây timeout cho API calls
  USE_FALLBACK_ON_ERROR: true, // Sử dụng dữ liệu dự phòng khi có lỗi
}

export const SECURITY_CONFIG = {
  ENCRYPTION_KEY: 'AccShift_Encryption_Key_2025',
  SECURE_PREFIX: 'secure_',
  MASK_VISIBLE_CHARS: 4,
}

export const STORAGE_KEYS = {
  ATTENDANCE_LOGS_PREFIX: 'attendanceLogs_',
  NOTIFICATION_LOGS_PREFIX: 'notificationLogs_',
  DAILY_WORK_STATUS_PREFIX: 'dailyWorkStatus_',
  SHIFT_LIST: 'shifts',
  NOTES: 'notes',
  CURRENT_SHIFT_ID: 'currentShiftId',
  WEATHER_CACHE_PREFIX: 'weather_cache_',
  WEATHER_API_KEYS: 'weatherApiKeys',
  WEATHER_API_STATE: 'weatherApiState',
  WEATHER_ALERTS: 'weatherAlerts',
  DEVICE_ID: 'device_id',
  USER_SETTINGS: 'userSettings',
  ACTIVE_SHIFT_ID: 'activeShiftId',
  IS_WORKING: 'isWorking',
  WORK_START_TIME: 'workStartTime',
  LAST_AUTO_RESET_TIME: 'lastAutoResetTime',
}
