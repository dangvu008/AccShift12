import AsyncStorage from '@react-native-async-storage/async-storage'
import { secureStore, secureRetrieve, maskString } from '../utils/security'
import { API_CONFIG, STORAGE_KEYS } from '../config/appConfig'

// Danh sách API keys
// LƯU Ý: API key chỉ có thể được thay đổi bởi dev thông qua code.
// Người dùng không có quyền thay đổi API key thông qua giao diện.
const API_KEYS = [
  {
    key: 'db077a0c565a5ff3e7a3ca8ff9623575',
    type: 'free',
    priority: 10,
    enabled: true,
  },
  {
    key: '33b47107af3d15baccd58ff918b6e8e9',
    type: 'free',
    priority: 10,
    enabled: true,
  },
  {
    key: '949aa0ee4adae3c3fcec31fc01a7fd05',
    type: 'free',
    priority: 10,
    enabled: true,
  },
  {
    key: '47dc407065ba8fda36983034776b8176',
    type: 'free',
    priority: 10,
    enabled: true,
  },
  {
    key: 'c1b419e1da6cd8f8f207fe5b7a49d8bb',
    type: 'free',
    priority: 10,
    enabled: true,
  },
  {
    key: 'ce0efa4bc47ef30427d778f40b05ebf7',
    type: 'free',
    priority: 10,
    enabled: true,
  },
  {
    key: 'b5be947361e1541457fa2e8bda0c27fd',
    type: 'free',
    priority: 10,
    enabled: true,
  },
  {
    key: 'd53d270911d2c0f515869c0fe38c5f6f',
    type: 'free',
    priority: 10,
    enabled: true,
  },
  {
    key: 'ecedca1f66c870e9bff73d2c1da6c2fb',
    type: 'free',
    priority: 10,
    enabled: true,
  },
  {
    key: '1c0952d5a7ca5cf28189ecf9f0d0483a',
    type: 'free',
    priority: 10,
    enabled: true,
  },
  // API key mới thêm vào (2025)
  {
    key: '5f4e1c2b3a9d8e7f6a5b4c3d2e1f0a9b',
    type: 'free',
    priority: 5, // Ưu tiên cao hơn các key cũ
    enabled: true,
  },
  {
    key: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6',
    type: 'free',
    priority: 5, // Ưu tiên cao hơn các key cũ
    enabled: true,
  },
  // Dự phòng cho key trả phí trong tương lai
  {
    key: 'your_future_paid_key',
    type: 'paid',
    priority: 1, // Ưu tiên cao nhất
    enabled: false, // Chưa kích hoạt
  },
]

// Theo dõi sử dụng key
const keyUsageCounter = {}
let lastKeyIndex = -1

// Khởi tạo bộ đếm sử dụng key
API_KEYS.forEach((keyObj) => {
  keyUsageCounter[keyObj.key] = {
    count: 0,
    lastReset: Date.now(),
  }
})

// Reset bộ đếm định kỳ
setInterval(() => {
  Object.keys(keyUsageCounter).forEach((key) => {
    keyUsageCounter[key] = {
      count: 0,
      lastReset: Date.now(),
    }
  })
}, API_CONFIG.KEY_USAGE_RESET_INTERVAL)

/**
 * Chọn API key phù hợp
 * @returns {string|null} API key hoặc null nếu không có key khả dụng
 */
const selectApiKey = () => {
  // Lọc các key đang bật
  const enabledKeys = API_KEYS.filter((keyObj) => keyObj.enabled)
  if (enabledKeys.length === 0) return null

  // Sắp xếp theo ưu tiên (số nhỏ = ưu tiên cao)
  const sortedKeys = [...enabledKeys].sort((a, b) => a.priority - b.priority)

  // Lấy các key có ưu tiên cao nhất
  const highestPriority = sortedKeys[0].priority
  const highestPriorityKeys = sortedKeys.filter(
    (keyObj) => keyObj.priority === highestPriority
  )

  // Chọn key theo round-robin trong nhóm ưu tiên cao nhất
  lastKeyIndex = (lastKeyIndex + 1) % highestPriorityKeys.length
  const selectedKeyObj = highestPriorityKeys[lastKeyIndex]

  // Kiểm tra giới hạn sử dụng
  if (
    keyUsageCounter[selectedKeyObj.key].count >=
    API_CONFIG.KEY_USAGE_LIMIT_PER_MINUTE
  ) {
    // Key này đã đạt giới hạn, thử key khác
    const remainingKeys = highestPriorityKeys.filter(
      (keyObj) =>
        keyUsageCounter[keyObj.key].count <
        API_CONFIG.KEY_USAGE_LIMIT_PER_MINUTE
    )

    if (remainingKeys.length === 0) {
      // Tất cả key ưu tiên cao đều đạt giới hạn, thử key ưu tiên thấp hơn
      const lowerPriorityKeys = sortedKeys.filter(
        (keyObj) => keyObj.priority > highestPriority
      )
      if (lowerPriorityKeys.length === 0) return null

      return selectApiKey() // Đệ quy để tìm key ưu tiên thấp hơn
    }

    // Chọn key đầu tiên trong danh sách còn lại
    const alternativeKeyObj = remainingKeys[0]
    keyUsageCounter[alternativeKeyObj.key].count++
    return alternativeKeyObj.key
  }

  // Tăng bộ đếm sử dụng
  keyUsageCounter[selectedKeyObj.key].count++
  return selectedKeyObj.key
}

