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
import { COLORS } from '../utils/theme'

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
            <View
              style={[styles.modalHeader, darkMode && styles.darkModalHeader]}
            >
              <Text style={[styles.title, darkMode && styles.darkText]}>
                {title || t('Thêm/Sửa ghi chú')}
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
                <Ionicons
                  name="close"
                  size={24}
                  color={darkMode ? COLORS.TEXT_DARK : COLORS.TEXT_LIGHT}
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
    backgroundColor: COLORS.CARD_LIGHT,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  darkModalContainer: {
    backgroundColor: COLORS.CARD_DARK,
  },
  modalHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_LIGHT,
    paddingBottom: 16,
  },
  darkModalHeader: {
    borderBottomColor: COLORS.BORDER_DARK,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.TEXT_LIGHT,
    flex: 1,
  },
  darkText: {
    color: COLORS.TEXT_DARK,
  },
  closeIcon: {
    padding: 4,
  },
})

export default NoteFormModal
