import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

const NotesScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ghi chú công việc</Text>
      {/* Nội dung ghi chú sẽ được bổ sung sau */}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
})

export default NotesScreen
