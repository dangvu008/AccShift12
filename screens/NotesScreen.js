import React, { useState, useEffect, useContext, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { AppContext } from '../context/AppContext'
import { getNotes } from '../utils/database'
import { useFocusEffect } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { STORAGE_KEYS } from '../utils/constants'

const NotesScreen = ({ navigation }) => {
  const { t, darkMode } = useContext(AppContext)
  const [notes, setNotes] = useState([])
  const [filteredNotes, setFilteredNotes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOption, setSortOption] = useState('updatedAt') // 'updatedAt', 'priority', 'abc'
  const [showSortOptions, setShowSortOptions] = useState(false)

  // Tải danh sách ghi chú khi màn hình được focus
  // Sắp xếp ghi chú theo tùy chọn đã chọn
  const sortNotes = useCallback(
    (notesToSort) => {
      if (!notesToSort || notesToSort.length === 0) return []

      let sortedNotes = [...notesToSort]

      switch (sortOption) {
        case 'updatedAt':
          // Sắp xếp theo thời gian cập nhật mới nhất
          sortedNotes.sort((a, b) => {
            return new Date(b.updatedAt) - new Date(a.updatedAt)
          })
          break
        case 'priority':
          // Sắp xếp theo ưu tiên, sau đó theo thời gian cập nhật
          sortedNotes.sort((a, b) => {
            if (a.isPriority && !b.isPriority) return -1
            if (!a.isPriority && b.isPriority) return 1
            return new Date(b.updatedAt) - new Date(a.updatedAt)
          })
          break
        case 'abc':
          // Sắp xếp theo bảng chữ cái
          sortedNotes.sort((a, b) => {
            const titleA = (a.title || '').toLowerCase()
            const titleB = (b.title || '').toLowerCase()
            return titleA.localeCompare(titleB)
          })
          break
        default:
          // Mặc định sắp xếp theo thời gian cập nhật
          sortedNotes.sort((a, b) => {
            return new Date(b.updatedAt) - new Date(a.updatedAt)
          })
      }

      return sortedNotes
    },
    [sortOption]
  )

  // Tải danh sách ghi chú
  const loadNotes = useCallback(async () => {
    setIsLoading(true)
    try {
      const allNotes = await getNotes()
      // Sắp xếp ghi chú theo tùy chọn đã chọn
      const sortedNotes = sortNotes(allNotes)
      setNotes(allNotes) // Lưu danh sách gốc
      setFilteredNotes(sortedNotes) // Lưu danh sách đã lọc và sắp xếp
    } catch (error) {
      console.error('Lỗi khi tải ghi chú:', error)
      Alert.alert(t('Lỗi'), t('Không thể tải danh sách ghi chú'))
    } finally {
      setIsLoading(false)
    }
  }, [t, sortNotes])

  // Tải danh sách ghi chú khi màn hình được focus hoặc khi có thông báo cập nhật
  useFocusEffect(
    useCallback(() => {
      console.log('NotesScreen được focus, tải lại dữ liệu ghi chú')
      loadNotes()
    }, [loadNotes])
  )

  // Theo dõi thay đổi từ tham số route
  useEffect(() => {
    if (route.params?.notesUpdated) {
      console.log(
        'Nhận thông báo cập nhật ghi chú từ tham số route, timestamp:',
        route.params.timestamp
      )
      loadNotes()
    }
  }, [route.params?.notesUpdated, route.params?.timestamp, loadNotes])

  // Xử lý tìm kiếm
  const handleSearch = (text) => {
    setSearchQuery(text)
    if (!text.trim()) {
      setFilteredNotes(sortNotes(notes))
      return
    }

    const filtered = notes.filter(
      (note) =>
        note.title.toLowerCase().includes(text.toLowerCase()) ||
        note.content.toLowerCase().includes(text.toLowerCase())
    )
    setFilteredNotes(sortNotes(filtered))
  }

  // Xử lý thay đổi tùy chọn sắp xếp
  const handleSortOptionChange = (option) => {
    setSortOption(option)
    setShowSortOptions(false)

    // Áp dụng sắp xếp mới cho danh sách hiện tại
    if (searchQuery.trim()) {
      // Nếu đang tìm kiếm, áp dụng sắp xếp cho kết quả tìm kiếm
      const filtered = notes.filter(
        (note) =>
          note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredNotes(sortNotes(filtered))
    } else {
      // Nếu không tìm kiếm, áp dụng sắp xếp cho toàn bộ danh sách
      setFilteredNotes(sortNotes(notes))
    }
  }

  // Xử lý khi nhấn vào ghi chú
  const handleNotePress = (noteId) => {
    navigation.navigate('NoteDetail', { noteId })
  }

  // Xử lý khi nhấn nút thêm ghi chú mới
  const handleAddNote = () => {
    navigation.navigate('NoteDetail')
  }

  // Xử lý khi nhấn nút sửa ghi chú
  const handleEditNote = (noteId, event) => {
    if (event) {
      event.stopPropagation()
    }
    navigation.navigate('NoteDetail', { noteId })
  }

  // Xử lý khi nhấn nút xóa ghi chú
  const handleDeleteNote = (noteId, event) => {
    if (event) {
      event.stopPropagation()
    }

    // Hiển thị hộp thoại xác nhận trước khi xóa
    Alert.alert(
      t('Xóa ghi chú'),
      t('Bạn có chắc chắn muốn xóa ghi chú này không?'),
      [
        {
          text: t('Hủy'),
          style: 'cancel',
        },
        {
          text: t('Xóa'),
          style: 'destructive',
          onPress: async () => {
            try {
              // Lấy danh sách ghi chú hiện tại
              const allNotes = await getNotes()
              // Lọc ra ghi chú cần xóa
              const updatedNotes = allNotes.filter((note) => note.id !== noteId)
              // Lưu danh sách ghi chú đã cập nhật
              await AsyncStorage.setItem(
                STORAGE_KEYS.NOTES,
                JSON.stringify(updatedNotes)
              )
              // Cập nhật state để làm mới giao diện
              setNotes(updatedNotes)
              setFilteredNotes(
                filteredNotes.filter((note) => note.id !== noteId)
              )
            } catch (error) {
              console.error('Lỗi khi xóa ghi chú:', error)
              Alert.alert(
                t('Lỗi'),
                t('Không thể xóa ghi chú. Vui lòng thử lại.')
              )
            }
          },
        },
      ]
    )
  }

  // Định dạng thời gian nhắc nhở
  const formatReminderTime = (reminderTime) => {
    if (!reminderTime) return null

    // Nếu reminderTime có định dạng "DD/MM/YYYY HH:MM"
    const parts = reminderTime.split(' ')
    if (parts.length === 2) {
      return parts[1] // Chỉ trả về phần giờ
    }
    return reminderTime
  }

  // Render item cho FlatList
  const renderNoteItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.noteItem,
        darkMode && styles.darkNoteItem,
        item.isPriority && styles.priorityNoteItem,
      ]}
      onPress={() => handleNotePress(item.id)}
    >
      <View style={styles.noteContent}>
        <View style={styles.titleContainer}>
          {item.isPriority && (
            <Ionicons
              name="star"
              size={16}
              color="#FFD700"
              style={styles.priorityIcon}
            />
          )}
          <Text
            style={[
              styles.noteTitle,
              darkMode && styles.darkText,
              item.isPriority && styles.priorityTitle,
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.title}
          </Text>
        </View>

        <Text
          style={[styles.noteDescription, darkMode && styles.darkSubText]}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {item.content}
        </Text>

        <View style={styles.noteFooter}>
          {item.reminderTime && (
            <View style={styles.reminderContainer}>
              <Ionicons
                name="alarm-outline"
                size={14}
                color={darkMode ? '#aaa' : '#666'}
                style={styles.reminderIcon}
              />
              <Text
                style={[styles.reminderText, darkMode && styles.darkSubText]}
              >
                {formatReminderTime(item.reminderTime)}
              </Text>
            </View>
          )}

          {sortOption === 'updatedAt' && (
            <Text style={[styles.dateText, darkMode && styles.darkSubText]}>
              {new Date(item.updatedAt).toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.noteActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={(e) => handleEditNote(item.id, e)}
        >
          <Ionicons
            name="pencil"
            size={18}
            color={darkMode ? '#aaa' : '#666'}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={(e) => handleDeleteNote(item.id, e)}
        >
          <Ionicons name="trash" size={18} color={darkMode ? '#aaa' : '#666'} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )

  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>
      <View style={styles.header}>
        <Text style={[styles.title, darkMode && styles.darkText]}>
          {t('Ghi chú công việc')}
        </Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setShowSortOptions(!showSortOptions)}
          >
            <Ionicons
              name="funnel-outline"
              size={22}
              color={darkMode ? '#fff' : '#333'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.debugButton}
            onPress={() => navigation.navigate('NotesDebug')}
          >
            <Ionicons
              name="bug-outline"
              size={22}
              color={darkMode ? '#fff' : '#333'}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tùy chọn sắp xếp */}
      {showSortOptions && (
        <View
          style={[
            styles.sortOptionsContainer,
            darkMode && styles.darkSortOptionsContainer,
          ]}
        >
          <TouchableOpacity
            style={[
              styles.sortOption,
              sortOption === 'updatedAt' && styles.selectedSortOption,
            ]}
            onPress={() => handleSortOptionChange('updatedAt')}
          >
            <Ionicons
              name="time-outline"
              size={18}
              color={
                sortOption === 'updatedAt'
                  ? '#8a56ff'
                  : darkMode
                  ? '#aaa'
                  : '#666'
              }
            />
            <Text
              style={[
                styles.sortOptionText,
                sortOption === 'updatedAt' && styles.selectedSortOptionText,
                darkMode && styles.darkText,
              ]}
            >
              {t('Theo ngày cập nhật')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.sortOption,
              sortOption === 'priority' && styles.selectedSortOption,
            ]}
            onPress={() => handleSortOptionChange('priority')}
          >
            <Ionicons
              name="star-outline"
              size={18}
              color={
                sortOption === 'priority'
                  ? '#8a56ff'
                  : darkMode
                  ? '#aaa'
                  : '#666'
              }
            />
            <Text
              style={[
                styles.sortOptionText,
                sortOption === 'priority' && styles.selectedSortOptionText,
                darkMode && styles.darkText,
              ]}
            >
              {t('Theo độ ưu tiên')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.sortOption,
              sortOption === 'abc' && styles.selectedSortOption,
            ]}
            onPress={() => handleSortOptionChange('abc')}
          >
            <Ionicons
              name="text-outline"
              size={18}
              color={
                sortOption === 'abc' ? '#8a56ff' : darkMode ? '#aaa' : '#666'
              }
            />
            <Text
              style={[
                styles.sortOptionText,
                sortOption === 'abc' && styles.selectedSortOptionText,
                darkMode && styles.darkText,
              ]}
            >
              {t('Theo ABC')}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Thanh tìm kiếm */}
      <View
        style={[styles.searchContainer, darkMode && styles.darkSearchContainer]}
      >
        <Ionicons
          name="search-outline"
          size={20}
          color={darkMode ? '#aaa' : '#666'}
          style={styles.searchIcon}
        />
        <TextInput
          style={[styles.searchInput, darkMode && styles.darkSearchInput]}
          placeholder={t('Tìm kiếm ghi chú...')}
          placeholderTextColor={darkMode ? '#aaa' : '#999'}
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => handleSearch('')}
          >
            <Ionicons
              name="close-circle"
              size={20}
              color={darkMode ? '#aaa' : '#999'}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Danh sách ghi chú */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8a56ff" />
          <Text style={[styles.loadingText, darkMode && styles.darkSubText]}>
            {t('Đang tải ghi chú...')}
          </Text>
        </View>
      ) : filteredNotes.length > 0 ? (
        <FlatList
          data={filteredNotes}
          renderItem={renderNoteItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.notesList}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="document-text-outline"
            size={64}
            color={darkMode ? '#444' : '#ddd'}
          />
          <Text style={[styles.emptyText, darkMode && styles.darkSubText]}>
            {searchQuery
              ? t('Không tìm thấy ghi chú nào')
              : t('Chưa có ghi chú nào')}
          </Text>
          <Text style={[styles.emptySubText, darkMode && styles.darkSubText]}>
            {searchQuery
              ? t('Thử tìm kiếm với từ khóa khác')
              : t('Nhấn nút + để thêm ghi chú mới')}
          </Text>
        </View>
      )}

      {/* Nút thêm ghi chú mới */}
      <TouchableOpacity style={styles.addButton} onPress={handleAddNote}>
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  debugButton: {
    padding: 8,
    borderRadius: 20,
    marginLeft: 8,
  },
  sortButton: {
    padding: 8,
    borderRadius: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  darkText: {
    color: '#fff',
  },
  darkSubText: {
    color: '#aaa',
  },
  sortOptionsContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  darkSortOptionsContainer: {
    backgroundColor: '#2a2a2a',
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  selectedSortOption: {
    backgroundColor: '#f0e6ff',
    borderRadius: 8,
  },
  sortOptionText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  selectedSortOptionText: {
    color: '#8a56ff',
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 12,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  darkSearchContainer: {
    backgroundColor: '#2a2a2a',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#333',
  },
  darkSearchInput: {
    color: '#fff',
  },
  clearButton: {
    padding: 4,
  },
  notesList: {
    padding: 16,
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  darkNoteItem: {
    backgroundColor: '#2a2a2a',
  },
  noteContent: {
    flex: 1,
    marginRight: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  priorityIcon: {
    marginRight: 6,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  priorityTitle: {
    color: '#000',
  },
  noteDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  noteFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  reminderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderIcon: {
    marginRight: 4,
  },
  reminderText: {
    fontSize: 12,
    color: '#666',
  },
  dateText: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  priorityNoteItem: {
    borderLeftWidth: 3,
    borderLeftColor: '#FFD700',
  },
  noteActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  addButton: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#8a56ff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
})

export default NotesScreen
