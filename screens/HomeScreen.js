'use client'

import { useContext, useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { AppContext } from '../context/AppContext'
import { formatDuration } from '../utils/helpers'
import MultiFunctionButton from '../components/MultiFunctionButton'
import WeeklyStatusGrid from '../components/WeeklyStatusGrid'
import WeatherWidget from '../components/WeatherWidget'
import WorkNotesSection from '../components/WorkNotesSection'
import DebugNotes from '../components/DebugNotes'

const HomeScreen = ({ navigation }) => {
  const {
    t,
    theme,
    currentShift,
    isWorking,
    workStartTime,
    alarmPermissionGranted,
    requestAlarmPermission,
  } = useContext(AppContext)

  const [currentTime, setCurrentTime] = useState(new Date())
  const [workDuration, setWorkDuration] = useState(0)
  const [showAlarmPermissionAlert, setShowAlarmPermissionAlert] = useState(
    !alarmPermissionGranted
  )

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())

      // Calculate work duration if working
      if (isWorking && workStartTime) {
        const currentTimeMs = new Date().getTime()
        const workStartTimeMs = workStartTime.getTime()
        const duration = Math.floor(
          (currentTimeMs - workStartTimeMs) / (1000 * 60)
        )
        setWorkDuration(duration)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [isWorking, workStartTime])

  // Show alarm permission alert once
  useEffect(() => {
    if (!alarmPermissionGranted && showAlarmPermissionAlert) {
      Alert.alert(
        t('Alarm Permission Required'),
        t(
          'AccShift needs permission to send alarm notifications even when your device is in Do Not Disturb mode.'
        ),
        [
          {
            text: t('Later'),
            onPress: () => setShowAlarmPermissionAlert(false),
            style: 'cancel',
          },
          {
            text: t('Grant Permission'),
            onPress: async () => {
              const granted = await requestAlarmPermission()
              setShowAlarmPermissionAlert(!granted)
            },
          },
        ]
      )
    }
  }, [
    alarmPermissionGranted,
    showAlarmPermissionAlert,
    requestAlarmPermission,
    t,
  ])

  const formatTimeDisplay = (date) => {
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  }

  const formatDateDisplay = (date) => {
    const days = [
      t('Sunday'),
      t('Monday'),
      t('Tuesday'),
      t('Wednesday'),
      t('Thursday'),
      t('Friday'),
      t('Saturday'),
    ]
    return `${days[date.getDay()]}, ${date.getDate()}/${date.getMonth() + 1}`
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.backgroundColor, padding: 16 }}
    >
      {/* 1. Thanh trên cùng (Ngày/giờ, nút Cài đặt) */}
      <View style={styles.header}>
        <View style={styles.dateTimeContainer}>
          <Text
            style={{ fontSize: 32, fontWeight: 'bold', color: theme.textColor }}
          >
            {formatTimeDisplay(currentTime)}
          </Text>
          <Text
            style={{ fontSize: 14, color: theme.subtextColor, marginTop: 4 }}
          >
            {formatDateDisplay(currentTime)}
          </Text>
        </View>
        {/* Đã loại bỏ các nút thống kê và cài đặt */}
      </View>

      {/* 2. Khu vực Thời tiết Hiện tại & Dự báo Ngắn hạn */}
      <WeatherWidget onPress={() => navigation.navigate('WeatherDetail')} />

      {/* Vùng Cảnh báo Thời tiết (nếu có) - Đã được tích hợp vào WeatherWidget */}

      {/* 3. Tên ca làm việc đang áp dụng */}
      <TouchableOpacity
        style={{
          backgroundColor: theme.cardColor,
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
        }}
        onPress={() => navigation.navigate('ShiftManagement')}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: theme.textColor,
            marginBottom: 4,
          }}
        >
          {currentShift ? currentShift.name : t('No shift selected')}
        </Text>
        <Text style={{ fontSize: 14, color: theme.subtextColor }}>
          {currentShift
            ? `${currentShift.startTime} - ${currentShift.endTime}`
            : ''}
        </Text>
        <View style={styles.shiftEditIcon}>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.subtextColor}
          />
        </View>
      </TouchableOpacity>

      {/* Hiển thị trạng thái làm việc nếu đang làm việc */}
      {isWorking && (
        <View
          style={{
            backgroundColor: theme.cardColor,
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: theme.primaryColor,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12,
            }}
          >
            <Ionicons name="checkmark" size={24} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: 'bold',
                color: theme.textColor,
              }}
            >
              {t('Working')} {currentShift ? currentShift.name : ''}
            </Text>
            <Text
              style={{ fontSize: 14, color: theme.subtextColor, marginTop: 4 }}
            >
              {t('Worked for')} {formatDuration(workDuration)}
            </Text>
          </View>
        </View>
      )}

      {/* 4. Nút Đa Năng lớn */}
      <MultiFunctionButton />

      {/* 6. Lịch sử bấm nút (được hiển thị trong MultiFunctionButton) */}

      {/* 7. Lưới trạng thái tuần */}
      <View
        style={{
          backgroundColor: theme.cardColor,
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <Text
            style={{ fontSize: 18, fontWeight: 'bold', color: theme.textColor }}
          >
            {t('Weekly Status')}
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: theme.primaryColor,
              borderRadius: 8,
              paddingVertical: 4,
              paddingHorizontal: 10,
            }}
            onPress={() => navigation.navigate('AttendanceStats')}
          >
            <Ionicons name="chevron-forward" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <WeeklyStatusGrid />
      </View>

      {/* 8. Khu vực Ghi Chú Công Việc */}
      <WorkNotesSection navigation={navigation} />

      {/* Debug Notes */}
      <DebugNotes />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateTimeContainer: {
    alignItems: 'flex-start',
  },
  shiftEditIcon: {
    position: 'absolute',
    right: 10,
    top: '50%',
    marginTop: -10,
  },
})

export default HomeScreen
