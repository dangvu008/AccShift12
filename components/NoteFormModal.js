import React, { useContext } from 'react'
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { AppContext } from '../context/AppContext'

const NoteFormModal = ({ visible, onClose, children, title }) => {
  const { t, darkMode } = useContext(AppContext)

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.overlay}>
          <View
            style={[
              styles.modalContainer,
              darkMode && styles.darkModalContainer,
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.title, darkMode && styles.darkText]}>
                {title || t('Thêm/Sửa ghi chú')}
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
                <Ionicons
                  name="close"
                  size={24}
                  color={darkMode ? '#fff' : '#000'}
                />
              </TouchableOpacity>
            </View>

            {children}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  darkModalContainer: {
    backgroundColor: '#1e1e1e',
  },
  modalHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
  },
  darkText: {
    color: '#fff',
  },
  closeIcon: {
    padding: 4,
  },
})

export default NoteFormModal
