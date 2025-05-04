// app.config.js
import { ExpoConfig } from 'expo/config';

// Đọc cấu hình từ app.json
import appJson from './app.json';

// Xuất cấu hình
export default ({ config }) => {
  return {
    ...appJson.expo,
    // Thêm các cấu hình bổ sung nếu cần
    extra: {
      ...appJson.expo.extra,
      // Thêm các biến môi trường nếu cần
    },
  };
};
