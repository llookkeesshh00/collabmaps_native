import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useUserStore, useRoomStore } from '../stores';

export default function ProfileScreen() {
  const { user, logout } = useUserStore();
  const { currentRoom, leaveRoom } = useRoomStore();
  const router = useRouter();

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? This will remove your user data from this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            // If in a room, leave it first
            if (currentRoom) {
              try {
                await leaveRoom();
              } catch (error) {
                console.error('Error leaving room:', error);
              }
            }
            
            // Then logout the user
            await logout();
            
            // Redirect to auth screen
            router.replace('./screens/onboarding/CreateUserScreen');
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>
      
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <FontAwesome name="user-circle" size={80} color="#2563EB" />
        </View>
        
        <View style={styles.userInfo}>
          <Text style={styles.displayName}>{user?.displayName || 'User'}</Text>
          <Text style={styles.userId}>ID: {user?.id || 'Unknown'}</Text>
          <Text style={styles.joinDate}>
            Joined: {user?.createdAt 
              ? new Date(user.createdAt).toLocaleDateString() 
              : 'Unknown date'}
          </Text>
        </View>
      </View>
      
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Settings</Text>
        
        <View style={styles.settingsList}>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Location Sharing</Text>
            <Text style={styles.settingValue}>Enabled</Text>
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Map Type</Text>
            <Text style={styles.settingValue}>Standard</Text>
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Notifications</Text>
            <Text style={styles.settingValue}>Enabled</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.actionsSection}>
        <TouchableOpacity style={styles.actionButton} onPress={handleLogout}>
          <FontAwesome name="sign-out" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>CollabMaps v1.0.0</Text>
      </View>
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
  profileCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  displayName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userId: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  joinDate: {
    fontSize: 14,
    color: '#666',
  },
  settingsSection: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  settingsList: {
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabel: {
    fontSize: 16,
  },
  settingValue: {
    fontSize: 16,
    color: '#2563EB',
  },
  actionsSection: {
    padding: 16,
  },
  actionButton: {
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#888',
  },
});