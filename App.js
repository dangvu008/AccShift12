'use client'

import { useEffect, useState, useContext } from 'react'
import { StatusBar } from 'expo-status-bar'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createStackNavigator } from '@react-navigation/stack'
import { Ionicons } from '@expo/vector-icons'
import * as Notifications from 'expo-notifications'
import AsyncStorage from '@react-native-async-storage/async-storage'
// Import JSDoc types
// @ts-ignore
import './types.js'
import { AppProvider, AppContext } from './context/AppContext'
import { createSampleNotes } from './utils/sampleNotes'
import { STORAGE_KEYS } from './utils/constants'

// Import screens
import HomeScreen from './screens/HomeScreen'
import ShiftListScreen from './screens/ShiftListScreen'
import ShiftManagementScreen from './screens/ShiftManagementScreen'
import AddEditShiftScreen from './screens/AddEditShiftScreen'
import SettingsScreen from './screens/SettingsScreen'
import BackupRestoreScreen from './screens/BackupRestoreScreen'
import WeatherAlertsScreen from './screens/WeatherAlertsScreen'
import WeatherApiKeysScreen from './screens/WeatherApiKeysScreen' // Giữ lại import nhưng không hiển thị trong UI
import WeatherDetailScreen from './screens/WeatherDetailScreen'
import StatisticsScreen from './screens/StatisticsScreen'
import MonthlyReportScreen from './screens/MonthlyReportScreen'
import AttendanceStatsScreen from './screens/AttendanceStatsScreen'
import NotesScreen from './screens/NotesScreen'
import NoteDetailScreen from './screens/NoteDetailScreen'
import LogHistoryScreen from './screens/LogHistoryScreen'
import LogHistoryDetailScreen from './screens/LogHistoryDetailScreen'
import ImageViewerScreen from './screens/ImageViewerScreen'
import AlarmScreen from './screens/AlarmScreen'
import MapPickerScreen from './screens/MapPickerScreen'
import DebugScreen from './screens/DebugScreen'
import NotesDebugScreen from './screens/NotesDebugScreen'

// Set up notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

const Tab = createBottomTabNavigator()
const Stack = createStackNavigator()

// Home stack navigator
function HomeStack() {
  // Import context to use t() function and theme
  const { t, theme } = useContext(AppContext)

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.headerBackgroundColor,
        },
        headerTintColor: theme.headerTintColor,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Statistics"
        component={StatisticsScreen}
        options={{ title: t('Statistics') }}
      />
      <Stack.Screen
        name="MonthlyReport"
        component={MonthlyReportScreen}
        options={{ title: t('Monthly Report') }}
      />
      <Stack.Screen
        name="AttendanceStats"
        component={AttendanceStatsScreen}
        options={{ title: t('Attendance Statistics') }}
      />
      <Stack.Screen
        name="NoteDetail"
        component={NoteDetailScreen}
        options={{ title: t('Note Detail') }}
      />
      <Stack.Screen
        name="AlarmScreen"
        component={AlarmScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ShiftManagement"
        component={ShiftManagementScreen}
        options={{ title: t('Manage Shifts') }}
      />
      <Stack.Screen
        name="AddEditShift"
        component={AddEditShiftScreen}
        options={
          /** @param {{route: Route}} param */ ({ route }) => ({
            title: route.params?.shiftId ? t('Edit Shift') : t('Add Shift'),
          })
        }
      />
      <Stack.Screen
        name="WeatherDetail"
        component={WeatherDetailScreen}
        options={{ title: t('Weather') }}
      />
    </Stack.Navigator>
  )
}

// Shifts stack navigator
function ShiftsStack() {
  // Import context to use t() function and theme
  const { t, theme } = useContext(AppContext)

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.headerBackgroundColor,
        },
        headerTintColor: theme.headerTintColor,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="ShiftList"
        component={ShiftListScreen}
        options={{ title: t('Shifts') }}
      />
      <Stack.Screen
        name="AddEditShift"
        component={AddEditShiftScreen}
        options={
          /** @param {{route: Route}} param */ ({ route }) => ({
            title: route.params?.shiftId ? t('Edit Shift') : t('Add Shift'),
          })
        }
      />
    </Stack.Navigator>
  )
}