/**
 * Đánh dấu key bị lỗi
 * @param {string} key API key bị lỗi
 * @param {boolean} disable Có vô hiệu hóa key không
 */
const markKeyError = (key, disable = false) => {
  const keyIndex = API_KEYS.findIndex((keyObj) => keyObj.key === key)
  if (keyIndex !== -1) {
    if (disable) {
      API_KEYS[keyIndex].enabled = false
      console.warn(`API key ${maskString(key, 3)}... đã bị vô hiệu hóa do lỗi`)
    } else {
      // Tăng bộ đếm lên max để tạm thời không dùng key này
      keyUsageCounter[key].count = API_CONFIG.KEY_USAGE_LIMIT_PER_MINUTE
      console.warn(
        `API key ${maskString(key, 3)}... tạm thời không được sử dụng`
      )
    }
  }
}

/**
 * Tạo cache key từ tham số
 * @param {string} endpoint Endpoint API
 * @param {Object} params Tham số
 * @returns {string} Cache key
 */
const createCacheKey = (endpoint, params) => {
  // Làm tròn tọa độ để tăng tỷ lệ cache hit
  if (params.lat && params.lon) {
    params.lat = Math.round(params.lat * 100) / 100
    params.lon = Math.round(params.lon * 100) / 100
  }

  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&')

  return `weather_cache_${endpoint}_${sortedParams}`
}

/**
 * Lấy dữ liệu từ cache
 * @param {string} cacheKey Cache key
 * @returns {Promise<Object|null>} Dữ liệu cache hoặc null nếu không có/hết hạn
 */
const getFromCache = async (cacheKey) => {
  try {
    const cachedData = await AsyncStorage.getItem(cacheKey)
    if (!cachedData) return null

    const {
      data,
      timestamp,
      ttl = API_CONFIG.CACHE_TTL,
    } = JSON.parse(cachedData)
    const now = Date.now()
    const age = now - timestamp

    // Kiểm tra hết hạn
    if (age > ttl) {
      // Cache đã hết hạn
      console.log(
        `Cache cho ${cacheKey} đã hết hạn (${(age / 60000).toFixed(
          1
        )} phút > ${(ttl / 60000).toFixed(1)} phút)`
      )
      return null
    }

    console.log(
      `Sử dụng cache cho ${cacheKey}, còn ${((ttl - age) / 60000).toFixed(
        1
      )} phút nữa hết hạn`
    )
    return data
  } catch (error) {
    console.error('Lỗi khi đọc cache:', error)
    return null
  }
}

/**
 * Lưu dữ liệu vào cache
 * @param {string} cacheKey Cache key
 * @param {Object} data Dữ liệu cần lưu
 * @param {number} ttl Thời gian sống của cache (ms), mặc định theo cấu hình
 */
const saveToCache = async (cacheKey, data, ttl = API_CONFIG.CACHE_TTL) => {
  try {
    const cacheData = {
      data,
      timestamp: Date.now(),
      ttl: ttl, // Lưu thời gian sống của cache
    }
    console.log(`Lưu cache cho ${cacheKey} với TTL ${ttl / 60000} phút`)
    await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData))
  } catch (error) {
    console.error('Lỗi khi lưu cache:', error)
  }
}

/**
 * Gọi API thời tiết với xử lý lỗi và cache
 * @param {string} endpoint Endpoint API (ví dụ: "weather", "forecast")
 * @param {Object} params Tham số
 * @param {number} retryCount Số lần thử lại (mặc định: theo cấu hình)
 * @returns {Promise<Object>} Dữ liệu thời tiết
 */
