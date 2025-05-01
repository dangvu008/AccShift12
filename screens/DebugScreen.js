import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { STORAGE_KEYS } from '../utils/constants'
import { createSampleNotes } from '../utils/sampleNotes'
import { initializeDatabase } from '../utils/database'
import { useContext } from 'react'
import { AppContext } from '../context/AppContext'

const DebugScreen = () => {
  const { t, theme } = useContext(AppContext)
  const [loading, setLoading] = useState(false)
  const [storageInfo, setStorageInfo] = useState({})

  // Kiểm tra trạng thái của AsyncStorage
  const checkAsyncStorage = async () => {
    setLoading(true)
    try {
      const storageData = {}
      
      // Kiểm tra các key chính
      for (const key in STORAGE_KEYS) {
        try {
          const data = await AsyncStorage.getItem(STORAGE_KEYS[key])
          if (data) {
            try {
              const parsedData = JSON.parse(data)
              storageData[key] = {
                exists: true,
                isEmpty: Array.isArray(parsedData) ? parsedData.length === 0 : false,
                itemCount: Array.isArray(parsedData) ? parsedData.length : 'N/A',
                isObject: typeof parsedData === 'object' && !Array.isArray(parsedData),
              }
            } catch (parseError) {
              storageData[key] = {
                exists: true,
                error: 'Không thể parse dữ liệu JSON',
                rawData: data.substring(0, 50) + (data.length > 50 ? '...' : ''),
              }
            }
          } else {
            storageData[key] = { exists: false }
          }
        } catch (error) {
          storageData[key] = { exists: false, error: error.message }
        }
      }
      
      setStorageInfo(storageData)
    } catch (error) {
      console.error('Lỗi khi kiểm tra AsyncStorage:', error)
      Alert.alert('Lỗi', 'Không thể kiểm tra AsyncStorage: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Khởi tạo lại dữ liệu mẫu
  const reinitializeSampleData = async () => {
    setLoading(true)
    try {
      // Khởi tạo cơ sở dữ liệu và dữ liệu mẫu ca làm việc
      await initializeDatabase()
      console.log('Đã khởi tạo cơ sở dữ liệu và ca làm việc mẫu')

      // Khởi tạo dữ liệu mẫu cho ghi chú
      const notesResult = await createSampleNotes()
      console.log(
        'Kết quả khởi tạo ghi chú mẫu:',
        notesResult ? 'Thành công' : 'Không cần thiết'
      )

      Alert.alert('Thành công', 'Đã khởi tạo lại dữ liệu mẫu')
      
      // Cập nhật thông tin hiển thị
      await checkAsyncStorage()
    } catch (error) {
      console.error('Lỗi khi khởi tạo lại dữ liệu mẫu:', error)
      Alert.alert('Lỗi', 'Không thể khởi tạo lại dữ liệu mẫu: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Xóa dữ liệu hiện tại
  const clearAllData = async () => {
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc chắn muốn xóa TẤT CẢ dữ liệu? Hành động này không thể hoàn tác.',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            setLoading(true)
            try {
              // Xóa tất cả các key trong STORAGE_KEYS
              for (const key in STORAGE_KEYS) {
                await AsyncStorage.removeItem(STORAGE_KEYS[key])
              }
              
              Alert.alert('Thành công', 'Đã xóa tất cả dữ liệu')
              
              // Cập nhật thông tin hiển thị
              await checkAsyncStorage()
            } catch (error) {
              console.error('Lỗi khi xóa dữ liệu:', error)
              Alert.alert('Lỗi', 'Không thể xóa dữ liệu: ' + error.message)
            } finally {
              setLoading(false)
            }
          },
        },
      ]
    )
  }

  // Xóa và khởi tạo lại dữ liệu
  const resetAndReinitialize = async () => {
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc chắn muốn xóa tất cả dữ liệu và khởi tạo lại dữ liệu mẫu?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Xác nhận',
          onPress: async () => {
            setLoading(true)
            try {
              // Xóa tất cả các key trong STORAGE_KEYS
              for (const key in STORAGE_KEYS) {
                await AsyncStorage.removeItem(STORAGE_KEYS[key])
              }
              
              // Khởi tạo lại dữ liệu mẫu
              await initializeDatabase()
              await createSampleNotes()
              
              Alert.alert('Thành công', 'Đã xóa và khởi tạo lại dữ liệu mẫu')
              
              // Cập nhật thông tin hiển thị
              await checkAsyncStorage()
            } catch (error) {
              console.error('Lỗi khi xóa và khởi tạo lại dữ liệu:', error)
              Alert.alert('Lỗi', 'Không thể xóa và khởi tạo lại dữ liệu: ' + error.message)
            } finally {
              setLoading(false)
            }
          },
        },
      ]
    )
  }

  // Kiểm tra AsyncStorage khi component được mount
  useEffect(() => {
    checkAsyncStorage()
  }, [])

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <ScrollView style={styles.scrollView}>
        <Text style={[styles.title, { color: theme.textColor }]}>
          Debug AsyncStorage
        </Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primaryColor }]}
            onPress={checkAsyncStorage}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Kiểm tra AsyncStorage</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.accentColor }]}
            onPress={reinitializeSampleData}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Khởi tạo lại dữ liệu mẫu</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#ff6b6b' }]}
            onPress={clearAllData}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Xóa tất cả dữ liệu</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#ffa502' }]}
            onPress={resetAndReinitialize}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Xóa và khởi tạo lại</Text>
          </TouchableOpacity>
        </View>
        
        {loading ? (
          <ActivityIndicator size="large" color={theme.primaryColor} style={styles.loader} />
        ) : (
          <View style={styles.infoContainer}>
            <Text style={[styles.subtitle, { color: theme.textColor }]}>
              Trạng thái AsyncStorage:
            </Text>
            
            {Object.keys(storageInfo).map((key) => (
              <View key={key} style={styles.infoItem}>
                <Text style={[styles.infoKey, { color: theme.textColor }]}>
                  {key} ({STORAGE_KEYS[key]}):
                </Text>
                <View style={styles.infoValue}>
                  <Text style={{ color: theme.textColor }}>
                    Tồn tại: {storageInfo[key].exists ? 'Có' : 'Không'}
                  </Text>
                  
                  {storageInfo[key].exists && (
                    <>
                      {storageInfo[key].isEmpty !== undefined && (
                        <Text style={{ color: theme.textColor }}>
                          Rỗng: {storageInfo[key].isEmpty ? 'Có' : 'Không'}
                        </Text>
                      )}
                      
                      {storageInfo[key].itemCount !== undefined && (
                        <Text style={{ color: theme.textColor }}>
                          Số lượng item: {storageInfo[key].itemCount}
                        </Text>
                      )}
                      
                      {storageInfo[key].isObject && (
                        <Text style={{ color: theme.textColor }}>
                          Loại: Object
                        </Text>
                      )}
                      
                      {storageInfo[key].error && (
                        <Text style={{ color: 'red' }}>
                          Lỗi: {storageInfo[key].error}
                        </Text>
                      )}
                      
                      {storageInfo[key].rawData && (
                        <Text style={{ color: theme.textColor }}>
                          Dữ liệu: {storageInfo[key].rawData}
                        </Text>
                      )}
                    </>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  scrollView: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  buttonContainer: {
    marginBottom: 16,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loader: {
    marginTop: 20,
  },
  infoContainer: {
    marginTop: 16,
  },
  infoItem: {
    marginBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 12,
    borderRadius: 8,
  },
  infoKey: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  infoValue: {
    marginLeft: 8,
  },
})

export default DebugScreen
