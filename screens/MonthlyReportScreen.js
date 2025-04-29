'use client'

import { useContext } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { AppContext } from '../context/AppContext'

// Hàm định dạng ngày tháng ngắn gọn (dd/mm hoặc mm/dd)
const formatShortDate = (dateString, language = 'vi') => {
  if (!dateString) return ''

  const parts = dateString.split('/')
  if (parts.length !== 3) return dateString

  const day = parts[0]
  const month = parts[1]

  // Nếu ngôn ngữ là tiếng Anh, hiển thị mm/dd, ngược lại hiển thị dd/mm
  return language === 'en' ? `${month}/${day}` : `${day}/${month}`
}

// Hàm định dạng thứ viết tắt
const formatShortDay = (dayString, language = 'vi') => {
  if (!dayString) return ''

  // Bảng ánh xạ thứ đầy đủ sang viết tắt
  const dayMappingVi = {
    'Thứ Hai': 'T2',
    'Thứ Ba': 'T3',
    'Thứ Tư': 'T4',
    'Thứ Năm': 'T5',
    'Thứ Sáu': 'T6',
    'Thứ Bảy': 'T7',
    'Chủ Nhật': 'CN',
  }

  const dayMappingEn = {
    Monday: 'Mon',
    Tuesday: 'Tue',
    Wednesday: 'Wed',
    Thursday: 'Thu',
    Friday: 'Fri',
    Saturday: 'Sat',
    Sunday: 'Sun',
  }

  // Chọn bảng ánh xạ dựa trên ngôn ngữ
  const mapping = language === 'en' ? dayMappingEn : dayMappingVi

  // Trả về thứ viết tắt nếu có trong bảng ánh xạ, ngược lại trả về nguyên bản
  return mapping[dayString] || dayString
}

// Hàm định dạng giờ làm việc
const formatWorkHours = (hoursString) => {
  if (!hoursString || hoursString === '-') return '-'

  // Nếu là số thập phân dạng chuỗi, chuyển về số và định dạng lại
  if (!isNaN(parseFloat(hoursString))) {
    return parseFloat(hoursString).toString()
  }

  return hoursString
}