// Statistics stack navigator
function StatisticsStack() {
  // Import context to use t() function and theme
  const { t, theme } = useContext(AppContext)

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.headerBackgroundColor,
        },
        headerTintColor: theme.headerTintColor,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="Statistics"
        component={StatisticsScreen}
        options={{ title: t('Statistics') }}
      />
      <Stack.Screen
        name="MonthlyReport"
        component={MonthlyReportScreen}
        options={{ title: t('Monthly Report') }}
      />
      <Stack.Screen
        name="AttendanceStats"
        component={AttendanceStatsScreen}
        options={{ title: t('Attendance Statistics') }}
      />
      <Stack.Screen
        name="LogHistory"
        component={LogHistoryScreen}
        options={{ title: t('History') }}
      />
      <Stack.Screen
        name="LogHistoryDetail"
        component={LogHistoryDetailScreen}
        options={{ title: t('Details') }}
      />
      <Stack.Screen
        name="ImageViewer"
        component={ImageViewerScreen}
        options={{ title: t('View Image') }}
      />
    </Stack.Navigator>
  )
}

// Settings stack navigator
function SettingsStack() {
  // Import context to use t() function and theme
  const { t, theme } = useContext(AppContext)

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.headerBackgroundColor,
        },
        headerTintColor: theme.headerTintColor,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: t('Settings') }}
      />
      <Stack.Screen
        name="BackupRestore"
        component={BackupRestoreScreen}
        options={{ title: t('Backup & Restore') }}
      />
      <Stack.Screen
        name="WeatherAlerts"
        component={WeatherAlertsScreen}
        options={{ title: t('Weather Alerts') }}
      />
      <Stack.Screen
        name="Notes"
        component={NotesScreen}
        options={{ title: t('Notes') }}
      />
      <Stack.Screen
        name="NoteDetail"
        component={NoteDetailScreen}
        options={{ title: t('Note Detail') }}
      />
      <Stack.Screen
        name="MapPickerScreen"
        component={MapPickerScreen}
        options={{ title: t('Select Location') }}
      />
      {/* Màn hình này vẫn được đăng ký nhưng không hiển thị trong UI, chỉ dành cho dev */}
      <Stack.Screen
        name="WeatherApiKeys"
        component={WeatherApiKeysScreen}
        options={{ title: t('Weather API Keys') }}
      />
      <Stack.Screen
        name="Debug"
        component={DebugScreen}
        options={{ title: t('Debug') }}
      />
      <Stack.Screen
        name="NotesDebug"
        component={NotesDebugScreen}
        options={{ title: t('Notes Debug') }}
      />
    </Stack.Navigator>
  )
}

export default function App() {
  const [notification, setNotification] = useState(false)

  useEffect(() => {
    // Listen for notifications
    const subscription = Notifications.addNotificationReceivedListener(
      /** @param {Notification} notification */
      (notification) => {
        setNotification(notification)
      }
    )

    // Listen for notification responses
    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener(
        /** @param {NotificationResponse} response */
        (response) => {
          const data = response.notification.request.content.data

          // Handle alarm notifications
          if (data.isAlarm) {
            // Navigate to alarm screen
            // This will be handled by the navigation ref
          }
        }
      )

    // Khởi tạo dữ liệu mẫu cho ghi chú và ca làm việc
    const initSampleData = async () => {
      try {
        console.log('Bắt đầu khởi tạo dữ liệu mẫu...')

        // Kiểm tra xem đã có dữ liệu nào chưa
        try {
          const shiftsJson = await AsyncStorage.getItem(STORAGE_KEYS.SHIFT_LIST)
          const notesJson = await AsyncStorage.getItem(STORAGE_KEYS.NOTES)
          console.log('Kiểm tra dữ liệu hiện có:')
          console.log(
            '- Ca làm việc:',
            shiftsJson ? 'Có dữ liệu' : 'Không có dữ liệu'
          )
          console.log(
            '- Ghi chú:',
            notesJson ? 'Có dữ liệu' : 'Không có dữ liệu'
          )
        } catch (checkError) {
          console.error('Lỗi khi kiểm tra dữ liệu hiện có:', checkError)
        }

        // Khởi tạo cơ sở dữ liệu và dữ liệu mẫu ca làm việc
        console.log('Bắt đầu khởi tạo cơ sở dữ liệu...')
        const { initializeDatabase } = require('./utils/database')
        const dbResult = await initializeDatabase()
        console.log(
          'Kết quả khởi tạo cơ sở dữ liệu:',
          dbResult ? 'Thành công' : 'Thất bại'
        )

        // Kiểm tra lại sau khi khởi tạo cơ sở dữ liệu
        try {
          const shiftsJson = await AsyncStorage.getItem(STORAGE_KEYS.SHIFT_LIST)
          console.log(
            'Kiểm tra ca làm việc sau khi khởi tạo:',
            shiftsJson ? 'Có dữ liệu' : 'Không có dữ liệu'
          )
          if (shiftsJson) {
            const shifts = JSON.parse(shiftsJson)
            console.log(`Số lượng ca làm việc: ${shifts.length}`)
          }
        } catch (checkError) {
          console.error(
            'Lỗi khi kiểm tra ca làm việc sau khi khởi tạo:',
            checkError
          )
        }

        // Khởi tạo dữ liệu mẫu cho ghi chú
        console.log('Bắt đầu khởi tạo ghi chú mẫu...')
        const notesResult = await createSampleNotes()
        console.log(
          'Kết quả khởi tạo ghi chú mẫu:',
          notesResult ? 'Thành công' : 'Không cần thiết'
        )

        // Kiểm tra lại sau khi khởi tạo ghi chú
        try {
          const notesJson = await AsyncStorage.getItem(STORAGE_KEYS.NOTES)
          console.log(
            'Kiểm tra ghi chú sau khi khởi tạo:',
            notesJson ? 'Có dữ liệu' : 'Không có dữ liệu'
          )
          if (notesJson) {
            const notes = JSON.parse(notesJson)
            console.log(`Số lượng ghi chú: ${notes.length}`)
          }
        } catch (checkError) {
          console.error(
            'Lỗi khi kiểm tra ghi chú sau khi khởi tạo:',
            checkError
          )
        }

        console.log('Hoàn thành khởi tạo dữ liệu mẫu')
      } catch (error) {
        console.error('Lỗi khi khởi tạo dữ liệu mẫu:', error)
      }
    }

    // Đảm bảo khởi tạo dữ liệu mẫu
    initSampleData()

    return () => {
      subscription.remove()
      responseSubscription.remove()
    }
  }, [])

  return (
    <AppProvider
      children={
        <NavigationContainer>
          <AppContent notification={notification} />
        </NavigationContainer>
      }
    ></AppProvider>
  )
}