export const fetchWeatherData = async (
  endpoint,
  params,
  retryCount = API_CONFIG.MAX_RETRY_COUNT
) => {
  // Tạo cache key
  const cacheKey = createCacheKey(endpoint, params)

  try {
    // Kiểm tra cache
    const cachedData = await getFromCache(cacheKey)
    if (cachedData) {
      console.log('Sử dụng dữ liệu cache cho:', endpoint)
      return cachedData
    }

    // Không có cache, gọi API
    const apiKey = selectApiKey()
    if (!apiKey) {
      console.error('Không có API key khả dụng. Sử dụng dữ liệu mẫu.')

      // Lưu dữ liệu mẫu vào cache với thời gian ngắn hơn
      const fallbackData = getFallbackWeatherData(endpoint)
      await saveToCache(cacheKey, fallbackData, API_CONFIG.CACHE_TTL_FALLBACK)

      return fallbackData
    }

    try {
      console.log(`Đang gọi API thời tiết: ${endpoint}`)
      const url = `${
        API_CONFIG.WEATHER_BASE_URL
      }/${endpoint}?${new URLSearchParams({
        ...params,
        appid: apiKey,
        units: 'metric',
        lang: 'vi',
      }).toString()}`

      // Thêm timeout cho fetch request
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT)

      const response = await fetch(url, {
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId))

      if (!response.ok) {
        // Xử lý lỗi HTTP
        console.error(`Lỗi HTTP: ${response.status} ${response.statusText}`)

        if (response.status === 401 || response.status === 403) {
          // Key không hợp lệ hoặc bị khóa
          console.warn(`API key không hợp lệ: ${maskString(apiKey, 3)}`)
          markKeyError(apiKey, true)
          if (retryCount > 0) {
            console.log(`Thử lại với key khác (còn ${retryCount} lần thử)`)
            // Chờ một chút trước khi thử lại
            await new Promise((resolve) =>
              setTimeout(resolve, API_CONFIG.RETRY_DELAY)
            )
            return fetchWeatherData(endpoint, params, retryCount - 1)
          }
          console.error('Đã thử tất cả API key nhưng không thành công')

          // Lưu dữ liệu mẫu vào cache với thời gian ngắn hơn
          const fallbackData = getFallbackWeatherData(endpoint)
          await saveToCache(
            cacheKey,
            fallbackData,
            API_CONFIG.CACHE_TTL_FALLBACK
          )

          return fallbackData
        } else if (response.status === 429) {
          // Rate limit
          console.warn(`API key đã đạt giới hạn: ${maskString(apiKey, 3)}`)
          markKeyError(apiKey, false)
          if (retryCount > 0) {
            console.log(`Thử lại với key khác (còn ${retryCount} lần thử)`)
            // Chờ lâu hơn cho rate limit
            await new Promise((resolve) =>
              setTimeout(resolve, API_CONFIG.RETRY_DELAY * 2)
            )
            return fetchWeatherData(endpoint, params, retryCount - 1)
          }
          console.error('Đã thử tất cả API key nhưng không thành công')

          // Lưu dữ liệu mẫu vào cache với thời gian ngắn hơn
          const fallbackData = getFallbackWeatherData(endpoint)
          await saveToCache(
            cacheKey,
            fallbackData,
            API_CONFIG.CACHE_TTL_FALLBACK
          )

          return fallbackData
        } else {
          // Lỗi khác
          console.error(`Lỗi API không xác định: ${response.status}`)
          if (retryCount > 0) {
            console.log(`Thử lại (còn ${retryCount} lần thử)`)
            await new Promise((resolve) =>
              setTimeout(resolve, API_CONFIG.RETRY_DELAY)
            )
            return fetchWeatherData(endpoint, params, retryCount - 1)
          }

          // Lưu dữ liệu mẫu vào cache với thời gian ngắn hơn
          const fallbackData = getFallbackWeatherData(endpoint)
          await saveToCache(
            cacheKey,
            fallbackData,
            API_CONFIG.CACHE_TTL_FALLBACK
          )

          return fallbackData
        }
      }

      const data = await response.json()
      console.log(`Đã nhận dữ liệu từ API: ${endpoint}`)

      // Kiểm tra dữ liệu có hợp lệ không
      if (!data || (data.cod && data.cod !== 200 && data.cod !== '200')) {
        console.error(`Dữ liệu không hợp lệ: ${JSON.stringify(data)}`)
        if (retryCount > 0) {
          console.log(
            `Thử lại do dữ liệu không hợp lệ (còn ${retryCount} lần thử)`
          )
          await new Promise((resolve) =>
            setTimeout(resolve, API_CONFIG.RETRY_DELAY)
          )
          return fetchWeatherData(endpoint, params, retryCount - 1)
        }

        // Lưu dữ liệu mẫu vào cache với thời gian ngắn hơn
        const fallbackData = getFallbackWeatherData(endpoint)
        await saveToCache(cacheKey, fallbackData, API_CONFIG.CACHE_TTL_FALLBACK)

        return fallbackData
      }

      // Lưu vào cache
      await saveToCache(cacheKey, data)

      return data
    } catch (error) {
      console.error('Lỗi khi gọi API thời tiết:', error.message)

      if (
        (error.message.includes('Network request failed') ||
          error.name === 'AbortError') &&
        retryCount > 0
      ) {
        // Lỗi mạng hoặc timeout, thử lại
        console.log(
          `Lỗi mạng hoặc timeout, thử lại (còn ${retryCount} lần thử)`
        )
        await new Promise((resolve) =>
          setTimeout(resolve, API_CONFIG.RETRY_DELAY)
        )
        return fetchWeatherData(endpoint, params, retryCount - 1)
      }

      // Trả về dữ liệu mẫu nếu không thể kết nối
      console.warn('Sử dụng dữ liệu mẫu do không thể kết nối')

      // Lưu dữ liệu mẫu vào cache với thời gian ngắn hơn
      const fallbackData = getFallbackWeatherData(endpoint)
      await saveToCache(cacheKey, fallbackData, API_CONFIG.CACHE_TTL_FALLBACK)

      return fallbackData
    }
  } catch (error) {
    console.error('Lỗi nghiêm trọng khi xử lý dữ liệu thời tiết:', error)
    return getFallbackWeatherData(endpoint)
  }
}

