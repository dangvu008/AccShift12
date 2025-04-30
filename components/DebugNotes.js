import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, Button, ScrollView } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { STORAGE_KEYS } from '../utils/constants'
import { createSampleNotes, clearAllNotes } from '../utils/sampleNotes'

const DebugNotes = () => {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)

  const loadNotes = async () => {
    setLoading(true)
    try {
      const notesJson = await AsyncStorage.getItem(STORAGE_KEYS.NOTES)
      const parsedNotes = notesJson ? JSON.parse(notesJson) : []
      setNotes(parsedNotes)
    } catch (error) {
      console.error('Lỗi khi tải ghi chú:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotes()
  }, [])

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Debug Notes</Text>
      <View style={styles.buttonContainer}>
        <Button title="Refresh Notes" onPress={loadNotes} />
        <Button
          title="Create Sample Notes"
          onPress={async () => {
            await createSampleNotes()
            loadNotes()
          }}
        />
        <Button
          title="Clear All Notes"
          onPress={async () => {
            await clearAllNotes()
            loadNotes()
          }}
        />
      </View>

      {loading ? (
        <Text>Đang tải...</Text>
      ) : notes.length > 0 ? (
        <ScrollView style={styles.notesContainer}>
          {notes.map((note) => (
            <View key={note.id} style={styles.noteItem}>
              <Text style={styles.noteTitle}>Title: {note.title}</Text>
              <Text>Content: {note.content}</Text>
              <Text>Reminder Time: {note.reminderTime || 'None'}</Text>
              <Text>Linked Shifts: {note.linkedShifts?.length || 0}</Text>
              <Text>Created: {note.createdAt}</Text>
              <Text>Updated: {note.updatedAt}</Text>
              <Text>ID: {note.id}</Text>
            </View>
          ))}
        </ScrollView>
      ) : (
        <Text style={styles.emptyText}>Không có ghi chú nào</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  notesContainer: {
    maxHeight: 300,
    marginTop: 16,
  },
  noteItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  noteTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  emptyText: {
    marginTop: 16,
    fontStyle: 'italic',
    color: '#666',
  },
})

export default DebugNotes
