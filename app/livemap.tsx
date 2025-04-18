import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert, ScrollView, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useLocalSearchParams, router } from 'expo-router';
import { useWebSocket } from './services/WebSocketService';
import Modal from 'react-native-modal';
import { Animated, Easing } from 'react-native';
// import React, { useEffect, useRef } from 'react';


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
    // Get parameters from URL
    const { username, slat, slng, dlat, dlng, placeId, points, duration, distance, mode } = useLocalSearchParams();
    const webSocketService = useWebSocket();
    const { roomId, userId } = webSocketService.getRoomAndUserIds() || { roomId: '', userId: '' };

    // Use refs for MapView to prevent unnecessary re-renders
    const mapRef = useRef(null);

    // Parse URL parameters for current user location and destination
    const myLocation = useMemo(() => ({
        latitude: parseFloat(slat as string || '0'),
        longitude: parseFloat(slng as string || '0'),
    }), [slat, slng]);

    const destinationLocation = useMemo(() => ({
        latitude: parseFloat(dlat as string || '0'),
        longitude: parseFloat(dlng as string || '0'),
    }), [dlat, dlng]);

    // State for room data from WebSocket
    const [users, setUsers] = useState<Record<string, any>>({});
    const [routeCoordinates, setRouteCoordinates] = useState<any[] | null>(null);
    const [routeInfo, setRouteInfo] = useState({ duration, distance, mode });
    const [showAllRoutes, setShowAllRoutes] = useState(false); // Default to hiding routes
    const [isLoading, setIsLoading] = useState(true);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedUser, setSelectedUser] = useState<string | null>(null);

    // Track the current user's location based on WebSocket room updates
    const [myCurrentLocation, setMyCurrentLocation] = useState(myLocation);

    // Memoize initial region to center the map
    const initialRegion = useMemo(() => ({
        latitude: myLocation.latitude,
        longitude: myLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    }), [myLocation]);

    // Validate if coordinates are usable (not NaN or out of bounds)
    const isValidCoordinate = useCallback((coord: { latitude: number, longitude: number }) => {
        return coord !== null &&
            !isNaN(coord.latitude) &&
            !isNaN(coord.longitude) &&
            Math.abs(coord.latitude) <= 90 &&
            Math.abs(coord.longitude) <= 180;
    }, []);

    // Fetch room details on component mount
    useEffect(() => {
        async function fetchRoomDetails() {
            if (roomId) {
                try {
                    setIsLoading(true);
                    // Use setRoomDetails instead of getRoomDetails as per the WebSocketService implementation
                    const data = await webSocketService.setRoomDetails(roomId);
                    // Update state with room details (other users)
                    if (data && data.users) {
                        setUsers(data.users);

                        // If the current user has a route in the room data, update route info
                        if (userId && data.users[userId] && data.users[userId].route) {
                            const userRoute = data.users[userId].route;
                            setRouteCoordinates(userRoute.points);
                            setRouteInfo({
                                duration: userRoute.duration,
                                distance: userRoute.distance,
                                mode: userRoute.mode
                            });
                        }
                    }
                } catch (error) {
                    console.error('Error fetching room details:', error);
                    Alert.alert("Error", "Failed to load room details. Please try again.");
                } finally {
                    setIsLoading(false);
                }
            } else {
                setIsLoading(false); // No roomId, so don't wait for loading
            }
        }

        fetchRoomDetails();

        // Update own location on server
        if (userId && roomId && isValidCoordinate(myLocation)) {
            webSocketService.updateLocation(myLocation);
        }
    }, [roomId, userId, myLocation, isValidCoordinate]);

    // Set up message listeners for WebSocket updates
    useEffect(() => {
        // Create message handler functions
        const handleUpdatedRoom = (payload: any) => {
            if (payload?.users) {
                setUsers(payload.users);
            }
        };

        const handleRouteUpdate = (payload: any) => {
            if (payload?.userId && payload?.route) {
                setUsers(prevUsers => ({
                    ...prevUsers,
                    [payload.userId]: {
                        ...(prevUsers[payload.userId] || {}),
                        route: payload.route
                    }
                }));
            }
        };

        const handleError = (payload: any) => {
            Alert.alert("Error", payload.message || "Something went wrong");
        };

        // Register message handlers - using ROOM_DETAILS instead of UPDATED_ROOM
        const unsubscribeRoomDetails = webSocketService.onMessage('ROOM_DETAILS', handleUpdatedRoom);
        const unsubscribeUpdateRoute = webSocketService.onMessage('UPDATE_ROUTE', handleUpdatedRoom); // This will also contain room details
        const unsubscribeError = webSocketService.onMessage('ERROR', handleError);

        // Handle incoming route if passed from route screen
        if (points) {
            try {
                const parsedPoints = JSON.parse(points as string);
                setRouteCoordinates(parsedPoints);

                if (userId) {
                    webSocketService.updateRoute(userId, {
                        points: parsedPoints,
                        duration: duration as string,
                        distance: distance as string,
                        mode: mode as string,
                    });
                } else {
                    console.log("userId not found error");
                }
            } catch (err) {
                console.error('Invalid route points:', err);
            }
        }

        // Clean up function
        return () => {
            // Unsubscribe from all events
            unsubscribeRoomDetails();
            unsubscribeUpdateRoute();
            unsubscribeError();
            webSocketService.disconnect(); // Clean up on unmount
        };
    }, [points, duration, distance, mode]);

    // Update my location from the WebSocketService's room details
    useEffect(() => {
        // Check for location updates in any WebSocket message
        const checkForLocationUpdate = () => {
            // Get the current room details from the service
            if (roomId && userId) {
                const roomDetails = webSocketService.getRoomDetails(roomId);

                // If room details exist and have our user with location data
                if (roomDetails?.users && roomDetails.users[userId]?.location) {
                    const userLocation = roomDetails.users[userId].location;

                    // Update our location if it's valid
                    if (userLocation &&
                        typeof userLocation.latitude === 'number' &&
                        typeof userLocation.longitude === 'number') {
                        setMyCurrentLocation(userLocation);
                    }
                }
            }
        };

        // Create a generic handler to capture all WebSocket messages
        const handleAnyMessage = () => {
            checkForLocationUpdate();
        };

        // Register handlers for common message types that might contain room updates
        const unsubscribeLocationUpdate = webSocketService.onMessage('UPDATE_LOCATION', handleAnyMessage);
        const unsubscribeRouteUpdate = webSocketService.onMessage('UPDATE_ROUTE', handleAnyMessage);
        const unsubscribeJoinRoom = webSocketService.onMessage('JOIN_ROOM', handleAnyMessage);
        const unsubscribeRoomDetails = webSocketService.onMessage('ROOM_DETAILS', handleAnyMessage);

        // Initial check for location data
        checkForLocationUpdate();

        // Clean up all handlers
        return () => {
            unsubscribeLocationUpdate();
            unsubscribeRouteUpdate();
            unsubscribeJoinRoom();
            unsubscribeRoomDetails();
        };
    }, [roomId, userId, webSocketService]);

    // Force render markers with delay for debugging
    useEffect(() => {
        console.log('Setting up force render timer');
        const timer = setTimeout(() => {
            // Force a component update
            setIsLoading(false);
        }, 2000);

        return () => clearTimeout(timer);
    }, [myLocation, destinationLocation]);
    const glowAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, {
                    toValue: 1.6,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(glowAnim, {
                    toValue: 1,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    // Memoized callbacks
    const handleCloseRoom = useCallback(() => {
        Alert.alert(
            "Leave Room",
            "Are you sure you want to leave this room?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Leave",
                    onPress: () => {
                        webSocketService.terminateRoom();
                        router.replace('/home');
                    },
                    style: "destructive"
                }
            ]
        );
    }, []);

    const handleDirections = useCallback(() => {
        router.push({
            pathname: '/route',
            params: {
                slat,
                slng,
                dlat,
                dlng,
                placeId,
                username,
                from: 'livemap',
                roomId,
                userId
            }
        });
    }, [slat, slng, dlat, dlng, placeId, username, roomId, userId]);

    const toggleShowAllRoutes = useCallback(() => {
        setShowAllRoutes(prev => !prev);
    }, []);

    // Memoize user icons and colors to prevent recreation on every render
    const getColorForUserId = useCallback((uid: string) => {
        const colors = ['#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe'];
        let hash = 0;
        for (let i = 0; i < uid.length; i++) {
            hash = uid.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    }, []);

    const getUserIcon = useCallback((uid: string) => {
        let hash = 0;
        for (let i = 0; i < uid.length; i++) {
            hash = uid.charCodeAt(i) + ((hash << 5) - hash);
        }
        return userIcons[(Math.abs(hash) % 10 + 1) as keyof typeof userIcons];
    }, []);

    // Find users at the same location and calculate offsets
    const getUserLocationOffsets = useCallback((currentUid: string) => {
        // Create a map of locations to user IDs
        const locationMap: Record<string, string[]> = {};

        // Group users by location
        Object.entries(users).forEach(([uid, user]) => {
            if (user.location) {
                // Create a location key with reduced precision to group nearby users
                const locKey = `${user.location.latitude.toFixed(5)},${user.location.longitude.toFixed(5)}`;

                if (!locationMap[locKey]) {
                    locationMap[locKey] = [];
                }
                locationMap[locKey].push(uid);
            }
        });

        // Find this user's location key and position in the group
        const userLocKey = Object.keys(locationMap).find(locKey =>
            locationMap[locKey].includes(currentUid)
        );

        if (userLocKey && locationMap[userLocKey].length > 1) {
            // If multiple users at same location, find position in the group
            const index = locationMap[userLocKey].indexOf(currentUid);
            const total = locationMap[userLocKey].length;

            // Calculate offset based on position
            // Arrange in a small circle around the exact point
            const radius = 0.0001; // ~10 meters
            const angle = (index / total) * 2 * Math.PI;

            return {
                latitudeOffset: radius * Math.sin(angle),
                longitudeOffset: radius * Math.cos(angle)
            };
        }

        return { latitudeOffset: 0, longitudeOffset: 0 };
    }, [users]);

    // Memoized markers for other users (from WebSocket data)
    const OtherUserMarkers = useMemo(() => {
        return Object.entries(users).map(([uid, user]) => {
            // Skip current user as we show them separately from URL params
            if (uid === userId) return null;

            // Get user location from WebSocket data
            const loc = user.location || null;
            if (!loc || !isValidCoordinate(loc)) return null;

            // Calculate offset if multiple users are at the same location
            const { latitudeOffset, longitudeOffset } = getUserLocationOffsets(uid);

            return (
                <Marker key={uid} coordinate={{
                    latitude: loc.latitude + latitudeOffset,
                    longitude: loc.longitude + longitudeOffset
                }} tracksViewChanges={false} onPress={() => {
                    Alert.alert(
                        user.name || "User",
                        `Last updated: ${user.lastUpdated || "Unknown"}`
                    );
                }}>
                    <View>
                        <Image source={getUserIcon(uid)} style={{ width: 30, height: 30 }} resizeMode="contain" />
                        <View style={styles.userNameBadge}>
                            <Text style={styles.userNameText}>{user.name?.slice(0, 10) || 'User'}</Text>
                        </View>
                    </View>
                </Marker>
            );
        });
    }, [users, userId, isValidCoordinate, getUserLocationOffsets, getUserIcon]);

    // Routes from other users (WebSocket data)
    const OtherUserRoutes = useMemo(() => {
        if (!showAllRoutes) return null;

        return Object.entries(users).map(([uid, user]) => {
            if (uid !== userId && user.route?.points?.length > 0) {
                return (
                    <Polyline
                        key={uid}
                        coordinates={user.route.points}
                        strokeWidth={4}
                        strokeColor={getColorForUserId(uid)}
                    />
                );
            }
            return null;
        });
    }, [users, showAllRoutes, userId]);

    // Current user's route
    const MyRoute = useMemo(() => {
        if (!routeCoordinates) return null;

        return (
            <>
                <Polyline
                    coordinates={routeCoordinates}
                    strokeWidth={10}
                    strokeColor="rgba(77, 123, 255, 0.5)"
                />
                <Polyline
                    coordinates={routeCoordinates}
                    strokeWidth={5}
                    strokeColor="#4D7BFF"
                />
            </>
        );
    }, [routeCoordinates]);

    // Loading indicator
    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#2D79F4" />
                <Text style={{ marginTop: 10 }}>Loading room details...</Text>
            </View>
        );
    }

    function formatDuration(durationInSeconds: number): string {
        const hours = Math.floor(durationInSeconds / 3600);
        const minutes = Math.floor((durationInSeconds % 3600) / 60);
        const seconds = durationInSeconds % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        } else {
            return `${seconds}s`;
        }
    }

    function getArrivalTime(durationInSeconds: number): string {
        const now = new Date();
        const arrivalTime = new Date(now.getTime() + durationInSeconds * 1000);

        const hours = arrivalTime.getHours();
        const minutes = arrivalTime.getMinutes();

        // Format time as HH:MM AM/PM
        const formattedTime = `${hours % 12 || 12}:${minutes.toString().padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
        return formattedTime;
    }

    return (
        <View style={{ flex: 1 }}>

            <View style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <View style={styles.usersCountContainer}>
                    {/* Stack vertically here */}
                    <View style={{ flexDirection: 'column', alignItems: 'center' }}>
                        {/* Top row: icon + text + dot */}
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Image source={require('../assets/images/team.png')} style={styles.routeInfoIcon} />
                            <Text style={styles.usersCountText}> {Object.keys(users).length} in room</Text>
                            <Animated.View
                                style={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: 5,
                                    backgroundColor: 'yellow',
                                    marginLeft: 6,
                                    transform: [{ scale: glowAnim }],
                                    shadowColor: 'green',
                                    shadowOffset: { width: 0, height: 0 },
                                    shadowOpacity: 0.8,
                                    shadowRadius: 6,
                                    elevation: 5,
                                }}
                            />
                        </View>

                        {/* View button just below the text */}
                        <TouchableOpacity
                            onPress={() => {
                                setIsModalVisible(true);
                            }}
                            style={[styles.participantsButton, { marginTop: 5 }]}
                        >
                            <Text style={styles.participantsButtonText}>View</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>




            <MapView
                ref={mapRef}
                style={{ flex: 1 }}
                initialRegion={initialRegion}
                provider={PROVIDER_GOOGLE}
            >
                {/* DESTINATION MARKER */}
                <Marker
                    coordinate={{
                        latitude: parseFloat(dlat as string) || 0,
                        longitude: parseFloat(dlng as string) || 0
                    }}
                >
                    <Image
                        source={require('../assets/images/destination.png')}
                        style={{ width: 40, height: 40 }}
                    />
                </Marker>

                {/* MY USER MARKER - using proper user icon instead of current.png */}
                <Marker
                    coordinate={myCurrentLocation}
                    onPress={() => {
                        if (userId && users[userId]) {
                            Alert.alert(
                                users[userId].name || "You",
                                `Last updated: ${users[userId].lastUpdated || "Unknown"}`
                            );
                        }
                    }}
                >
                    <Image
                        source={getUserIcon(userId || "me")}
                        style={{ width: 40, height: 40 }}
                    />
                    <View style={styles.userNameBadge}>
                        <Text style={styles.userNameText}>{username || "You"}</Text>
                    </View>
                </Marker>

                {/* Routes */}
                {MyRoute}
                {OtherUserRoutes}

                {/* REPLACE OTHER USER MARKERS with enhanced version */}
                {OtherUserMarkers}
            </MapView>

            <TouchableOpacity style={styles.directionsButton} onPress={handleDirections}>
                <Image source={require('../assets/images/directions.png')} style={styles.directionsIcon} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.toggleRoutesButton} onPress={toggleShowAllRoutes}>
                <Image source={require('../assets/images/summary.png')} style={styles.directionsIcon} />
                <Text style={styles.toggleButtonText}>{showAllRoutes ? 'Hide' : 'Show'} Routes</Text>
            </TouchableOpacity>

            {/* Participants Modal */}
            <Modal
                isVisible={isModalVisible}
                animationIn="slideInUp"
                animationOut="slideOutDown"
                backdropOpacity={0.2}
                coverScreen={true}
                style={{ margin: 0 }}
                onBackdropPress={() => setIsModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Participants</Text>
                        <ScrollView style={{ maxHeight: 300, width: '100%' }}>
                            {Object.entries(users).map(([uid, user]) => (
                                <View key={uid} style={styles.participantRow}>
                                    <Image source={getUserIcon(uid)} style={styles.participantIcon} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.participantName}>{user.name || 'Unknown'}</Text>
                                        <Text style={styles.participantTimestamp}>
                                            Last updated: {user.lastUpdated || 'Unknown'}
                                        </Text>
                                        {user.route && (
                                            <Text style={styles.participantRoute}>
                                                {user.route.mode} • {(parseInt(user.route.distance) / 1000).toFixed(1)}km • {(parseInt(user.route.duration) / 60).toFixed(1)}min
                                            </Text>
                                        )}
                                    </View>
                                    <Animated.View
                                        style={{
                                            width: 10,
                                            height: 10,
                                            borderRadius: 5,
                                            backgroundColor: getColorForUserId(uid),
                                            marginLeft: 36,
                                            transform: [{ scale: glowAnim }],
                                            shadowColor: 'green',
                                            shadowOffset: { width: 0, height: 0 },
                                            shadowOpacity: 0.8,
                                            shadowRadius: 6,
                                            elevation: 5,
                                        }}
                                    />

                                </View>
                            ))}
                        </ScrollView>
                        <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.closeModalButton}>
                            <Text style={styles.closeModalButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {routeCoordinates && (
                <Modal
                    isVisible={true}
                    backdropOpacity={0}
                    style={{ justifyContent: 'flex-end', margin: 0 }}
                    coverScreen={false}
                    hasBackdrop={false}
                    useNativeDriver={true} // allow gestures to pass through


                >

                    <View style={styles.bottomModalContainer}>
                        <View style={{ alignItems: 'center' }}>
                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>Room ID:</Text>
                            <Text selectable style={{ fontSize: 16, color: 'blue' }}>{roomId ?? "Creating..."}</Text>
                        </View>

                        <View style={{ alignItems: 'center' }}>
                            <Text style={{ fontSize: 26, fontWeight: 'bold', color: '#F74B00' }}>
                                {formatDuration(parseInt(duration as string, 10))}
                            </Text>
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <Image source={require('../assets/images/distance.png')} style={styles.routeInfoIcon} />
                                <Text style={{ fontSize: 15 }}>{(parseInt(routeInfo.distance as string) / 1000).toFixed(1)} km | </Text>
                                <Image source={require('../assets/images/duration.png')} style={styles.routeInfoIcon} />
                                <Text style={{ fontSize: 15 }}>{getArrivalTime(parseInt(duration as string, 10))}</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={() => {
                                handleCloseRoom()
                            }}
                        >
                            <View className="flex flex-row gap-3 items-center">
                                <View style={styles.optionButtoncollab}>
                                    <Image source={require('../assets/images/close.png')} style={styles.myLocationIcon} />
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>
                </Modal>)}


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
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
        , gap: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 15,
        paddingVertical: 5,
        paddingHorizontal: 12,
        zIndex: 10
    },
    usersCountText: {
        color: 'white',
        textAlign: 'center',
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
        bottom: 160,
        right: 16,
        backgroundColor: 'blue',
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

    routeInfoIcon: {
        width: 20,
        height: 20
    },
    routeInfoText: {
        color: 'white',
        fontWeight: '500',
        fontSize: 14
    },
    toggleRoutesButton: {
        position: 'absolute',
        bottom: 106,
        right: 16,
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
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)'
    },
    modalContent: {
        width: '80%',
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10
    },
    participantRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        margin: 4
    },
    participantIcon: {
        width: 30,
        height: 30,
        marginRight: 10
    },
    participantName: {
        fontSize: 16
    },
    closeModalButton: {
        marginTop: 20,
        backgroundColor: '#2D79F4',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10
    },
    closeModalButtonText: {
        color: 'white',
        fontWeight: 'bold'
    },
    participantsButton: {
        marginTop: 5,
        backgroundColor: '#2D79F4',
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 10
    },
    participantsButtonText: {
        color: 'white',
        fontWeight: 'bold'
    },
    participantRoute: {
        fontSize: 12,
        color: '#666',
        marginTop: 2
    },
    leaveButton: {
        marginLeft: 16,
        padding: 5,
        backgroundColor: '#FF3B30',
        borderRadius: 5
    },
    leaveButtonText: {
        color: 'white',
        fontWeight: 'bold'
    },
    participantTimestamp: {
        fontSize: 12,
        color: '#666',
        marginTop: 2
    },
    routeInfoHeader: {
        marginBottom: 5,
        alignItems: 'center'
    },
    routeInfoHeaderText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16
    },
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
    bottomModalContainer: {
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