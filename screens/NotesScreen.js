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

const NotesScreen = ({ navigation }) => {
  const { t, darkMode } = useContext(AppContext)
  const [notes, setNotes] = useState([])
  const [filteredNotes, setFilteredNotes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Tải danh sách ghi chú khi màn hình được focus
  // Tải danh sách ghi chú
  const loadNotes = useCallback(async () => {
    setIsLoading(true)
    try {
      const allNotes = await getNotes()
      // Sắp xếp ghi chú theo thời gian cập nhật mới nhất
      const sortedNotes = allNotes.sort((a, b) => {
        return new Date(b.updatedAt) - new Date(a.updatedAt)
      })
      setNotes(sortedNotes)
      setFilteredNotes(sortedNotes)
    } catch (error) {
      console.error('Lỗi khi tải ghi chú:', error)
      Alert.alert(t('Lỗi'), t('Không thể tải danh sách ghi chú'))
    } finally {
      setIsLoading(false)
    }
  }, [t])

  // Tải danh sách ghi chú khi màn hình được focus
  useFocusEffect(
    useCallback(() => {
      loadNotes()
    }, [loadNotes])
  )

  // Xử lý tìm kiếm
  const handleSearch = (text) => {
    setSearchQuery(text)
    if (!text.trim()) {
      setFilteredNotes(notes)
      return
    }

    const filtered = notes.filter(
      (note) =>
        note.title.toLowerCase().includes(text.toLowerCase()) ||
        note.content.toLowerCase().includes(text.toLowerCase())
    )
    setFilteredNotes(filtered)
  }

  // Xử lý khi nhấn vào ghi chú
  const handleNotePress = (noteId) => {
    navigation.navigate('NoteDetail', { noteId })
  }

  // Xử lý khi nhấn nút thêm ghi chú mới
  const handleAddNote = () => {
    navigation.navigate('NoteDetail')
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
      style={[styles.noteItem, darkMode && styles.darkNoteItem]}
      onPress={() => handleNotePress(item.id)}
    >
      <View style={styles.noteContent}>
        <Text
          style={[styles.noteTitle, darkMode && styles.darkText]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {item.title}
        </Text>
        <Text
          style={[styles.noteDescription, darkMode && styles.darkSubText]}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {item.content}
        </Text>
        {item.reminderTime && (
          <View style={styles.reminderContainer}>
            <Ionicons
              name="alarm-outline"
              size={14}
              color={darkMode ? '#aaa' : '#666'}
              style={styles.reminderIcon}
            />
            <Text style={[styles.reminderText, darkMode && styles.darkSubText]}>
              {formatReminderTime(item.reminderTime)}
            </Text>
          </View>
        )}
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={darkMode ? '#aaa' : '#ccc'}
      />
    </TouchableOpacity>
  )

  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>
      <View style={styles.header}>
        <Text style={[styles.title, darkMode && styles.darkText]}>
          {t('Ghi chú công việc')}
        </Text>
      </View>

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
  noteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  noteDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  reminderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  reminderIcon: {
    marginRight: 4,
  },
  reminderText: {
    fontSize: 12,
    color: '#666',
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
