import React, {
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { AppContext } from '../context/AppContext'
import { getWeatherIcon } from '../utils/helpers'
import weatherService from '../services/weatherService'

// Lấy chiều rộng màn hình để tính toán kích thước
const { width } = Dimensions.get('window')

const WeatherWidget = ({ onPress }) => {
  const { darkMode, theme, homeLocation, workLocation, t } =
    useContext(AppContext)
  const [currentWeather, setCurrentWeather] = useState(null)
  const [forecast, setForecast] = useState([])
  const [weatherAlert, setWeatherAlert] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Thêm state để lưu thời tiết ở vị trí công ty (nếu có)
  const [workWeather, setWorkWeather] = useState(null)
  const [workForecast, setWorkForecast] = useState([])

  // State để kiểm soát hiển thị cảnh báo thông minh
  const [smartAlert, setSmartAlert] = useState(null)

  // Di chuyển hàm fetchWeatherData ra ngoài useEffect để có thể tái sử dụng
  const fetchWeatherData = async (forceRefresh = false) => {
    let isMounted = true
    try {
      setLoading(true)

      // Sử dụng vị trí nhà làm vị trí chính, nếu không có thì dùng vị trí công ty
      const primaryLocation = homeLocation || workLocation

      if (!primaryLocation) {
        setLoading(false)
        return
      }

      // Nếu yêu cầu làm mới, xóa cache thời tiết trước
      if (forceRefresh) {
        await weatherService.clearWeatherCache()
      }

      // Biến để theo dõi dữ liệu thời tiết ở cả hai vị trí
      let homeWeatherData = null
      let homeHourlyForecast = []
      let homeAlerts = []

      let workWeatherData = null
      let workHourlyForecast = []
      let workAlerts = []

      // 1. Lấy dữ liệu thời tiết cho vị trí nhà (nếu có)
      if (homeLocation) {
        try {
          // Lấy thời tiết hiện tại
          homeWeatherData = await weatherService.getCurrentWeather(
            homeLocation.latitude,
            homeLocation.longitude
          )

          // Lấy dự báo theo giờ
          const homeForecast = await weatherService.getHourlyForecast(
            homeLocation.latitude,
            homeLocation.longitude
          )

          if (homeForecast && homeForecast.length > 0) {
            // Lấy thời gian hiện tại
            const now = new Date()

            // Lọc và sắp xếp dự báo để lấy 4 giờ tiếp theo liên tiếp
            const filteredForecast = homeForecast
              .filter((item) => new Date(item.dt * 1000) > now)
              .sort((a, b) => a.dt - b.dt)
              .slice(0, 4)

            homeHourlyForecast = filteredForecast
          }

          // Lấy cảnh báo thời tiết
          const alerts = await weatherService.getWeatherAlerts(
            homeLocation.latitude,
            homeLocation.longitude
          )

          if (alerts && alerts.length > 0) {
            homeAlerts = alerts
          }
        } catch (error) {
          console.error('Error fetching home location weather:', error)
        }
      }

      // 2. Lấy dữ liệu thời tiết cho vị trí công ty (nếu có và khác vị trí nhà)
      if (
        workLocation &&
        homeLocation &&
        (workLocation.latitude !== homeLocation.latitude ||
          workLocation.longitude !== homeLocation.longitude)
      ) {
        try {
          // Lấy thời tiết hiện tại
          workWeatherData = await weatherService.getCurrentWeather(
            workLocation.latitude,
            workLocation.longitude
          )

          // Lấy dự báo theo giờ
          const workForecast = await weatherService.getHourlyForecast(
            workLocation.latitude,
            workLocation.longitude
          )

          if (workForecast && workForecast.length > 0) {
            // Lấy thời gian hiện tại
            const now = new Date()

            // Lọc và sắp xếp dự báo để lấy 4 giờ tiếp theo liên tiếp
            const filteredForecast = workForecast
              .filter((item) => new Date(item.dt * 1000) > now)
              .sort((a, b) => a.dt - b.dt)
              .slice(0, 4)

            workHourlyForecast = filteredForecast
          }

          // Lấy cảnh báo thời tiết
          const alerts = await weatherService.getWeatherAlerts(
            workLocation.latitude,
            workLocation.longitude
          )

          if (alerts && alerts.length > 0) {
            workAlerts = alerts
          }
        } catch (error) {
          console.error('Error fetching work location weather:', error)
        }
      }

      if (!isMounted) return

      // 3. Cập nhật state với dữ liệu đã lấy được
      // Vị trí chính (nhà hoặc công ty)
      setCurrentWeather(homeWeatherData || workWeatherData)
      setForecast(
        homeHourlyForecast.length > 0 ? homeHourlyForecast : workHourlyForecast
      )

      // Vị trí công ty (nếu khác vị trí nhà)
      setWorkWeather(workWeatherData)
      setWorkForecast(workHourlyForecast)

      // Cảnh báo thời tiết
      const primaryAlert =
        homeAlerts.length > 0
          ? homeAlerts[0]
          : workAlerts.length > 0
          ? workAlerts[0]
          : null
      setWeatherAlert(primaryAlert)

      // 4. Tạo cảnh báo thông minh dựa trên dữ liệu thời tiết ở cả hai vị trí
      generateSmartAlert(
        homeWeatherData,
        homeHourlyForecast,
        workWeatherData,
        workHourlyForecast
      )

      setLoading(false)
      setRefreshing(false)
    } catch (error) {
      console.error('Error in weather data fetching process:', error)
      setLoading(false)
      setRefreshing(false)
    }

    return () => {
      isMounted = false
    }
  }

  // Hàm tạo cảnh báo thông minh dựa trên dữ liệu thời tiết ở cả hai vị trí
  const generateSmartAlert = (
    homeWeather,
    homeForecast,
    workWeather,
    workForecast
  ) => {
    // Nếu không có dữ liệu thời tiết ở cả hai vị trí, không tạo cảnh báo
    if (!homeWeather && !workWeather) {
      setSmartAlert(null)
      return
    }

    // Kiểm tra xem có mưa ở vị trí nhà không
    const isRainingAtHome = checkForRain(homeWeather, homeForecast)

    // Kiểm tra xem có mưa ở vị trí công ty không
    const isRainingAtWork = checkForRain(workWeather, workForecast)

    // Nếu có mưa ở cả hai vị trí
    if (isRainingAtHome.willRain && isRainingAtWork.willRain) {
      const message = `${t('Rain expected at home')} (~${
        isRainingAtHome.time
      }). ${t('Note: It will also rain at work')} (~${
        isRainingAtWork.time
      }), ${t('remember to bring an umbrella from home')}!`
      setSmartAlert({
        type: 'rain',
        message,
        severity: 'warning',
      })
    }
    // Nếu chỉ có mưa ở vị trí nhà
    else if (isRainingAtHome.willRain) {
      const message = `${t('Rain expected at home')} (~${
        isRainingAtHome.time
      }).`
      setSmartAlert({
        type: 'rain',
        message,
        severity: 'info',
      })
    }
    // Nếu chỉ có mưa ở vị trí công ty
    else if (isRainingAtWork.willRain) {
      const message = `${t('Rain expected at work')} (~${
        isRainingAtWork.time
      }). ${t('Consider bringing an umbrella')}!`
      setSmartAlert({
        type: 'rain',
        message,
        severity: 'warning',
      })
    }
    // Nếu không có mưa ở cả hai vị trí
    else {
      setSmartAlert(null)
    }
  }

  // Hàm kiểm tra xem có mưa không dựa trên dữ liệu thời tiết
  const checkForRain = (currentWeather, forecast) => {
    const result = { willRain: false, time: '' }

    // Kiểm tra thời tiết hiện tại
    if (currentWeather && currentWeather.weather && currentWeather.weather[0]) {
      const weatherId = currentWeather.weather[0].id
      // Mã thời tiết từ 200-599 là các loại mưa, bão, tuyết
      if (weatherId >= 200 && weatherId < 600) {
        result.willRain = true
        result.time = t('now')
        return result
      }
    }

    // Kiểm tra dự báo
    if (forecast && forecast.length > 0) {
      for (let i = 0; i < forecast.length; i++) {
        const item = forecast[i]
        if (item.weather && item.weather[0]) {
          const weatherId = item.weather[0].id
          // Mã thời tiết từ 200-599 là các loại mưa, bão, tuyết
          if (weatherId >= 200 && weatherId < 600) {
            result.willRain = true
            // Định dạng thời gian
            const time = new Date(item.dt * 1000)
            const hours = time.getHours()
            const minutes = time.getMinutes()
            result.time = `${hours.toString().padStart(2, '0')}:${minutes
              .toString()
              .padStart(2, '0')}`
            return result
          }
        }
      }
    }

    return result
  }

  // Hàm làm mới dữ liệu thời tiết
  const refreshWeatherData = async () => {
    setRefreshing(true)
    await fetchWeatherData(true) // Truyền true để xóa cache
  }

  // Sử dụng useCallback để tránh tạo lại hàm fetchWeatherData mỗi khi render
  const memoizedFetchWeatherData = useCallback(fetchWeatherData, [
    homeLocation,
    workLocation,
    generateSmartAlert, // Added to resolve ESLint warning
  ])

  // Sử dụng useRef để theo dõi lần mount đầu tiên
  const isFirstMount = useRef(true)

  useEffect(() => {
    // Chỉ fetch dữ liệu khi component được mount lần đầu
    // hoặc khi các dependency thực sự thay đổi
    if (isFirstMount.current) {
      isFirstMount.current = false
      memoizedFetchWeatherData()
    } else if (homeLocation || workLocation) {
      // Chỉ fetch lại khi vị trí thay đổi
      memoizedFetchWeatherData()
    }
  }, [homeLocation, workLocation, memoizedFetchWeatherData])

  if (loading) {
    return (
      <View
        style={{
          backgroundColor: theme.cardColor,
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <ActivityIndicator size="large" color={theme.primaryColor} />
      </View>
    )
  }

  if (!homeLocation && !workLocation) {
    return (
      <TouchableOpacity
        style={{
          backgroundColor: theme.cardColor,
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
        }}
        onPress={onPress}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <Ionicons name="location-outline" size={24} color={theme.textColor} />
          <Text style={{ fontSize: 16, color: theme.textColor, marginLeft: 8 }}>
            {t('Set up your location for weather information')}
          </Text>
        </View>
      </TouchableOpacity>
    )
  }

  if (!currentWeather) {
    return (
      <TouchableOpacity
        style={{
          backgroundColor: theme.cardColor,
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
        }}
        onPress={onPress}
      >
        <Text
          style={{
            fontSize: 16,
            color: theme.textColor,
            textAlign: 'center',
            padding: 16,
          }}
        >
          {t('Unable to load weather data')}
        </Text>
      </TouchableOpacity>
    )
  }

  const location = homeLocation || workLocation

  // Lấy tên địa điểm từ API thời tiết hoặc địa chỉ đã lưu
  let locationName = ''

  // Ưu tiên sử dụng tên thành phố từ API thời tiết
  if (currentWeather && currentWeather.name) {
    locationName = currentWeather.name
  }
  // Nếu không có tên từ API, sử dụng địa chỉ đã lưu
  else if (location?.address) {
    // Nếu có địa chỉ đầy đủ, lấy phần tên địa điểm (thường là phần đầu tiên)
    const addressParts = location.address.split(',')
    if (addressParts.length > 0) {
      // Lấy phần đầu tiên của địa chỉ (thường là tên đường hoặc địa điểm)
      const firstPart = addressParts[0].trim()
      // Nếu phần đầu quá dài, cắt bớt
      locationName =
        firstPart.length > 25 ? firstPart.substring(0, 22) + '...' : firstPart
    } else {
      locationName = location.address
    }
  }
  // Nếu không có cả hai, sử dụng "Vị trí hiện tại"
  else {
    locationName = t('Current Location')
  }

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: theme.cardColor }]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      {/* Phần 1: Thông tin thời tiết hiện tại */}
      <View style={styles.currentWeatherRow}>
        <View style={styles.weatherIconContainer}>
          {getWeatherIcon(currentWeather.weather[0].icon, 48, theme.textColor)}
        </View>
        <View style={styles.weatherInfoContainer}>
          <Text style={[styles.temperature, { color: theme.textColor }]}>
            {Math.round(currentWeather.main.temp)}°C
          </Text>
          <Text style={[styles.weatherDescription, { color: theme.textColor }]}>
            {currentWeather.weather[0].description}
          </Text>
          <Text style={[styles.locationName, { color: theme.subtextColor }]}>
            {locationName}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.refreshButton,
            {
              backgroundColor: darkMode
                ? 'rgba(255,255,255,0.1)'
                : 'rgba(0,0,0,0.05)',
            },
          ]}
          onPress={refreshWeatherData}
          disabled={refreshing}
        >
          <Ionicons
            name={refreshing ? 'refresh-circle' : 'refresh-outline'}
            size={24}
            color={theme.textColor}
            style={refreshing ? { opacity: 0.7 } : {}}
          />
        </TouchableOpacity>
      </View>

      {/* Phần 2: Dự báo 4 giờ tiếp theo */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.forecastScrollView}
        contentContainerStyle={styles.forecastContainer}
      >
        {forecast.map((item, index) => {
          const time = new Date(item.dt * 1000)
          const hours = time.getHours()
          const minutes = time.getMinutes()
          const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes
            .toString()
            .padStart(2, '0')}`

          return (
            <View
              key={index}
              style={[
                styles.forecastItem,
                {
                  backgroundColor: darkMode
                    ? 'rgba(255,255,255,0.05)'
                    : 'rgba(0,0,0,0.03)',
                },
              ]}
            >
              <Text
                style={[styles.forecastTime, { color: theme.subtextColor }]}
              >
                {formattedTime}
              </Text>
              {getWeatherIcon(item.weather[0].icon, 32, theme.textColor)}
              <Text style={[styles.forecastTemp, { color: theme.textColor }]}>
                {Math.round(item.main.temp)}°C
              </Text>
              <Text
                style={[styles.forecastDesc, { color: theme.subtextColor }]}
              >
                {item.weather[0].main}
              </Text>
            </View>
          )
        })}
      </ScrollView>

      {/* Phần 3: Cảnh báo thông minh (nếu có) */}
      {smartAlert && (
        <View
          style={[
            styles.alertContainer,
            {
              backgroundColor:
                smartAlert.severity === 'warning'
                  ? theme.warningColor
                  : theme.infoColor,
            },
          ]}
        >
          <View style={styles.alertIconContainer}>
            {smartAlert.type === 'rain' ? (
              <MaterialCommunityIcons
                name="weather-pouring"
                size={24}
                color="#fff"
              />
            ) : (
              <Ionicons name="warning" size={24} color="#fff" />
            )}
          </View>
          <Text style={styles.alertText}>{smartAlert.message}</Text>
        </View>
      )}

      {/* Phần 4: Cảnh báo thời tiết từ API (nếu có và không có cảnh báo thông minh) */}
      {!smartAlert && weatherAlert && (
        <View
          style={[
            styles.alertContainer,
            {
              backgroundColor:
                weatherAlert.severity === 'severe'
                  ? theme.errorColor
                  : theme.warningColor,
            },
          ]}
        >
          <View style={styles.alertIconContainer}>
            <Ionicons name="warning" size={24} color="#fff" />
          </View>
          <Text style={styles.alertText}>{weatherAlert.message}</Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff', // Sẽ được ghi đè bởi theme.cardColor
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  currentWeatherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  weatherIconContainer: {
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weatherInfoContainer: {
    flex: 1,
  },
  temperature: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  weatherDescription: {
    fontSize: 16,
    textTransform: 'capitalize',
    marginBottom: 2,
  },
  locationName: {
    fontSize: 14,
  },
  refreshButton: {
    padding: 10,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forecastScrollView: {
    marginBottom: 12,
  },
  forecastContainer: {
    paddingVertical: 4,
  },
  forecastItem: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    minWidth: 80,
  },
  forecastTime: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  forecastTemp: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
  forecastDesc: {
    fontSize: 12,
    textTransform: 'capitalize',
    marginTop: 4,
  },
  alertContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginTop: 4,
  },
  alertIconContainer: {
    marginRight: 12,
  },
  alertText: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
})

export default WeatherWidget
