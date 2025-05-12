import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRoomStore, useUserStore } from '../stores';

export default function RoomScreen() {
  const [activeTab, setActiveTab] = useState<'join' | 'create'>('join');
  const { user } = useUserStore();
  const { currentRoom } = useRoomStore();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Room</Text>
        {currentRoom ? (
          <Text style={styles.roomCode}>Room Code: {currentRoom.roomCode}</Text>
        ) : (
          <Text style={styles.subTitle}>Join or create a collaboration room</Text>
        )}
      </View>

      {!currentRoom ? (
        <View style={styles.tabContainer}>
          <View style={styles.tabHeader}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'join' && styles.activeTab]}
              onPress={() => setActiveTab('join')}
            >
              <Text style={[styles.tabText, activeTab === 'join' && styles.activeTabText]}>
                Join Room
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'create' && styles.activeTab]}
              onPress={() => setActiveTab('create')}
            >
              <Text style={[styles.tabText, activeTab === 'create' && styles.activeTabText]}>
                Create Room
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tabContent}>
            {activeTab === 'join' ? (
              <View style={styles.centerContent}>
                <Text style={styles.placeholderText}>Join Room Interface Coming Soon</Text>
              </View>
            ) : (
              <View style={styles.centerContent}>
                <Text style={styles.placeholderText}>Create Room Interface Coming Soon</Text>
              </View>
            )}
          </View>
        </View>
      ) : (
        <View style={styles.roomContainer}>
          <View style={styles.roomInfo}>
            <Text style={styles.roomName}>{currentRoom.name || 'Unnamed Room'}</Text>
            <Text style={styles.roomDetails}>
              Mode: {currentRoom.mode} • 
              Created: {new Date(currentRoom.createdAt).toLocaleTimeString()}
            </Text>
          </View>
          
          <View style={styles.membersSection}>
            <Text style={styles.sectionTitle}>Room Members</Text>
            <Text style={styles.placeholderText}>Members list coming soon</Text>
          </View>

          <View style={styles.chatSection}>
            <Text style={styles.sectionTitle}>Chat</Text>
            <View style={styles.chatPlaceholder}>
              <Text style={styles.placeholderText}>Chat interface coming soon</Text>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subTitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  roomCode: {
    fontSize: 16,
    color: '#2563EB',
    fontWeight: '600',
    marginTop: 4,
  },
  tabContainer: {
    flex: 1,
  },
  tabHeader: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#2563EB',
  },
  tabText: {
    fontWeight: '600',
    fontSize: 16,
    color: '#333',
  },
  activeTabText: {
    color: '#fff',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
  },
  roomContainer: {
    flex: 1,
    padding: 16,
  },
  roomInfo: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  roomName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  roomDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  membersSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  chatSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    flex: 1,
  },
  chatPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginTop: 8,
    padding: 16,
  },
});