import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';

export default function JoinPage() {
    const [roomId, setRoomId] = useState('');
    const [username, setUsername] = useState('');

    const handleJoin = () => {
        if (roomId && username) {
          
          router.push({
                pathname: '/livemap',
                params: {
                     username,
                    roomId,
                    
                },
            });
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Username</Text>
            <TextInput style={styles.input} value={username} onChangeText={setUsername} />

            <Text style={styles.label}>Room ID</Text>
            <TextInput style={styles.input} value={roomId} onChangeText={setRoomId} />

            <Button title="Join Room" onPress={handleJoin} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        backgroundColor: 'white',
    },
    label: {
        fontSize: 16,
        marginBottom: 5,
        fontWeight: 'bold',
    },
    input: {
        borderWidth: 1,
        borderColor: 'gray',
        borderRadius: 8,
        padding: 10,
        marginBottom: 20,
    },
});