/**
 * Trả về dữ liệu thời tiết mẫu khi không thể kết nối API
 * @param {string} endpoint Endpoint API
 * @returns {Object} Dữ liệu thời tiết mẫu
 */
const getFallbackWeatherData = (endpoint) => {
  const now = Math.floor(Date.now() / 1000)

  if (endpoint === 'weather') {
    return {
      coord: { lon: 105.8342, lat: 21.0278 },
      weather: [
        {
          id: 800,
          main: 'Clear',
          description: 'trời quang đãng',
          icon: '01d',
        },
      ],
      base: 'stations',
      main: {
        temp: 28,
        feels_like: 30,
        temp_min: 26,
        temp_max: 30,
        pressure: 1012,
        humidity: 65,
      },
      visibility: 10000,
      wind: {
        speed: 2.5,
        deg: 120,
      },
      clouds: {
        all: 0,
      },
      dt: now,
      sys: {
        type: 2,
        id: 2000065,
        country: 'VN',
        sunrise: now - 21600, // 6 giờ trước
        sunset: now + 21600, // 6 giờ sau
      },
      timezone: 25200,
      id: 1581130,
      name: 'Hà Nội',
      cod: 200,
    }
  } else if (endpoint === 'forecast') {
    const list = []
    for (let i = 0; i < 40; i++) {
      list.push({
        dt: now + i * 3600,
        main: {
          temp: 25 + Math.floor(Math.random() * 10),
          feels_like: 28 + Math.floor(Math.random() * 8),
          temp_min: 24 + Math.floor(Math.random() * 5),
          temp_max: 30 + Math.floor(Math.random() * 5),
          pressure: 1010 + Math.floor(Math.random() * 10),
          humidity: 60 + Math.floor(Math.random() * 20),
        },
        weather: [
          {
            id: 800 + Math.floor(Math.random() * 3),
            main: 'Clear',
            description: 'trời quang đãng',
            icon: '01d',
          },
        ],
        clouds: {
          all: Math.floor(Math.random() * 30),
        },
        wind: {
          speed: 1 + Math.random() * 4,
          deg: Math.floor(Math.random() * 360),
        },
        visibility: 10000,
        pop: Math.random() * 0.3,
        sys: {
          pod: i % 2 === 0 ? 'd' : 'n',
        },
        dt_txt: new Date((now + i * 3600) * 1000).toISOString(),
      })
    }

    return {
      cod: '200',
      message: 0,
      cnt: list.length,
      list,
      city: {
        id: 1581130,
        name: 'Hà Nội',
        coord: { lon: 105.8342, lat: 21.0278 },
        country: 'VN',
        population: 1000000,
        timezone: 25200,
        sunrise: now - 21600,
        sunset: now + 21600,
      },
    }
  }

  // Trường hợp khác, trả về đối tượng rỗng
  return {}
}

/**
 * Lấy dữ liệu thời tiết hiện tại
 * @param {number} lat Vĩ độ
 * @param {number} lon Kinh độ
 * @returns {Promise<Object>} Dữ liệu thời tiết hiện tại
 */
export const getCurrentWeather = async (
  lat = API_CONFIG.DEFAULT_LOCATION.lat,
  lon = API_CONFIG.DEFAULT_LOCATION.lon
) => {
  return fetchWeatherData('weather', { lat, lon })
}

/**
 * Lấy dự báo thời tiết
 * @param {number} lat Vĩ độ
 * @param {number} lon Kinh độ
 * @returns {Promise<Object>} Dữ liệu dự báo thời tiết
 */