// Separate component to use context safely
/** @param {AppContentProps} props */
function AppContent(props) {
  // eslint-disable-next-line no-unused-vars
  const notification = props.notification
  // Import context to use t() function, darkMode and theme
  const { t, darkMode, theme, checkAndApplyShiftRotation } =
    useContext(AppContext)

  // Kiểm tra và áp dụng xoay ca tự động khi component được mount
  useEffect(() => {
    const checkShiftRotation = async () => {
      try {
        const rotationApplied = await checkAndApplyShiftRotation()
        if (rotationApplied) {
          console.log('Đã áp dụng xoay ca tự động')
        }
      } catch (error) {
        console.error('Lỗi khi kiểm tra xoay ca tự động:', error)
      }
    }

    checkShiftRotation()
  }, [])

  return (
    <>
      <Tab.Navigator
        screenOptions={
          /** @param {{route: Route}} param */ ({ route }) => ({
            tabBarIcon: /** @param {TabBarIconProps} props */ ({
              focused,
              color,
              size,
            }) => {
              let iconName

              if (route.name === 'HomeStack') {
                iconName = focused ? 'home' : 'home-outline'
              } else if (route.name === 'ShiftsStack') {
                iconName = focused ? 'calendar' : 'calendar-outline'
              } else if (route.name === 'StatisticsStack') {
                iconName = focused ? 'stats-chart' : 'stats-chart-outline'
              } else if (route.name === 'SettingsStack') {
                iconName = focused ? 'settings' : 'settings-outline'
              }

              return <Ionicons name={iconName} size={size} color={color} />
            },
            tabBarActiveTintColor: theme.tabBarActiveColor,
            tabBarInactiveTintColor: theme.tabBarInactiveColor,
            tabBarStyle: {
              backgroundColor: theme.tabBarBackgroundColor,
              borderTopColor: theme.tabBarBorderColor,
            },
          })
        }
      >
        <Tab.Screen
          name="HomeStack"
          component={HomeStack}
          options={{ title: t('Home'), headerShown: false }}
        />
        <Tab.Screen
          name="ShiftsStack"
          component={ShiftsStack}
          options={{ title: t('Shifts'), headerShown: false }}
        />
        <Tab.Screen
          name="StatisticsStack"
          component={StatisticsStack}
          options={{ title: t('Statistics'), headerShown: false }}
        />
        <Tab.Screen
          name="SettingsStack"
          component={SettingsStack}
          options={{ title: t('Settings'), headerShown: false }}
        />
      </Tab.Navigator>
      <StatusBar style="auto" />
    </>
  )
}
