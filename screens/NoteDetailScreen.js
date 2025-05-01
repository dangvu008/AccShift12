'use client'

import { useContext, useState, useEffect } from 'react'
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native'
import { AppContext } from '../context/AppContext'
import NoteFormModal from '../components/NoteFormModal'
import NoteForm from '../components/NoteForm'

const NoteDetailScreen = ({ navigation, route }) => {
  const { t, darkMode } = useContext(AppContext)
  const noteId = route.params?.noteId
  const [isLoading, setIsLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const isEditing = !!noteId

  useEffect(() => {
    // Show modal immediately
    setIsLoading(false)
    setModalVisible(true)
  }, [])

  const handleModalClose = () => {
    setModalVisible(false)
    // Navigate back after modal is closed
    navigation.goBack()
  }

  const handleNoteSaved = (noteId, isDeleted = false) => {
    console.log(
      'Ghi chú đã được lưu/xóa, noteId:',
      noteId,
      'isDeleted:',
      isDeleted
    )

    // Close modal and navigate back with params to indicate data has changed
    setModalVisible(false)
    navigation.navigate({
      name:
        navigation.getState().routes[navigation.getState().index - 1]?.name ||
        'HomeStack',
      params: { notesUpdated: true, timestamp: Date.now() },
      merge: true,
    })
  }

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          darkMode && styles.darkContainer,
          styles.loadingContainer,
        ]}
      >
        <ActivityIndicator size="large" color="#8a56ff" />
        <Text style={[styles.loadingText, darkMode && styles.darkText]}>
          {t('Đang tải...')}
        </Text>
      </View>
    )
  }

  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>
      {/* Hiển thị modal */}
      <NoteFormModal
        visible={modalVisible}
        onClose={handleModalClose}
        title={isEditing ? t('Chỉnh Sửa Ghi Chú') : t('Thêm Ghi Chú Mới')}
      >
        <NoteForm
          noteId={noteId}
          onSave={handleNoteSaved}
          onDelete={handleNoteSaved}
        />
      </NoteFormModal>
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
  darkText: {
    color: '#fff',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
})

export default NoteDetailScreen
