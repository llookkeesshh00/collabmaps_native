import React, { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { View, Text, Dimensions, TouchableOpacity, StyleSheet, Image } from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker, Polyline } from 'react-native-maps';
import Modal from 'react-native-modal';
import { router } from 'expo-router';

export default function LiveMapPage() {
    const {
        username, summary, duration, distance, mode,
        points, slat, slng, dlat, dlng,
    } = useLocalSearchParams();

    const ws = useRef<WebSocket | null>(null);
    const [roomId, setRoomId] = useState(null);
    const [userId, setUserId] = useState(null);
    const [users, setUsers] = useState({});

    const DecodedPoints: { latitude: number; longitude: number }[] =
        typeof points === 'string' ? JSON.parse(points) : [];

    useEffect(() => {
        const connect = async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;
            
            ws.current = new WebSocket(`ws://192.168.31.7:3001`);
            ws.current.onopen = () => {
                ws.current?.send(JSON.stringify({
                    type: "CREATE_ROOM",
                    payload: {
                        name: username,
                        points: DecodedPoints,
                    }
                }));
            };

            ws.current.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === "CREATED_ROOM") {
                    setRoomId(data.payload.roomId);
                    setUserId(data.payload.userId);
                }
                if (data.type === "UPDATED_ROOM") {
                    if (data.payload?.users && typeof data.payload.users === 'object') {
                        const updatedUsers = Object.entries(data.payload.users).map(([uid, user]: [string, any]) => ({
                            ...user,
                            route: typeof user.route === 'string' ? JSON.parse(user.route) : user.route,
                        }));
                        setUsers(updatedUsers);
                    }
                }
            };
        };

        connect();
        return () => ws.current?.close();
    }, []);

    useEffect(() => {
        const sendLocation = async () => {
            if (!userId || !roomId || !ws.current || ws.current.readyState !== WebSocket.OPEN) return;

            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;

            const location = await Location.getCurrentPositionAsync({});
            ws.current.send(JSON.stringify({
                type: "UPDATE_LOCATION",
                payload: {
                    userId,
                    location: {
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude
                    },
                }
            }));
        };

        const intervalId = setInterval(sendLocation, 10000);
        return () => clearInterval(intervalId);
    }, [userId, roomId]);

    const initialRegion = {
        latitude: parseFloat(slat as string),
        longitude: parseFloat(slng as string),
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    };

    const predefinedColors = [
        '#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231',
        '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe',
        '#008080', '#e6beff', '#9a6324', '#fffac8', '#800000'
    ];

    const getColorForUserId = (userId: string) => {
        let hash = 0;
        for (let i = 0; i < userId.length; i++) {
            hash = userId.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % predefinedColors.length;
        return predefinedColors[index];
    };

    const getUserIconIndex = (uid: string) => {
        let hash = 0;
        for (let i = 0; i < uid.length; i++) {
            hash = uid.charCodeAt(i) + ((hash << 5) - hash);
        }
        return Math.abs(hash % 10) + 1;
    };

    const formatDuration = (seconds: number) => {
        const totalMinutes = Math.floor(seconds / 60);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return hours > 0
            ? `${hours} hr${hours > 1 ? 's' : ''}${minutes > 0 ? ` ${minutes} min` : ''}`
            : `${minutes} min`;
    };

    const getArrivalTime = (durationSeconds: number) => {
        const arrival = new Date(Date.now() + durationSeconds * 1000);
        return arrival.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <View style={{ flex: 1 }}>
            <MapView
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                initialRegion={initialRegion}
            >
                <Marker coordinate={{ latitude: parseFloat(dlat as string), longitude: parseFloat(dlng as string) }}>
                    <View style={{ width: 30, height: 30 }}>
                        <Image
                            source={require(`../assets/images/destination.png`)}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="contain"
                        />
                    </View>
                </Marker>

                {Object.entries(users).map(([uid, user]: any) => {
                    const userLocation = user.location ?? {
                        latitude: parseFloat(slat as string),
                        longitude: parseFloat(slng as string)
                    };

                    const color = getColorForUserId(uid);
                    const points = user.points ? JSON.parse(user.points) : [];
                    return (
                        <React.Fragment key={uid}>
                            <Marker coordinate={userLocation}>
                                <View style={{ width: 30, height: 30 }}>
                                    <Image
                                        source={require(`../assets/images/usericon1.png`)}
                                        style={{ width: '100%', height: '100%' }}
                                        resizeMode="contain"
                                    />
                                </View>
                            </Marker>
                            {points.length > 0 && (
                                <Polyline
                                    coordinates={[
                                        userLocation,
                                        ...points,
                                        {
                                            latitude: parseFloat(dlat as string),
                                            longitude: parseFloat(dlng as string)
                                        }
                                    ]}
                                    strokeWidth={4}
                                    strokeColor={color}
                                />
                            )}
                        </React.Fragment>
                    );
                })}
            </MapView>

            <Modal
                isVisible={true}
                backdropOpacity={0}
                style={{ justifyContent: 'flex-end', margin: 0 }}
                coverScreen={false}
                hasBackdrop={false}
                useNativeDriver={true}
            >
                <View style={styles.modalContainer}>
                    <View style={{ alignItems: 'center' }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>Room ID:</Text>
                        <Text selectable style={{ fontSize: 16, color: 'blue' }}>{roomId ?? "Creating..."}</Text>
                    </View>

                    <View style={{ alignItems: 'center' }}>
                        <Text style={{ fontSize: 26, fontWeight: 'bold', color: 'orange' }}>
                            {formatDuration(Number(duration))}
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <Text style={{ fontSize: 15 }}>{(Number(distance) / 1000).toFixed(1)} km</Text>
                            <Text style={{ fontSize: 15 }}>| {getArrivalTime(Number(duration))}</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={() => {
                            if (ws.current?.readyState === WebSocket.OPEN) {
                                ws.current.send(JSON.stringify({
                                    type: 'TERMINATE_ROOM',
                                    payload: {
                                        userId,
                                        roomId,
                                    },
                                }));
                            }
                            setTimeout(() => {
                                ws.current?.close();
                            }, 100);
                            router.replace('/home');
                        }}
                    >
                        <View className="flex flex-row gap-3 items-center">
                            <View style={styles.optionButtoncollab}>
                                <Image source={require('../assets/images/close.png')} style={styles.myLocationIcon} />
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    optionButtoncollab: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 5,
        paddingVertical: 12,
        paddingHorizontal: 12,
        backgroundColor: '#E3E3E3',
        borderRadius: 40,
        borderWidth: 0,
        borderColor: "gray",
    },
    myLocationIcon: {
        width: 24,
        height: 24,
    },
    modalContainer: {
        backgroundColor: 'white',
        padding: 20,
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        maxHeight: '25%',
        gap: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 10,
    },
});
