import React, { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { router } from 'expo-router';
import { useWebSocket, User } from './services/WebSocketService';
const userIcons = {
    1: require('../assets/images/usericon1.png'),
    2: require('../assets/images/usericon2.png'),
    3: require('../assets/images/usericon3.png'),
    4: require('../assets/images/usericon4.png'),
    5: require('../assets/images/usericon5.png'),
    6: require('../assets/images/usericon6.png'),
    7: require('../assets/images/usericon7.png'),
    8: require('../assets/images/usericon8.png'),
    9: require('../assets/images/usericon9.png'),
    10: require('../assets/images/usericon10.png'),


} as const;

export default function LiveMapPage() {
    const {
        username, slat, slng, dlat, dlng, placeId, 
        points, duration, distance, mode
    } = useLocalSearchParams();

    const [roomId, setRoomId] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [users, setUsers] = useState<Record<string, User>>({});
    const [routeCoordinates, setRouteCoordinates] = useState<any[] | null>(null);
    const [routeInfo, setRouteInfo] = useState<{
        duration?: string;
        distance?: string;
        mode?: string;
    }>({});
    const [showAllRoutes, setShowAllRoutes] = useState(true);
    
    const webSocketService = useWebSocket();

    useEffect(() => {
        const initializeWebSocket = async () => {
            try {
                // Connect to WebSocket server
                await webSocketService.connect();
                
                // Set up message handlers
                webSocketService.onMessage('CREATED_ROOM', (payload) => {
                    console.log('Room created:', payload);
                    setRoomId(payload.roomId);
                    setUserId(payload.userId);
                    webSocketService.setRoomAndUserIds(payload.roomId, payload.userId);
                    webSocketService.startLocationUpdates();
                    if (payload.users) {
                        setUsers(payload.users);
                    }
                });
                
                webSocketService.onMessage('UPDATED_ROOM', (payload) => {
                    console.log('Room updated:', payload);
                    if (payload?.users && typeof payload.users === 'object') {
                        setUsers(payload.users);
                    }
                });

                webSocketService.onMessage('JOIN_SUCCESS', (payload) => {
                    console.log('Join success:', payload);
                    setRoomId(payload.roomId);
                    setUserId(payload.userId);
                    webSocketService.setRoomAndUserIds(payload.roomId, payload.userId);
                    webSocketService.startLocationUpdates();
                    if (payload.users) {
                        setUsers(payload.users);
                    }
                });
                
                webSocketService.onMessage('UPDATE_ROUTE', (payload) => {
                    console.log('Route updated:', payload);
                    if (payload?.users && typeof payload.users === 'object') {
                        setUsers(payload.users);
                    }
                });
                
                webSocketService.onMessage('ERROR', (payload) => {
                    console.error('WebSocket error:', payload.message);
                    Alert.alert("Error", payload.message || "An error occurred");
                });
                
                // Create a new room or join existing based on parameters
                const currentUrl = router.url || '';
                if (currentUrl.includes('/join')) {
                    // Join existing room logic
                    console.log('Joining existing room');
                } else {
                    // Create a new room
                    console.log('Creating new room with username:', username);
                    webSocketService.createRoom(
                        username as string,
                        {
                            latitude: parseFloat(slat as string),
                            longitude: parseFloat(slng as string),
                        },
                        {
                            latitude: parseFloat(dlat as string),
                            longitude: parseFloat(dlng as string),
                        },
                        placeId as string,
                    );
                }
            } catch (error) {
                console.error('Failed to initialize WebSocket:', error);
                Alert.alert("Connection Error", "Failed to connect to server. Please try again.");
            }
        };

        initializeWebSocket();

        // Parse route points if available
        if (points) {
            try {
                const parsedPoints = JSON.parse(points as string);
                setRouteCoordinates(parsedPoints);
                
                // Set route information
                setRouteInfo({
                    duration: duration as string,
                    distance: distance as string,
                    mode: mode as string
                });
                
                // Also send this route to other users
                if (parsedPoints && duration && distance && mode) {
                    webSocketService.updateRoute({
                        points: parsedPoints,
                        duration: duration as string,
                        distance: distance as string,
                        mode: mode as string
                    });
                }
            } catch (error) {
                console.error('Failed to parse route points:', error);
            }
        }

        // Cleanup on component unmount
        return () => {
            webSocketService.disconnect();
        };
    }, [points, duration, distance, mode]);

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

    const handleCloseRoom = () => {
        webSocketService.terminateRoom();
        router.replace('/home');
    };

    const handleDirections = () => {
        // Navigate to route selection screen
        router.push({
            pathname: '/route',
            params: {
                slat: slat as string,
                slng: slng as string,
                dlat: dlat as string, 
                dlng: dlng as string,
                placeId: placeId as string,
                username: username as string,
                from: 'livemap'
            }
        });
    };

    const toggleShowAllRoutes = () => {
        setShowAllRoutes(!showAllRoutes);
    };

    return (
        <View style={{ flex: 1 }}>
            {/* Room ID display at the top */}
            <View style={styles.roomIdContainer}>
                <Text style={styles.roomIdLabel}>Room ID:</Text>
                <Text style={styles.roomIdText} selectable>{roomId ?? "Creating..."}</Text>
                <TouchableOpacity onPress={handleCloseRoom} style={styles.closeButton}>
                    <Image source={require('../assets/images/close.png')} style={styles.closeIcon} />
                </TouchableOpacity>
            </View>

            {/* Users in room counter */}
            <View style={styles.usersCountContainer}>
                <Text style={styles.usersCountText}>
                    {Object.keys(users).length} {Object.keys(users).length === 1 ? 'user' : 'users'} in room
                </Text>
            </View>

            {/* Route Info display - only show if route is selected */}
            {routeCoordinates && (
                <View style={styles.routeInfoContainer}>
                    <View style={styles.routeInfoRow}>
                        <Image source={require('../assets/images/duration.png')} style={styles.routeInfoIcon} />
                        <Text style={styles.routeInfoText}>
                            {routeInfo.duration ? (parseInt(routeInfo.duration) / 60).toFixed(1) + ' min' : 'N/A'}
                        </Text>
                    </View>
                    <View style={styles.routeInfoRow}>
                        <Image source={require('../assets/images/distance.png')} style={styles.routeInfoIcon} />
                        <Text style={styles.routeInfoText}>
                            {routeInfo.distance ? (parseInt(routeInfo.distance) / 1000).toFixed(1) + ' km' : 'N/A'}
                        </Text>
                    </View>
                    <View style={styles.routeInfoRow}>
                        <Image 
                            source={
                                routeInfo.mode === 'bike' ? require('../assets/images/bike.png') :
                                routeInfo.mode === 'car' ? require('../assets/images/car.png') :
                                routeInfo.mode === 'train' ? require('../assets/images/train.png') :
                                routeInfo.mode === 'walk' ? require('../assets/images/walk.png') :
                                require('../assets/images/mode.png')
                            } 
                            style={styles.routeInfoIcon} 
                        />
                        <Text style={styles.routeInfoText}>
                            {routeInfo.mode ? routeInfo.mode.charAt(0).toUpperCase() + routeInfo.mode.slice(1) : 'N/A'}
                        </Text>
                    </View>
                </View>
            )}

            <MapView
                style={{ flex: 1 }}
                initialRegion={initialRegion}
            >
                {/* Display selected route if available */}
                {routeCoordinates && (
                    <>
                        {/* Border Polyline (background stroke) */}
                        <Polyline
                            coordinates={routeCoordinates}
                            strokeWidth={10}
                            strokeColor="rgba(77, 123, 255, 0.5)"
                            zIndex={1}
                        />
                        {/* Main Polyline */}
                        <Polyline
                            coordinates={routeCoordinates}
                            strokeWidth={5}
                            strokeColor="#4D7BFF"
                            zIndex={2}
                        />
                    </>
                )}

                {/* Display other users' routes if showAllRoutes is true */}
                {showAllRoutes && Object.entries(users).map(([uid, user]) => {
                    if (uid !== userId && user.route && user.route.points && user.route.points.length > 0) {
                        const color = getColorForUserId(uid);
                        return (
                            <Polyline
                                key={`route-${uid}`}
                                coordinates={user.route.points}
                                strokeWidth={4}
                                strokeColor={color}
                                zIndex={0}
                            />
                        );
                    }
                    return null;
                })}

                <Marker coordinate={{ latitude: parseFloat(dlat as string), longitude: parseFloat(dlng as string) }}>
                    <View style={{ width: 30, height: 30 }}>
                        <Image
                            source={require('../assets/images/destination.png')}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="contain"
                        />
                    </View>
                </Marker>

                {Object.entries(users).map(([uid, user]: [string, any]) => {
                    const userLocation = user.location ?? {
                        latitude: parseFloat(slat as string),
                        longitude: parseFloat(slng as string)
                    };

                    const color = getColorForUserId(uid);
                    
                    return (
                        <React.Fragment key={uid}>
                            <Marker coordinate={userLocation}>
                                <View style={{ width: 30, height: 30 }}>
                                    <Image
                                        source={require('../assets/images/usericon1.png')}
                                        style={{ width: '100%', height: '100%' }}
                                        resizeMode="contain"
                                    />
                                </View>
                            </Marker>
                        </React.Fragment>
                    );
                })}
            </MapView>

            {/* Directions Button */}
            <TouchableOpacity 
                style={styles.directionsButton}
                onPress={handleDirections}
            >
                <Image 
                    source={require('../assets/images/directions.png')} 
                    style={styles.directionsIcon} 
                    resizeMode="contain"
                />
            </TouchableOpacity>

            {/* Toggle All Routes Button */}
            <TouchableOpacity 
                style={styles.toggleRoutesButton}
                onPress={toggleShowAllRoutes}
            >
                <Image 
                    source={require('../assets/images/summary.png')} 
                    style={styles.directionsIcon} 
                    resizeMode="contain"
                />
                <Text style={styles.toggleButtonText}>
                    {showAllRoutes ? 'Hide' : 'Show'} Routes
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    roomIdContainer: {
        position: 'absolute',
        top: 50,
        alignSelf: 'center',
        backgroundColor: 'white',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5
    },
    roomIdLabel: {
        fontSize: 16, 
        fontWeight: 'bold',
        marginRight: 8
    },
    roomIdText: {
        fontSize: 16,
        color: '#2D79F4',
        fontWeight: '500'
    },
    closeButton: {
        marginLeft: 16,
        padding: 5
    },
    closeIcon: {
        width: 18,
        height: 18
    },
    usersCountContainer: {
        position: 'absolute',
        top: 100,
        alignSelf: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 15,
        paddingVertical: 5,
        paddingHorizontal: 12,
        zIndex: 10
    },
    usersCountText: {
        color: 'white',
        fontWeight: '500',
        fontSize: 14
    },
    userNameBadge: {
        position: 'absolute',
        bottom: -15,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 5,
        paddingVertical: 2,
        borderRadius: 10,
        alignSelf: 'center'
    },
    userNameText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold'
    },
    directionsButton: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        backgroundColor: 'white',
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5
    },
    directionsIcon: {
        width: 30,
        height: 30
    },
    routeInfoContainer: {
        position: 'absolute',
        top: 150,
        alignSelf: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 15,
        paddingVertical: 10,
        paddingHorizontal: 15,
        zIndex: 10
    },
    routeInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5
    },
    routeInfoIcon: {
        width: 20,
        height: 20,
        marginRight: 8
    },
    routeInfoText: {
        color: 'white',
        fontWeight: '500',
        fontSize: 14
    },
    toggleRoutesButton: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        backgroundColor: 'rgba(45, 121, 244, 0.8)',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5
    },
    toggleButtonText: {
        color: 'white',
        fontWeight: 'bold',
        marginLeft: 5
    }
});