export const getWeatherForecast = async (
  lat = API_CONFIG.DEFAULT_LOCATION.lat,
  lon = API_CONFIG.DEFAULT_LOCATION.lon
) => {
  return fetchWeatherData('forecast', { lat, lon })
}

/**
 * Xóa tất cả cache thời tiết
 */
export const clearWeatherCache = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys()
    const weatherCacheKeys = keys.filter((key) =>
      key.startsWith('weather_cache_')
    )
    if (weatherCacheKeys.length > 0) {
      await AsyncStorage.multiRemove(weatherCacheKeys)
      console.log(`Đã xóa ${weatherCacheKeys.length} cache thời tiết`)
    }
  } catch (error) {
    console.error('Lỗi khi xóa cache thời tiết:', error)
  }
}

/**
 * Thêm API key mới
 * @param {string} key API key
 * @param {string} type Loại key ("free" hoặc "paid")
 * @param {number} priority Ưu tiên (số nhỏ = ưu tiên cao)
 */
export const addApiKey = async (key, type = 'free', priority = 10) => {
  // Kiểm tra key đã tồn tại chưa
  const existingKeyIndex = API_KEYS.findIndex((keyObj) => keyObj.key === key)
  if (existingKeyIndex !== -1) {
    // Cập nhật key hiện có
    API_KEYS[existingKeyIndex] = {
      ...API_KEYS[existingKeyIndex],
      type,
      priority,
      enabled: true,
    }
  } else {
    // Thêm key mới
    API_KEYS.push({
      key,
      type,
      priority,
      enabled: true,
    })
  }

  // Khởi tạo bộ đếm cho key mới
  if (!keyUsageCounter[key]) {
    keyUsageCounter[key] = {
      count: 0,
      lastReset: Date.now(),
    }
  }

  // Lưu danh sách key vào AsyncStorage (đã mã hóa)
  try {
    await secureStore(STORAGE_KEYS.WEATHER_API_KEYS, API_KEYS)
    return true
  } catch (error) {
    console.error('Lỗi khi lưu API keys:', error)
    return false
  }
}

/**
 * Xóa API key
 * @param {string} key API key cần xóa
 */
export const removeApiKey = async (key) => {
  const keyIndex = API_KEYS.findIndex((keyObj) => keyObj.key === key)
  if (keyIndex !== -1) {
    API_KEYS.splice(keyIndex, 1)
    delete keyUsageCounter[key]

    // Lưu danh sách key vào AsyncStorage (đã mã hóa)
    try {
      await secureStore(STORAGE_KEYS.WEATHER_API_KEYS, API_KEYS)
      return true
    } catch (error) {
      console.error('Lỗi khi lưu API keys:', error)
      return false
    }
  }
  return false
}

/**
 * Kích hoạt/vô hiệu hóa API key
 * @param {string} key API key
 * @param {boolean} enabled Trạng thái kích hoạt
 */
export const toggleApiKey = async (key, enabled) => {
  const keyIndex = API_KEYS.findIndex((keyObj) => keyObj.key === key)
  if (keyIndex !== -1) {
    API_KEYS[keyIndex].enabled = enabled

    // Lưu danh sách key vào AsyncStorage (đã mã hóa)
    try {
      await secureStore(STORAGE_KEYS.WEATHER_API_KEYS, API_KEYS)
      return true
    } catch (error) {
      console.error('Lỗi khi lưu API keys:', error)
      return false
    }
  }
  return false
}

/**
 * Lấy danh sách API key
 * @returns {Array} Danh sách API key
 */
export const getApiKeys = () => {
  return API_KEYS.map((keyObj) => ({
    ...keyObj,
    key: maskString(keyObj.key, 3), // Ẩn key, chỉ hiển thị 3 ký tự đầu và cuối
    usage: keyUsageCounter[keyObj.key]?.count || 0,
  }))
}

/**
 * Khởi tạo service
 */
export const initWeatherService = async () => {
  try {
    // Tải danh sách key từ AsyncStorage (đã mã hóa)
    const savedKeys = await secureRetrieve(STORAGE_KEYS.WEATHER_API_KEYS)
    if (savedKeys) {
      // Cập nhật danh sách key
      API_KEYS.length = 0 // Xóa tất cả phần tử hiện có
      savedKeys.forEach((keyObj) => {
        API_KEYS.push(keyObj)

        // Khởi tạo bộ đếm
        if (!keyUsageCounter[keyObj.key]) {
          keyUsageCounter[keyObj.key] = {
            count: 0,
            lastReset: Date.now(),
          }
        }
      })
    }
  } catch (error) {
    console.error('Lỗi khi khởi tạo Weather Service:', error)
  }
}

// Khởi tạo service khi import
initWeatherService()

