// Khai báo các module không có type definitions

declare module 'react' {
  export const useState: any
  export const useEffect: any
  export const useContext: any
  export const useCallback: any
  export const useRef: any
  export const useMemo: any
  export const createContext: any
  export const Component: any
  export const PureComponent: any
  export const Fragment: any
  export const forwardRef: any
  export const memo: any
  export const Children: any
  export const isValidElement: any
  export const cloneElement: any
  export const createElement: any
  export default any
}

declare module 'react-native' {
  export const View: any
  export const Text: any
  export const StyleSheet: any
  export const TouchableOpacity: any
  export const TextInput: any
  export const ScrollView: any
  export const KeyboardAvoidingView: any
  export const Platform: any
  export const Alert: any
  export const Switch: any
  export const Modal: any
  export const ActivityIndicator: any
  export const FlatList: any
  export const SectionList: any
  export const Image: any
  export const Button: any
  export const Pressable: any
  export const SafeAreaView: any
  export const StatusBar: any
  export const Dimensions: any
  export const Animated: any
  export const Easing: any
  export const Keyboard: any
  export const AppState: any
  export const Linking: any
  export const BackHandler: any
  export const PermissionsAndroid: any
  export const ToastAndroid: any
  export const UIManager: any
  export const findNodeHandle: any
  export const useWindowDimensions: any
  export const useColorScheme: any
  export const useAnimatedValue: any
  export default any
}

declare module '@expo/vector-icons' {
  export const Ionicons: any
  export const MaterialIcons: any
  export const FontAwesome: any
  export const FontAwesome5: any
  export const MaterialCommunityIcons: any
  export const AntDesign: any
  export const Entypo: any
  export const Feather: any
  export const EvilIcons: any
  export const Octicons: any
  export const SimpleLineIcons: any
  export const Fontisto: any
  export const Foundation: any
  export const Zocial: any
  export default any
}

declare module 'expo-status-bar' {
  export const StatusBarComponent: any
}

declare module 'expo-notifications' {
  export function addNotificationReceivedListener(
    callback: (notification: any) => void
  ): { remove: () => void }
  export function addNotificationResponseReceivedListener(
    callback: (response: any) => void
  ): { remove: () => void }
  export function setNotificationHandler(handler: any): void
  export function scheduleNotificationAsync(options: any): Promise<string>
  export function cancelScheduledNotificationAsync(
    identifier: string
  ): Promise<void>
  export function cancelAllScheduledNotificationsAsync(): Promise<void>
  export function dismissAllNotificationsAsync(): Promise<void>
  export function getLastNotificationResponseAsync(): Promise<any>
  export function getPresentedNotificationsAsync(): Promise<any[]>
  export function getPermissionsAsync(): Promise<any>
  export function requestPermissionsAsync(): Promise<any>
  export function setBadgeCountAsync(count: number): Promise<void>
  export function getBadgeCountAsync(): Promise<number>
  export function dismissNotificationAsync(identifier: string): Promise<void>
  export function getDevicePushTokenAsync(): Promise<any>
  export function getExpoPushTokenAsync(): Promise<any>
}

declare module '@react-navigation/native' {
  export function useNavigation(): any
  export function useRoute(): any
  export function useFocusEffect(effect: () => void | (() => void)): void
  export const NavigationContainer: React.ComponentType<any>
}

declare module '@react-navigation/stack' {
  export function createStackNavigator(): any
  export const Stack: any
}

declare module '@react-navigation/bottom-tabs' {
  export function createBottomTabNavigator(): any
  export const Tab: any
}

declare module '@react-native-async-storage/async-storage' {
  const AsyncStorage: {
    getItem(key: string): Promise<string | null>
    setItem(key: string, value: string): Promise<void>
    removeItem(key: string): Promise<void>
    mergeItem(key: string, value: string): Promise<void>
    clear(): Promise<void>
    getAllKeys(): Promise<string[]>
    multiGet(keys: string[]): Promise<[string, string | null][]>
    multiSet(keyValuePairs: [string, string][]): Promise<void>
    multiRemove(keys: string[]): Promise<void>
    multiMerge(keyValuePairs: [string, string][]): Promise<void>
  }
  export default AsyncStorage
}

declare module '@react-native-community/datetimepicker' {
  export default function DateTimePicker(props: any): JSX.Element
}

// Khai báo các thuộc tính cho AppProvider
interface AppProviderProps {
  children: React.ReactNode
}

// Khai báo các thuộc tính cho DateTimePicker
interface DateTimePickerProps {
  value: Date
  mode: 'date' | 'time'
  is24Hour?: boolean
  display?: 'default' | 'spinner' | 'clock' | 'calendar'
  onChange: (event: any, date?: Date) => void
  style?: any
  themeVariant?: 'light' | 'dark'
}
