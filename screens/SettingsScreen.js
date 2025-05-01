'use client'

import { useContext, useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  TextInput,
  Modal,
} from 'react-native'
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons'
import { AppContext } from '../context/AppContext'
import AsyncStorage from '@react-native-async-storage/async-storage'

const SettingsScreen = ({ navigation }) => {
  const {
    t,
    darkMode,
    language,
    notificationSound,
    notificationVibration,
    alarmPermissionGranted,
    onlyGoWorkMode,
    // Functions
    toggleDarkMode,
    changeLanguage,
    toggleNotificationSound,
    toggleNotificationVibration,
    toggleOnlyGoWorkMode,
    requestAlarmPermission,
  } = useContext(AppContext)

  const languages = [
    { id: 'vi', name: 'Tiếng Việt' },
    { id: 'en', name: 'English' },
  ]

  const [showLanguageModal, setShowLanguageModal] = useState(false)

  const handleLanguageChange = (langId) => {
    changeLanguage(langId)
    setShowLanguageModal(false)
  }

  const [weatherAlertsEnabled, setWeatherAlertsEnabled] = useState(true)

  useEffect(() => {
    // Load weather alerts setting
    const loadWeatherAlertsSetting = async () => {
      try {
        const value = await AsyncStorage.getItem('weatherAlertsEnabled')
        if (value !== null) {
          setWeatherAlertsEnabled(value === 'true')
        }
      } catch (error) {
        console.error('Error loading weather alerts setting:', error)
      }
    }

    loadWeatherAlertsSetting()
  }, [])

  const toggleWeatherAlerts = (value) => {
    setWeatherAlertsEnabled(value)
    // Save setting to AsyncStorage
    AsyncStorage.setItem('weatherAlertsEnabled', value.toString())
  }

  return (
    <ScrollView style={[styles.container, darkMode && styles.darkContainer]}>
      {/* 1. General Settings */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons
            name="settings"
            size={24}
            color={darkMode ? '#fff' : '#000'}
          />
          <Text style={[styles.sectionTitle, darkMode && styles.darkText]}>
            {t('General Settings')}
          </Text>
        </View>

        {/* Dark Mode Setting */}
        <View style={styles.settingItem}>
          <View style={styles.settingLabelContainer}>
            <Text style={[styles.settingLabel, darkMode && styles.darkText]}>
              {t('Dark Mode')}
            </Text>
          </View>
          <Switch
            value={darkMode}
            onValueChange={toggleDarkMode}
            trackColor={{ false: '#767577', true: '#8a56ff' }}
            thumbColor={darkMode ? '#fff' : '#f4f3f4'}
          />
        </View>

        {/* Language Setting */}
        <TouchableOpacity
          style={[styles.menuItem, darkMode && styles.darkCard]}
          onPress={() => setShowLanguageModal(true)}
        >
          <View style={styles.menuIconContainer}>
            <MaterialIcons
              name="language"
              size={24}
              color={darkMode ? '#fff' : '#000'}
            />
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={[styles.menuTitle, darkMode && styles.darkText]}>
              {t('Language')}
            </Text>
            <Text
              style={[styles.menuDescription, darkMode && styles.darkSubtitle]}
            >
              {languages.find((lang) => lang.id === language)?.name}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* 2. Work Settings */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons
            name="work"
            size={24}
            color={darkMode ? '#fff' : '#000'}
          />
          <Text style={[styles.sectionTitle, darkMode && styles.darkText]}>
            {t('Work Settings')}
          </Text>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLabelContainer}>
            <Text style={[styles.settingLabel, darkMode && styles.darkText]}>
              {t('Only Go Work Mode')}
            </Text>
            <Text
              style={[
                styles.settingDescription,
                darkMode && styles.darkSubtitle,
              ]}
            >
              {t(
                'Only show Go Work button instead of the full attendance flow'
              )}
            </Text>
          </View>
          <Switch
            value={onlyGoWorkMode}
            onValueChange={toggleOnlyGoWorkMode}
            trackColor={{ false: '#767577', true: '#8a56ff' }}
            thumbColor={onlyGoWorkMode ? '#fff' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* 3. Notification Settings */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons
            name="notifications"
            size={24}
            color={darkMode ? '#fff' : '#000'}
          />
          <Text style={[styles.sectionTitle, darkMode && styles.darkText]}>
            {t('Notification Settings')}
          </Text>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLabelContainer}>
            <Text style={[styles.settingLabel, darkMode && styles.darkText]}>
              {t('Sound')}
            </Text>
          </View>
          <Switch
            value={notificationSound}
            onValueChange={toggleNotificationSound}
            trackColor={{ false: '#767577', true: '#8a56ff' }}
            thumbColor={notificationSound ? '#fff' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLabelContainer}>
            <Text style={[styles.settingLabel, darkMode && styles.darkText]}>
              {t('Vibration')}
            </Text>
          </View>
          <Switch
            value={notificationVibration}
            onValueChange={toggleNotificationVibration}
            trackColor={{ false: '#767577', true: '#8a56ff' }}
            thumbColor={notificationVibration ? '#fff' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* 4. Weather Settings */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons
            name="cloud"
            size={24}
            color={darkMode ? '#fff' : '#000'}
          />
          <Text style={[styles.sectionTitle, darkMode && styles.darkText]}>
            {t('Weather Settings')}
          </Text>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLabelContainer}>
            <Text style={[styles.settingLabel, darkMode && styles.darkText]}>
              {t('Weather Alerts')}
            </Text>
          </View>
          <Switch
            value={weatherAlertsEnabled}
            onValueChange={toggleWeatherAlerts}
            trackColor={{ false: '#767577', true: '#8a56ff' }}
            thumbColor={weatherAlertsEnabled ? '#fff' : '#f4f3f4'}
          />
        </View>
      </View>
      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, darkMode && styles.darkModalContent]}
          >
            <Text style={[styles.modalTitle, darkMode && styles.darkText]}>
              {t('Select Language')}
            </Text>

            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.id}
                style={[
                  styles.languageOption,
                  darkMode && styles.darkLanguageOption,
                  language === lang.id && styles.selectedLanguageOption,
                  language === lang.id &&
                    darkMode &&
                    styles.darkSelectedLanguageOption,
                ]}
                onPress={() => handleLanguageChange(lang.id)}
              >
                <Text
                  style={[
                    styles.languageText,
                    darkMode && styles.darkText,
                    language === lang.id && styles.selectedLanguageText,
                  ]}
                >
                  {lang.name}
                </Text>
                {language === lang.id && (
                  <MaterialIcons name="check" size={24} color="#8a56ff" />
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.cancelButton, darkMode && styles.darkCancelButton]}
              onPress={() => setShowLanguageModal(false)}
            >
              <Text style={styles.cancelButtonText}>{t('Cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
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
  darkSubtitle: {
    color: '#aaa',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginLeft: 8,
  },
  darkCard: {
    backgroundColor: '#1e1e1e',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingLabelContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: '#000',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: '#666',
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  menuDescription: {
    fontSize: 14,
    color: '#666',
  },

  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    maxHeight: '80%',
  },

  darkModalContent: {
    backgroundColor: '#2a2a2a',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f0f0f0',
  },
  darkLanguageOption: {
    backgroundColor: '#3a3a3a',
  },
  selectedLanguageOption: {
    backgroundColor: '#e6e0ff',
  },
  darkSelectedLanguageOption: {
    backgroundColor: '#4a3b80',
  },
  languageText: {
    fontSize: 16,
    color: '#333',
  },
  selectedLanguageText: {
    fontWeight: 'bold',
    color: '#8a56ff',
  },

  cancelButton: {
    flex: 1,
    marginRight: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  darkCancelButton: {
    backgroundColor: '#3a3a3a',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#8a56ff',
    fontWeight: 'bold',
  },
})

export default SettingsScreen