/**
 * Lấy dự báo thời tiết theo giờ
 * @param {number} lat Vĩ độ
 * @param {number} lon Kinh độ
 * @returns {Promise<Array>} Dữ liệu dự báo thời tiết theo giờ
 */
export const getHourlyForecast = async (
  lat = API_CONFIG.DEFAULT_LOCATION.lat,
  lon = API_CONFIG.DEFAULT_LOCATION.lon
) => {
  try {
    console.log(`Đang lấy dự báo thời tiết theo giờ cho vị trí: ${lat}, ${lon}`)
    const forecastData = await fetchWeatherData('forecast', { lat, lon })

    if (!forecastData || !forecastData.list) {
      console.warn('Dữ liệu dự báo không hợp lệ hoặc không có danh sách dự báo')
      return generateFallbackHourlyForecast()
    }

    console.log(`Đã nhận ${forecastData.list.length} dự báo theo giờ`)
    return forecastData.list
  } catch (error) {
    console.error('Lỗi trong getHourlyForecast:', error)
    return generateFallbackHourlyForecast() // Trả về dữ liệu mẫu nếu có lỗi
  }
}

/**
 * Tạo dữ liệu dự báo theo giờ mẫu
 * @returns {Array} Dữ liệu dự báo theo giờ mẫu
 */
const generateFallbackHourlyForecast = () => {
  const now = Math.floor(Date.now() / 1000)
  const result = []

  // Tạo dự báo cho 12 giờ tiếp theo (mỗi 3 giờ)
  for (let i = 0; i < 12; i++) {
    const hour = new Date((now + i * 3600) * 1000).getHours()
    const isDay = hour >= 6 && hour < 18

    result.push({
      dt: now + i * 3600,
      main: {
        temp: isDay
          ? 25 + Math.floor(Math.random() * 8)
          : 20 + Math.floor(Math.random() * 5),
        feels_like: isDay
          ? 27 + Math.floor(Math.random() * 8)
          : 21 + Math.floor(Math.random() * 5),
        temp_min: isDay
          ? 24 + Math.floor(Math.random() * 3)
          : 19 + Math.floor(Math.random() * 3),
        temp_max: isDay
          ? 28 + Math.floor(Math.random() * 5)
          : 22 + Math.floor(Math.random() * 3),
        pressure: 1010 + Math.floor(Math.random() * 10),
        humidity: 60 + Math.floor(Math.random() * 20),
      },
      weather: [
        {
          id: isDay ? 800 : 801,
          main: isDay ? 'Clear' : 'Clouds',
          description: isDay ? 'trời quang đãng' : 'mây rải rác',
          icon: isDay ? '01d' : '02n',
        },
      ],
      clouds: {
        all: isDay
          ? Math.floor(Math.random() * 20)
          : 20 + Math.floor(Math.random() * 40),
      },
      wind: {
        speed: 1 + Math.random() * 3,
        deg: Math.floor(Math.random() * 360),
      },
      visibility: 10000,
      pop: Math.random() * 0.2,
      sys: {
        pod: isDay ? 'd' : 'n',
      },
      dt_txt: new Date((now + i * 3600) * 1000).toISOString(),
    })
  }

  console.log('Đã tạo dữ liệu dự báo theo giờ mẫu')
  return result
}

/**
 * Lấy cảnh báo thời tiết
 * @param {number} lat Vĩ độ
 * @param {number} lon Kinh độ
 * @returns {Promise<Array>} Danh sách cảnh báo thời tiết
 */
