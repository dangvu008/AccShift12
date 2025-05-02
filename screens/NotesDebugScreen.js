'use client'

import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { STORAGE_KEYS } from '../config/appConfig'
import { Ionicons } from '@expo/vector-icons'
import { useContext } from 'react'
import { AppContext } from '../context/AppContext'
import {
  createSampleNotes,
  clearAllNotes,
  createTestNote,
  debugAsyncStorage,
} from '../utils/sampleNotes'

const NotesDebugScreen = ({ navigation }) => {
  const { t, darkMode } = useContext(AppContext)
  const [loading, setLoading] = useState(false)
  const [notes, setNotes] = useState([])
  const [debugInfo, setDebugInfo] = useState('')

  // Tải danh sách ghi chú
  const loadNotes = async () => {
    setLoading(true)
    try {
      // Debug AsyncStorage
      await runDebugAsyncStorage()

      // Đọc danh sách ghi chú
      const notesJson = await AsyncStorage.getItem(STORAGE_KEYS.NOTES)
      if (notesJson) {
        try {
          const parsedNotes = JSON.parse(notesJson)
          setNotes(Array.isArray(parsedNotes) ? parsedNotes : [])
        } catch (parseError) {
          console.error('Lỗi khi parse dữ liệu ghi chú:', parseError)
          setNotes([])
          addDebugInfo(`Lỗi khi parse dữ liệu ghi chú: ${parseError.message}`)
        }
      } else {
        setNotes([])
        addDebugInfo('Không tìm thấy dữ liệu ghi chú')
      }
    } catch (error) {
      console.error('Lỗi khi tải ghi chú:', error)
      addDebugInfo(`Lỗi khi tải ghi chú: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Thêm thông tin debug
  const addDebugInfo = (info) => {
    setDebugInfo(
      (prev) => `${prev}\n${new Date().toLocaleTimeString()}: ${info}`
    )
  }

  // Debug AsyncStorage
  const runDebugAsyncStorage = async () => {
    try {
      addDebugInfo('Bắt đầu debug AsyncStorage...')
      addDebugInfo(`Platform: ${Platform.OS}`)

      // Kiểm tra các key chính
      const keys = [
        STORAGE_KEYS.NOTES,
        STORAGE_KEYS.SHIFT_LIST,
        STORAGE_KEYS.CURRENT_SHIFT,
      ]

      for (const key of keys) {
        try {
          const value = await AsyncStorage.getItem(key)
          addDebugInfo(`Key: ${key}`)
          addDebugInfo(`- Exists: ${value !== null}`)
          if (value) {
            addDebugInfo(`- Length: ${value.length}`)
            try {
              const parsed = JSON.parse(value)
              addDebugInfo(
                `- Type: ${Array.isArray(parsed) ? 'Array' : 'Object'}`
              )
              addDebugInfo(
                `- Count: ${Array.isArray(parsed) ? parsed.length : 'N/A'}`
              )
            } catch (e) {
              addDebugInfo(`- Parse error: ${e.message}`)
            }
          }
        } catch (e) {
          addDebugInfo(`Error checking key ${key}: ${e.message}`)
        }
      }

      addDebugInfo('Debug AsyncStorage hoàn tất')
    } catch (e) {
      addDebugInfo(`Debug error: ${e.message}`)
    }
  }

  // Tạo dữ liệu mẫu
  const handleCreateSampleNotes = async () => {
    setLoading(true)
    try {
      addDebugInfo('Bắt đầu tạo dữ liệu mẫu...')
      const result = await createSampleNotes(true) // Force mode
      addDebugInfo(
        `Kết quả tạo dữ liệu mẫu: ${result ? 'Thành công' : 'Thất bại'}`
      )
      await loadNotes()
    } catch (error) {
      console.error('Lỗi khi tạo dữ liệu mẫu:', error)
      addDebugInfo(`Lỗi khi tạo dữ liệu mẫu: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Tạo ghi chú kiểm tra
  const handleCreateTestNote = async () => {
    setLoading(true)
    try {
      addDebugInfo('Bắt đầu tạo ghi chú kiểm tra...')
      const result = await createTestNote()
      addDebugInfo(
        `Kết quả tạo ghi chú kiểm tra: ${result ? 'Thành công' : 'Thất bại'}`
      )
      await loadNotes()
    } catch (error) {
      console.error('Lỗi khi tạo ghi chú kiểm tra:', error)
      addDebugInfo(`Lỗi khi tạo ghi chú kiểm tra: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Xóa tất cả ghi chú
  const handleClearAllNotes = async () => {
    Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn xóa tất cả ghi chú?', [
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
            addDebugInfo('Bắt đầu xóa tất cả ghi chú...')
            const result = await clearAllNotes()
            addDebugInfo(
              `Kết quả xóa tất cả ghi chú: ${
                result ? 'Thành công' : 'Thất bại'
              }`
            )
            await loadNotes()
          } catch (error) {
            console.error('Lỗi khi xóa tất cả ghi chú:', error)
            addDebugInfo(`Lỗi khi xóa tất cả ghi chú: ${error.message}`)
          } finally {
            setLoading(false)
          }
        },
      },
    ])
  }

  // Xóa và khởi tạo lại AsyncStorage
  const handleResetAsyncStorage = async () => {
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc chắn muốn xóa và khởi tạo lại toàn bộ AsyncStorage? Hành động này sẽ xóa tất cả dữ liệu.',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Xóa và khởi tạo lại',
          style: 'destructive',
          onPress: async () => {
            setLoading(true)
            try {
              addDebugInfo('Bắt đầu xóa và khởi tạo lại AsyncStorage...')

              // Xóa tất cả dữ liệu
              await AsyncStorage.clear()
              addDebugInfo('Đã xóa tất cả dữ liệu trong AsyncStorage')

              // Khởi tạo lại dữ liệu mẫu
              const result = await createSampleNotes(true)
              addDebugInfo(
                `Kết quả tạo dữ liệu mẫu: ${result ? 'Thành công' : 'Thất bại'}`
              )

              await loadNotes()
            } catch (error) {
              console.error('Lỗi khi xóa và khởi tạo lại AsyncStorage:', error)
              addDebugInfo(
                `Lỗi khi xóa và khởi tạo lại AsyncStorage: ${error.message}`
              )
            } finally {
              setLoading(false)
            }
          },
        },
      ]
    )
  }

  // Tải dữ liệu khi màn hình được mount
  useEffect(() => {
    loadNotes()
  }, [loadNotes]) // Added 'loadNotes' to the dependency array to resolve the ESLint warning

  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>
      <Text style={[styles.title, darkMode && styles.darkText]}>
        Debug Ghi Chú
      </Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#8a56ff' }]}
          onPress={loadNotes}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Tải lại</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#4caf50' }]}
          onPress={handleCreateSampleNotes}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Tạo dữ liệu mẫu</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#2196f3' }]}
          onPress={handleCreateTestNote}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Tạo ghi chú kiểm tra</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#ff9800' }]}
          onPress={handleClearAllNotes}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Xóa tất cả ghi chú</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#f44336' }]}
          onPress={handleResetAsyncStorage}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            Xóa và khởi tạo lại AsyncStorage
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#8a56ff" style={styles.loader} />
      ) : (
        <ScrollView style={styles.contentContainer}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, darkMode && styles.darkText]}>
              Danh sách ghi chú ({notes.length})
            </Text>
            {notes.length > 0 ? (
              notes.map((note) => (
                <View key={note.id} style={styles.noteItem}>
                  <Text style={[styles.noteTitle, darkMode && styles.darkText]}>
                    {note.title}
                  </Text>
                  <Text
                    style={[styles.noteContent, darkMode && styles.darkSubText]}
                  >
                    {note.content.length > 50
                      ? `${note.content.substring(0, 50)}...`
                      : note.content}
                  </Text>
                  <Text
                    style={[styles.noteInfo, darkMode && styles.darkSubText]}
                  >
                    ID: {note.id}
                  </Text>
                  <Text
                    style={[styles.noteInfo, darkMode && styles.darkSubText]}
                  >
                    Tạo lúc: {new Date(note.createdAt).toLocaleString()}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={[styles.emptyText, darkMode && styles.darkSubText]}>
                Không có ghi chú nào
              </Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, darkMode && styles.darkText]}>
              Thông tin debug
            </Text>
            <ScrollView style={styles.debugContainer}>
              <Text style={[styles.debugText, darkMode && styles.darkSubText]}>
                {debugInfo || 'Không có thông tin debug'}
              </Text>
            </ScrollView>
          </View>
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  darkText: {
    color: '#fff',
  },
  darkSubText: {
    color: '#aaa',
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    margin: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '500',
  },
  loader: {
    marginTop: 20,
  },
  contentContainer: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  noteItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 8,
    marginBottom: 8,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  noteContent: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  noteInfo: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
  debugContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 4,
    padding: 8,
    maxHeight: 200,
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
})

export default NotesDebugScreen
