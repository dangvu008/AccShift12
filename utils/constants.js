// Storage keys for AsyncStorage
export const STORAGE_KEYS = {
  SHIFT_LIST: 'accshift_shifts',
  CURRENT_SHIFT: 'accshift_current_shift',
  NOTES: 'accshift_notes',
  SETTINGS: 'accshift_settings',
  USER_PROFILE: 'accshift_user_profile',
  ATTENDANCE_RECORDS: 'accshift_attendance_records',
  THEME: 'accshift_theme',
  LANGUAGE: 'accshift_language',
}

// Notification configuration
export const NOTIFICATION_CONFIG = {
  CHANNEL_ID: 'accshift_notifications',
  CHANNEL_NAME: 'AccShift Notifications',
  VIBRATION_PATTERN: [0, 250, 250, 250],
  LIGHT_COLOR: '#8a56ff',
}

// App constants
export const APP_CONSTANTS = {
  DEFAULT_BREAK_TIME: 60, // minutes
  DEFAULT_SHIFT_DURATION: 8, // hours
  MIN_SHIFT_DURATION: 1, // hours
  MAX_SHIFT_DURATION: 24, // hours
}

// Date and time formats
export const DATE_FORMATS = {
  DISPLAY_DATE: 'DD/MM/YYYY',
  DISPLAY_TIME: 'HH:mm',
  DISPLAY_DATETIME: 'DD/MM/YYYY HH:mm',
  API_DATE: 'YYYY-MM-DD',
  API_TIME: 'HH:mm:ss',
  API_DATETIME: 'YYYY-MM-DDTHH:mm:ss',
}