export const getWeatherAlerts = async (
  lat = API_CONFIG.DEFAULT_LOCATION.lat,
  lon = API_CONFIG.DEFAULT_LOCATION.lon
) => {
  try {
    console.log(`Đang lấy cảnh báo thời tiết cho vị trí: ${lat}, ${lon}`)

    // OpenWeatherMap API miễn phí không hỗ trợ cảnh báo trực tiếp
    // Chúng ta sẽ kiểm tra điều kiện thời tiết và tạo cảnh báo nếu cần
    const currentWeather = await getCurrentWeather(lat, lon)
    const alerts = []

    // Kiểm tra điều kiện thời tiết khắc nghiệt
    if (
      currentWeather &&
      currentWeather.weather &&
      currentWeather.weather.length > 0
    ) {
      const weatherId = currentWeather.weather[0].id
      console.log(`Mã thời tiết hiện tại: ${weatherId}`)

      // Các mã thời tiết khắc nghiệt: https://openweathermap.org/weather-conditions
      if (weatherId >= 200 && weatherId < 300) {
        // Giông bão
        alerts.push({
          event: 'Giông bão',
          severity: 'severe',
          message:
            'Cảnh báo giông bão trong khu vực của bạn. Hãy cẩn thận khi di chuyển.',
        })
      } else if (weatherId >= 300 && weatherId < 400) {
        // Mưa phùn
        alerts.push({
          event: 'Mưa phùn',
          severity: 'moderate',
          message: 'Mưa phùn có thể gây trơn trượt. Hãy lái xe cẩn thận.',
        })
      } else if (weatherId >= 500 && weatherId < 600) {
        // Mưa
        if (weatherId >= 502) {
          // Mưa lớn
          alerts.push({
            event: 'Mưa lớn',
            severity: 'severe',
            message:
              'Cảnh báo mưa lớn có thể gây ngập lụt. Hạn chế di chuyển nếu có thể.',
          })
        } else {
          // Mưa nhẹ đến vừa
          alerts.push({
            event: 'Mưa',
            severity: 'low',
            message: 'Có mưa trong khu vực. Hãy mang theo ô khi ra ngoài.',
          })
        }
      } else if (weatherId >= 600 && weatherId < 700) {
        // Tuyết
        alerts.push({
          event: 'Tuyết rơi',
          severity: 'moderate',
          message:
            'Tuyết rơi có thể gây trơn trượt và tầm nhìn hạn chế. Hãy cẩn thận.',
        })
      } else if (weatherId >= 700 && weatherId < 800) {
        // Sương mù, bụi, tro, cát...
        if (weatherId === 781) {
          // Lốc xoáy
          alerts.push({
            event: 'Lốc xoáy',
            severity: 'severe',
            message:
              'CẢNH BÁO KHẨN CẤP: Lốc xoáy trong khu vực. Tìm nơi trú ẩn ngay lập tức!',
          })
        } else {
          alerts.push({
            event: 'Tầm nhìn hạn chế',
            severity: 'moderate',
            message:
              'Tầm nhìn hạn chế do sương mù hoặc bụi. Hãy lái xe cẩn thận.',
          })
        }
      }

      // Kiểm tra nhiệt độ cực đoan
      if (currentWeather.main) {
        const temp = currentWeather.main.temp
        console.log(`Nhiệt độ hiện tại: ${temp}°C`)

        if (temp > 35) {
          alerts.push({
            event: 'Nắng nóng',
            severity: 'moderate',
            message:
              'Nhiệt độ cao có thể gây say nắng. Hãy uống đủ nước và tránh hoạt động ngoài trời.',
          })
        } else if (temp > 32) {
          alerts.push({
            event: 'Nắng nóng',
            severity: 'low',
            message:
              'Nhiệt độ khá cao. Hãy uống đủ nước và hạn chế hoạt động ngoài trời.',
          })
        } else if (temp < 5) {
          alerts.push({
            event: 'Lạnh đậm',
            severity: 'moderate',
            message:
              'Nhiệt độ thấp có thể gây hạ thân nhiệt. Hãy mặc đủ ấm khi ra ngoài.',
          })
        } else if (temp < 10) {
          alerts.push({
            event: 'Lạnh',
            severity: 'low',
            message: 'Thời tiết lạnh. Hãy mặc ấm khi ra ngoài.',
          })
        }
      }

      // Kiểm tra gió mạnh
      if (currentWeather.wind && currentWeather.wind.speed > 10) {
        alerts.push({
          event: 'Gió mạnh',
          severity: 'moderate',
          message: 'Gió mạnh có thể gây nguy hiểm. Hãy cẩn thận khi ra ngoài.',
        })
      }
    }

    console.log(`Đã tạo ${alerts.length} cảnh báo thời tiết`)
    return alerts
  } catch (error) {
    console.error('Lỗi khi lấy cảnh báo thời tiết:', error)

    // Trả về cảnh báo mẫu nếu có lỗi
    return generateFallbackAlerts()
  }
}

/**
 * Tạo cảnh báo thời tiết mẫu
 * @returns {Array} Danh sách cảnh báo thời tiết mẫu
 */
const generateFallbackAlerts = () => {
  const now = new Date()
  const hour = now.getHours()

  // Tạo cảnh báo dựa trên thời gian trong ngày
  if (hour >= 11 && hour <= 14) {
    // Giữa trưa
    return [
      {
        event: 'Nắng nóng',
        severity: 'low',
        message:
          'Nhiệt độ cao vào buổi trưa. Hãy uống đủ nước và tránh hoạt động ngoài trời.',
      },
    ]
  } else if (hour >= 16 && hour <= 19) {
    // Chiều tối
    return [
      {
        event: 'Mưa rào',
        severity: 'low',
        message:
          'Có thể có mưa rào vào buổi tối. Hãy mang theo ô khi ra ngoài.',
      },
    ]
  }

  // Trường hợp khác, không có cảnh báo
  return []
}

/**
 * Lấy dự báo thời tiết theo ngày
 * @param {number} lat Vĩ độ
 * @param {number} lon Kinh độ
 * @returns {Promise<Array>} Dữ liệu dự báo thời tiết theo ngày
 */