const MonthlyReportScreen = ({ navigation }) => {
  const { t, darkMode, language } = useContext(AppContext)

  // Sample data for the monthly report
  const reportData = [
    {
      date: '18/12/2024',
      day: 'Thứ Tư',
      checkIn: '--:--',
      checkOut: '--:--',
      regularHours: '-',
      ot150: '-',
      ot200: '-',
      ot300: '-',
    },
    {
      date: '19/12/2024',
      day: 'Thứ Năm',
      checkIn: '09:16',
      checkOut: '09:16',
      regularHours: '-',
      ot150: '0.0',
      ot200: '0.0',
      ot300: '0.0',
    },
    {
      date: '20/12/2024',
      day: 'Thứ Sáu',
      checkIn: '--:--',
      checkOut: '--:--',
      regularHours: '-',
      ot150: '-',
      ot200: '-',
      ot300: '-',
    },
    {
      date: '21/12/2024',
      day: 'Thứ Bảy',
      checkIn: '--:--',
      checkOut: '--:--',
      regularHours: '-',
      ot150: '-',
      ot200: '-',
      ot300: '-',
    },
    {
      date: '22/12/2024',
      day: 'Chủ Nhật',
      checkIn: '04:30',
      checkOut: '04:30',
      regularHours: '-',
      ot150: '0.0',
      ot200: '0.0',
      ot300: '0.0',
    },
    {
      date: '23/12/2024',
      day: 'Thứ Hai',
      checkIn: '--:--',
      checkOut: '--:--',
      regularHours: '-',
      ot150: '0.0',
      ot200: '0.0',
      ot300: '0.0',
    },
    {
      date: '24/12/2024',
      day: 'Thứ Ba',
      checkIn: '--:--',
      checkOut: '--:--',
      regularHours: '-',
      ot150: '-',
      ot200: '-',
      ot300: '-',
    },
  ]

  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>
      <ScrollView horizontal>
        <View>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text
              style={[
                styles.headerCell,
                styles.dateCell,
                darkMode && styles.darkText,
              ]}
            >
              {t('Ngày')}
            </Text>
            <Text
              style={[
                styles.headerCell,
                styles.dayCell,
                darkMode && styles.darkText,
              ]}
            >
              {t('Thứ')}
            </Text>
            <Text
              style={[
                styles.headerCell,
                styles.timeCell,
                darkMode && styles.darkText,
              ]}
            >
              {t('Vào ca')}
            </Text>
            <Text
              style={[
                styles.headerCell,
                styles.timeCell,
                darkMode && styles.darkText,
              ]}
            >
              {t('Tan ca')}
            </Text>
            <Text
              style={[
                styles.headerCell,
                styles.hoursCell,
                darkMode && styles.darkText,
              ]}
            >
              {t('regularHours')}
            </Text>
            <Text
              style={[
                styles.headerCell,
                styles.otCell,
                darkMode && styles.darkText,
              ]}
            >
              {t('OT 150%')}
            </Text>
            <Text
              style={[
                styles.headerCell,
                styles.otCell,
                darkMode && styles.darkText,
              ]}
            >
              {t('OT 200%')}
            </Text>
            <Text
              style={[
                styles.headerCell,
                styles.otCell,
                darkMode && styles.darkText,
              ]}
            >
              {t('OT 300%')}
            </Text>
          </View>

          {/* Table Rows */}
          {reportData.map((row, index) => (
            <View
              key={index}
              style={[
                styles.tableRow,
                index % 2 === 0 && styles.evenRow,
                darkMode && styles.darkRow,
                darkMode && index % 2 === 0 && styles.darkEvenRow,
              ]}
            >
              <Text
                style={[
                  styles.cell,
                  styles.dateCell,
                  darkMode && styles.darkText,
                ]}
              >
                {formatShortDate(row.date, language)}
              </Text>
              <Text
                style={[
                  styles.cell,
                  styles.dayCell,
                  darkMode && styles.darkText,
                ]}
              >
                {formatShortDay(row.day, language)}
              </Text>
              <Text
                style={[
                  styles.cell,
                  styles.timeCell,
                  darkMode && styles.darkText,
                ]}
              >
                {row.checkIn}
              </Text>
              <Text
                style={[
                  styles.cell,
                  styles.timeCell,
                  darkMode && styles.darkText,
                ]}
              >
                {row.checkOut}
              </Text>
              <Text
                style={[
                  styles.cell,
                  styles.hoursCell,
                  darkMode && styles.darkText,
                ]}
              >
                {formatWorkHours(row.regularHours)}
              </Text>
              <Text
                style={[
                  styles.cell,
                  styles.otCell,
                  darkMode && styles.darkText,
                ]}
              >
                {formatWorkHours(row.ot150)}
              </Text>
              <Text
                style={[
                  styles.cell,
                  styles.otCell,
                  darkMode && styles.darkText,
                ]}
              >
                {formatWorkHours(row.ot200)}
              </Text>
              <Text
                style={[
                  styles.cell,
                  styles.otCell,
                  darkMode && styles.darkText,
                ]}
              >
                {formatWorkHours(row.ot300)}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.navigate('Home')}
      >
        <Ionicons name="arrow-back" size={20} color="#fff" />
        <Text style={styles.backButtonText}>{t('Back to Home')}</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  darkText: {
    color: '#fff',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#333',
    paddingVertical: 12,
  },
  headerCell: {
    color: '#fff',
    fontWeight: 'bold',
    paddingHorizontal: 8,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  evenRow: {
    backgroundColor: '#f9f9f9',
  },
  darkRow: {
    borderBottomColor: '#333',
  },
  darkEvenRow: {
    backgroundColor: '#1a1a1a',
  },
  cell: {
    paddingHorizontal: 8,
    textAlign: 'center',
    color: '#333',
  },
  dateCell: {
    width: 100,
  },
  dayCell: {
    width: 80,
  },
  timeCell: {
    width: 80,
  },
  hoursCell: {
    width: 100,
  },
  otCell: {
    width: 80,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8a56ff',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
})

export default MonthlyReportScreen
