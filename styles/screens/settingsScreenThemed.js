import { StyleSheet } from 'react-native'

export const createSettingsScreenStyles = (colors) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 0,
    },
    section: {
      marginBottom: 8,
      marginHorizontal: 0,
      backgroundColor: colors.cardBackground,
      borderRadius: 0,
      overflow: 'hidden',
    },
    sectionHeader: {
      padding: 16,
      paddingBottom: 8,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    sectionDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 2,
    },
    settingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    settingLabel: {
      fontSize: 16,
      color: colors.text,
      flex: 1,
    },
    settingDescription: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 4,
    },
    switch: {
      marginLeft: 8,
    },
    actionButton: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    actionButtonText: {
      fontSize: 16,
      color: colors.primary,
    },
    languageSelector: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    languageText: {
      fontSize: 16,
      color: colors.textSecondary,
      marginRight: 8,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
    },
    infoLabel: {
      fontSize: 16,
      color: colors.text,
    },
    infoValue: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      width: '80%',
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 20,
      maxHeight: '80%',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 16,
      textAlign: 'center',
      color: colors.text,
    },
    modalOption: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      marginBottom: 8,
      backgroundColor: colors.itemBackground,
    },
    selectedOption: {
      backgroundColor: colors.primaryLight,
    },
    optionText: {
      fontSize: 16,
      color: colors.text,
    },
    selectedOptionText: {
      fontWeight: 'bold',
      color: colors.primary,
    },
    modalButtonsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 16,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
      marginHorizontal: 4,
    },
    cancelButton: {
      backgroundColor: colors.itemBackground,
    },
    confirmButton: {
      backgroundColor: colors.primary,
    },
    cancelButtonText: {
      fontSize: 16,
      color: colors.text,
    },
    confirmButtonText: {
      fontSize: 16,
      color: '#FFFFFF',
      fontWeight: 'bold',
    },
  })
}