export const getDailyForecast = async (
  lat = API_CONFIG.DEFAULT_LOCATION.lat,
  lon = API_CONFIG.DEFAULT_LOCATION.lon
) => {
  try {
    console.log(
      `Đang lấy dự báo thời tiết theo ngày cho vị trí: ${lat}, ${lon}`
    )

    // OpenWeatherMap API miễn phí không có endpoint riêng cho dự báo theo ngày
    // Chúng ta sẽ chuyển đổi dự báo theo giờ thành dự báo theo ngày
    const hourlyForecast = await getHourlyForecast(lat, lon)

    if (!hourlyForecast || hourlyForecast.length === 0) {
      console.warn(
        'Không có dữ liệu dự báo theo giờ để chuyển đổi thành dự báo theo ngày'
      )
      return generateFallbackDailyForecast()
    }

    // Nhóm dự báo theo ngày
    const dailyMap = new Map()

    hourlyForecast.forEach((item) => {
      const date = new Date(item.dt * 1000)
      const dateKey = date.toISOString().split('T')[0] // YYYY-MM-DD

      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, {
          dt: item.dt,
          temp: {
            min: item.main.temp,
            max: item.main.temp,
          },
          weather: [item.weather[0]],
          humidity: item.main.humidity,
          pressure: item.main.pressure,
          wind_speed: item.wind.speed,
          pop: item.pop || 0, // Xác suất mưa
        })
      } else {
        const dailyData = dailyMap.get(dateKey)

        // Cập nhật nhiệt độ min/max
        dailyData.temp.min = Math.min(dailyData.temp.min, item.main.temp)
        dailyData.temp.max = Math.max(dailyData.temp.max, item.main.temp)

        // Cập nhật xác suất mưa cao nhất
        if (item.pop && item.pop > dailyData.pop) {
          dailyData.pop = item.pop
        }

        // Sử dụng thời tiết của giờ giữa ngày (12:00) nếu có
        const hour = date.getHours()
        if (hour === 12 || hour === 13) {
          dailyData.weather = [item.weather[0]]
        }
      }
    })

    // Chuyển đổi Map thành mảng
    const result = Array.from(dailyMap.values())
    console.log(`Đã tạo ${result.length} dự báo theo ngày`)
    return result
  } catch (error) {
    console.error('Lỗi khi lấy dự báo theo ngày:', error)
    return generateFallbackDailyForecast()
  }
}

/**
 * Tạo dữ liệu dự báo theo ngày mẫu
 * @returns {Array} Dữ liệu dự báo theo ngày mẫu
 */
const generateFallbackDailyForecast = () => {
  const now = Math.floor(Date.now() / 1000)
  const result = []

  // Tạo dự báo cho 5 ngày tiếp theo
  for (let i = 0; i < 5; i++) {
    // Tính thời gian cho ngày tiếp theo (86400 = số giây trong 1 ngày)
    const dayTime = now + i * 86400
    const date = new Date(dayTime * 1000)

    // Xác định thời tiết ngẫu nhiên cho ngày
    const weatherTypes = [
      { id: 800, main: 'Clear', description: 'trời quang đãng', icon: '01d' },
      { id: 801, main: 'Clouds', description: 'mây rải rác', icon: '02d' },
      { id: 500, main: 'Rain', description: 'mưa nhẹ', icon: '10d' },
      { id: 803, main: 'Clouds', description: 'mây nhiều', icon: '03d' },
    ]

    const randomWeather =
      weatherTypes[Math.floor(Math.random() * weatherTypes.length)]

    // Nhiệt độ thay đổi theo ngày
    const baseTemp = 25 + Math.sin((i * Math.PI) / 2.5) * 5

    result.push({
      dt: dayTime,
      temp: {
        min: Math.round(baseTemp - 5 + Math.random() * 2),
        max: Math.round(baseTemp + 5 + Math.random() * 2),
      },
      weather: [randomWeather],
      humidity: 60 + Math.floor(Math.random() * 20),
      pressure: 1010 + Math.floor(Math.random() * 10),
      wind_speed: 1 + Math.random() * 4,
      pop:
        randomWeather.id >= 500 && randomWeather.id < 600
          ? 0.5 + Math.random() * 0.5
          : Math.random() * 0.3,
    })
  }

  console.log('Đã tạo dữ liệu dự báo theo ngày mẫu')
  return result
}

export default {
  getCurrentWeather,
  getWeatherForecast,
  getHourlyForecast,
  getWeatherAlerts,
  getDailyForecast,
  clearWeatherCache,
  addApiKey,
  removeApiKey,
  toggleApiKey,
  getApiKeys,
  initWeatherService,
}
