/**
 * Hệ thống màu sắc cho ứng dụng AccShift
 * Cung cấp các màu sắc nhất quán cho toàn bộ ứng dụng
 */

// Màu sắc chính
export const COLORS = {
  // Màu chủ đạo
  PRIMARY: '#8a56ff',
  PRIMARY_DARK: '#7040e0',
  PRIMARY_LIGHT: '#a47aff',

  // Màu nền
  BACKGROUND_LIGHT: '#f5f5f5',
  BACKGROUND_DARK: '#121212',
  
  // Màu nền thẻ
  CARD_LIGHT: '#ffffff',
  CARD_DARK: '#1e1e1e',
  
  // Màu nền thẻ thứ cấp
  SECONDARY_CARD_LIGHT: '#f0f0f0',
  SECONDARY_CARD_DARK: '#2a2a2a',
  
  // Màu văn bản
  TEXT_LIGHT: '#000000',
  TEXT_DARK: '#ffffff',
  
  // Màu văn bản phụ
  SUBTEXT_LIGHT: '#666666',
  SUBTEXT_DARK: '#aaaaaa',
  
  // Màu đường viền
  BORDER_LIGHT: '#dddddd',
  BORDER_DARK: '#333333',
  
  // Màu trạng thái
  SUCCESS: '#27ae60',
  WARNING: '#f39c12',
  ERROR: '#e74c3c',
  INFO: '#3498db',
  
  // Màu khác
  DISABLED_LIGHT: '#cccccc',
  DISABLED_DARK: '#555555',
  TRANSPARENT: 'transparent',
}

/**
 * Lấy màu sắc dựa trên chế độ sáng/tối
 * @param {boolean} darkMode Chế độ tối
 * @returns {Object} Bảng màu
 */
export const getTheme = (darkMode) => {
  return {
    // Màu nền chính
    backgroundColor: darkMode ? COLORS.BACKGROUND_DARK : COLORS.BACKGROUND_LIGHT,
    
    // Màu nền thẻ
    cardColor: darkMode ? COLORS.CARD_DARK : COLORS.CARD_LIGHT,
    secondaryCardColor: darkMode ? COLORS.SECONDARY_CARD_DARK : COLORS.SECONDARY_CARD_LIGHT,
    
    // Màu văn bản
    textColor: darkMode ? COLORS.TEXT_DARK : COLORS.TEXT_LIGHT,
    subtextColor: darkMode ? COLORS.SUBTEXT_DARK : COLORS.SUBTEXT_LIGHT,
    
    // Màu đường viền
    borderColor: darkMode ? COLORS.BORDER_DARK : COLORS.BORDER_LIGHT,
    
    // Màu chủ đạo
    primaryColor: COLORS.PRIMARY,
    primaryDarkColor: COLORS.PRIMARY_DARK,
    primaryLightColor: COLORS.PRIMARY_LIGHT,
    
    // Màu trạng thái
    successColor: COLORS.SUCCESS,
    warningColor: COLORS.WARNING,
    errorColor: COLORS.ERROR,
    infoColor: COLORS.INFO,
    
    // Màu khác
    disabledColor: darkMode ? COLORS.DISABLED_DARK : COLORS.DISABLED_LIGHT,
    transparentColor: COLORS.TRANSPARENT,
    
    // Màu header
    headerBackgroundColor: COLORS.PRIMARY,
    headerTintColor: COLORS.TEXT_DARK,
    
    // Màu tab bar
    tabBarBackgroundColor: darkMode ? COLORS.BACKGROUND_DARK : COLORS.CARD_LIGHT,
    tabBarBorderColor: darkMode ? COLORS.BORDER_DARK : COLORS.BORDER_LIGHT,
    tabBarActiveColor: COLORS.PRIMARY,
    tabBarInactiveColor: darkMode ? COLORS.SUBTEXT_DARK : COLORS.SUBTEXT_LIGHT,
  }
}

export default {
  COLORS,
  getTheme,
}
