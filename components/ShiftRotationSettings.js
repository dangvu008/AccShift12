import React, { useState, useEffect, useContext } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Switch,
  Alert,
} from 'react-native'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import { AppContext } from '../context/AppContext'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { STORAGE_KEYS } from '../utils/constants'

const ShiftRotationSettings = ({ shifts }) => {
  const { t, darkMode, theme, updateMultipleSettings } = useContext(AppContext)
  const [modalVisible, setModalVisible] = useState(false)
  const [rotationMode, setRotationMode] = useState('disabled') // 'disabled', 'ask_weekly', 'rotate'
  const [selectedShifts, setSelectedShifts] = useState([])
  const [rotationFrequency, setRotationFrequency] = useState('weekly')
  const [userSettings, setUserSettings] = useState(null)

  // Tải cài đặt người dùng khi component được mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settingsJson = await AsyncStorage.getItem(STORAGE_KEYS.USER_SETTINGS)
        if (settingsJson) {
          const settings = JSON.parse(settingsJson)
          setUserSettings(settings)
          
          // Cài đặt giá trị ban đầu
          if (settings.changeShiftReminderMode) {
            setRotationMode(settings.changeShiftReminderMode)
          }
          
          if (settings.rotationShifts && Array.isArray(settings.rotationShifts)) {
            setSelectedShifts(settings.rotationShifts)
          }
          
          if (settings.rotationFrequency) {
            setRotationFrequency(settings.rotationFrequency)
          }
        }
      } catch (error) {
        console.error('Lỗi khi tải cài đặt người dùng:', error)
      }
    }
    
    loadSettings()
  }, [])

  // Lưu cài đặt khi thay đổi
  const saveSettings = async () => {
    try {
      // Kiểm tra điều kiện hợp lệ cho chế độ xoay ca
      if (rotationMode === 'rotate' && selectedShifts.length < 2) {
        Alert.alert(
          t('Lỗi cài đặt'),
          t('Bạn cần chọn ít nhất 2 ca làm việc để sử dụng chế độ xoay ca tự động.')
        )
        return false
      }

      const updatedSettings = {
        changeShiftReminderMode: rotationMode,
        rotationShifts: selectedShifts,
        rotationFrequency: rotationFrequency,
      }
      
      // Nếu là lần đầu cài đặt chế độ xoay ca, thêm ngày bắt đầu
      if (rotationMode === 'rotate' && !userSettings?.rotationLastAppliedDate) {
        const today = new Date()
        updatedSettings.rotationLastAppliedDate = today.toISOString().split('T')[0]
      }
      
      // Cập nhật cài đặt người dùng
      await updateMultipleSettings(updatedSettings)
      
      // Cập nhật state
      setUserSettings({
        ...userSettings,
        ...updatedSettings,
      })
      
      return true
    } catch (error) {
      console.error('Lỗi khi lưu cài đặt:', error)
      return false
    }
  }

  // Xử lý khi nhấn nút lưu
  const handleSave = async () => {
    const success = await saveSettings()
    if (success) {
      setModalVisible(false)
      Alert.alert(
        t('Thành công'),
        t('Đã lưu cài đặt nhắc nhở đổi ca.')
      )
    }
  }

  // Xử lý khi chọn/bỏ chọn ca làm việc
  const toggleShiftSelection = (shiftId) => {
    if (selectedShifts.includes(shiftId)) {
      setSelectedShifts(selectedShifts.filter(id => id !== shiftId))
    } else {
      setSelectedShifts([...selectedShifts, shiftId])
    }
  }

  // Hiển thị tên chế độ nhắc nhở
  const getReminderModeName = (mode) => {
    switch (mode) {
      case 'disabled':
        return t('Tắt')
      case 'ask_weekly':
        return t('Hỏi hàng tuần')
      case 'rotate':
        return t('Xoay ca tự động')
      default:
        return t('Tắt')
    }
  }

  // Hiển thị tên tần suất xoay ca
  const getFrequencyName = (frequency) => {
    switch (frequency) {
      case 'weekly':
        return t('Hàng tuần')
      case 'biweekly':
        return t('2 tuần / lần')
      case 'monthly':
        return t('Hàng tháng')
      default:
        return t('Hàng tuần')
    }
  }

  // Hiển thị thông tin ca đã chọn
  const getSelectedShiftsInfo = () => {
    if (selectedShifts.length === 0) {
      return t('Chưa chọn ca nào')
    }
    
    const selectedShiftNames = selectedShifts
      .map(shiftId => {
        const shift = shifts.find(s => s.id === shiftId)
        return shift ? shift.name : null
      })
      .filter(name => name !== null)
      .join(' → ')
    
    return selectedShiftNames
  }

  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>
      <TouchableOpacity
        style={[styles.settingButton, darkMode && styles.darkSettingButton]}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.iconContainer}>
          <MaterialIcons
            name="autorenew"
            size={24}
            color={darkMode ? '#fff' : '#000'}
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.title, darkMode && styles.darkText]}>
            {t('Nhắc nhở đổi ca')}
          </Text>
          <Text style={[styles.subtitle, darkMode && styles.darkSubtitle]}>
            {getReminderModeName(rotationMode)}
            {rotationMode === 'rotate' && ` (${getFrequencyName(rotationFrequency)})`}
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={24}
          color={darkMode ? '#aaa' : '#666'}
        />
      </TouchableOpacity>

      {/* Modal cài đặt */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, darkMode && styles.darkModalContent]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, darkMode && styles.darkText]}>
                {t('Cài đặt nhắc nhở đổi ca')}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons
                  name="close"
                  size={24}
                  color={darkMode ? '#fff' : '#000'}
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Chế độ nhắc nhở */}
              <Text style={[styles.sectionTitle, darkMode && styles.darkText]}>
                {t('Chế độ nhắc nhở')}
              </Text>

              <TouchableOpacity
                style={[
                  styles.optionItem,
                  rotationMode === 'disabled' && styles.selectedOption,
                  rotationMode === 'disabled' && darkMode && styles.darkSelectedOption,
                ]}
                onPress={() => setRotationMode('disabled')}
              >
                <View style={styles.optionTextContainer}>
                  <Text style={[styles.optionTitle, darkMode && styles.darkText]}>
                    {t('Tắt')}
                  </Text>
                  <Text style={[styles.optionDescription, darkMode && styles.darkSubtitle]}>
                    {t('Không nhắc nhở, không tự động đổi ca')}
                  </Text>
                </View>
                {rotationMode === 'disabled' && (
                  <Ionicons name="checkmark" size={24} color={theme.primaryColor} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionItem,
                  rotationMode === 'ask_weekly' && styles.selectedOption,
                  rotationMode === 'ask_weekly' && darkMode && styles.darkSelectedOption,
                ]}
                onPress={() => setRotationMode('ask_weekly')}
              >
                <View style={styles.optionTextContainer}>
                  <Text style={[styles.optionTitle, darkMode && styles.darkText]}>
                    {t('Hỏi hàng tuần')}
                  </Text>
                  <Text style={[styles.optionDescription, darkMode && styles.darkSubtitle]}>
                    {t('Nhắc nhở đổi ca vào đầu tuần')}
                  </Text>
                </View>
                {rotationMode === 'ask_weekly' && (
                  <Ionicons name="checkmark" size={24} color={theme.primaryColor} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionItem,
                  rotationMode === 'rotate' && styles.selectedOption,
                  rotationMode === 'rotate' && darkMode && styles.darkSelectedOption,
                ]}
                onPress={() => setRotationMode('rotate')}
              >
                <View style={styles.optionTextContainer}>
                  <Text style={[styles.optionTitle, darkMode && styles.darkText]}>
                    {t('Xoay ca tự động')}
                  </Text>
                  <Text style={[styles.optionDescription, darkMode && styles.darkSubtitle]}>
                    {t('Tự động đổi ca theo lịch định sẵn')}
                  </Text>
                </View>
                {rotationMode === 'rotate' && (
                  <Ionicons name="checkmark" size={24} color={theme.primaryColor} />
                )}
              </TouchableOpacity>

              {/* Cài đặt xoay ca tự động */}
              {rotationMode === 'rotate' && (
                <>
                  <Text style={[styles.sectionTitle, darkMode && styles.darkText, { marginTop: 20 }]}>
                    {t('Cài đặt xoay ca tự động')}
                  </Text>

                  {/* Chọn ca xoay vòng */}
                  <Text style={[styles.subsectionTitle, darkMode && styles.darkText]}>
                    {t('Chọn ca xoay vòng')}
                  </Text>
                  <Text style={[styles.subsectionDescription, darkMode && styles.darkSubtitle]}>
                    {t('Chọn ít nhất 2 ca làm việc để xoay vòng theo thứ tự')}
                  </Text>

                  {shifts.map((shift) => (
                    <TouchableOpacity
                      key={shift.id}
                      style={[
                        styles.shiftItem,
                        selectedShifts.includes(shift.id) && styles.selectedShiftItem,
                        selectedShifts.includes(shift.id) && darkMode && styles.darkSelectedShiftItem,
                      ]}
                      onPress={() => toggleShiftSelection(shift.id)}
                    >
                      <View style={styles.shiftInfo}>
                        <Text style={[styles.shiftName, darkMode && styles.darkText]}>
                          {shift.name}
                        </Text>
                        <Text style={[styles.shiftTime, darkMode && styles.darkSubtitle]}>
                          {shift.startTime} - {shift.endTime}
                        </Text>
                      </View>
                      {selectedShifts.includes(shift.id) && (
                        <View style={styles.shiftOrderBadge}>
                          <Text style={styles.shiftOrderText}>
                            {selectedShifts.indexOf(shift.id) + 1}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}

                  {/* Tần suất xoay vòng */}
                  <Text style={[styles.subsectionTitle, darkMode && styles.darkText, { marginTop: 20 }]}>
                    {t('Tần suất xoay vòng')}
                  </Text>

                  <TouchableOpacity
                    style={[
                      styles.optionItem,
                      rotationFrequency === 'weekly' && styles.selectedOption,
                      rotationFrequency === 'weekly' && darkMode && styles.darkSelectedOption,
                    ]}
                    onPress={() => setRotationFrequency('weekly')}
                  >
                    <Text style={[styles.optionTitle, darkMode && styles.darkText]}>
                      {t('Hàng tuần')}
                    </Text>
                    {rotationFrequency === 'weekly' && (
                      <Ionicons name="checkmark" size={24} color={theme.primaryColor} />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.optionItem,
                      rotationFrequency === 'biweekly' && styles.selectedOption,
                      rotationFrequency === 'biweekly' && darkMode && styles.darkSelectedOption,
                    ]}
                    onPress={() => setRotationFrequency('biweekly')}
                  >
                    <Text style={[styles.optionTitle, darkMode && styles.darkText]}>
                      {t('2 tuần / lần')}
                    </Text>
                    {rotationFrequency === 'biweekly' && (
                      <Ionicons name="checkmark" size={24} color={theme.primaryColor} />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.optionItem,
                      rotationFrequency === 'monthly' && styles.selectedOption,
                      rotationFrequency === 'monthly' && darkMode && styles.darkSelectedOption,
                    ]}
                    onPress={() => setRotationFrequency('monthly')}
                  >
                    <Text style={[styles.optionTitle, darkMode && styles.darkText]}>
                      {t('Hàng tháng')}
                    </Text>
                    {rotationFrequency === 'monthly' && (
                      <Ionicons name="checkmark" size={24} color={theme.primaryColor} />
                    )}
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.cancelButton, darkMode && styles.darkCancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.buttonText, { color: theme.primaryColor }]}>
                  {t('Hủy')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: theme.primaryColor }]}
                onPress={handleSave}
              >
                <Text style={[styles.buttonText, { color: '#fff' }]}>
                  {t('Lưu')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  settingButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  darkSettingButton: {
    backgroundColor: '#1e1e1e',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  darkText: {
    color: '#fff',
  },
  darkSubtitle: {
    color: '#aaa',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  darkModalContent: {
    backgroundColor: '#1e1e1e',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  modalBody: {
    padding: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  subsectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedOption: {
    backgroundColor: '#f0f0ff',
  },
  darkSelectedOption: {
    backgroundColor: '#2a2a3a',
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    color: '#000',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
  },
  shiftItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
  },
  selectedShiftItem: {
    backgroundColor: '#e6f7ff',
    borderWidth: 1,
    borderColor: '#8a56ff',
  },
  darkSelectedShiftItem: {
    backgroundColor: '#1a2a3a',
  },
  shiftInfo: {
    flex: 1,
  },
  shiftName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  shiftTime: {
    fontSize: 14,
    color: '#666',
  },
  shiftOrderBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#8a56ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shiftOrderText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: '#f0f0f0',
  },
  darkCancelButton: {
    backgroundColor: '#2a2a2a',
  },
  saveButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
})

export default ShiftRotationSettings
