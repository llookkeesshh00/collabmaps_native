import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { View, Text, Dimensions, TouchableOpacity, StyleSheet,Image } from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker, Polyline } from 'react-native-maps';
import Modal from 'react-native-modal';

export default function LiveMapPage() {
    const {
        username, summary, duration, distance, mode,
        points, slat, slng, dlat, dlng
    } = useLocalSearchParams();

    const ws = useRef<WebSocket | null>(null);
    const [roomId, setRoomId] = useState(null);
    const [userId, setUserId] = useState(null);
    const [users, setUsers] = useState({});
    const [modalVisible, setModalVisible] = useState(false);

    // const decodedPoints = points ? JSON.parse(points) : [];

    useEffect(() => {
        const host= '192.168.31.7';
        ws.current = new WebSocket(`ws://${host}:3001`);

        ws.current.onopen = () => {
            ws.current?.send(JSON.stringify({
                type: "CREATE_ROOM",
                payload: { name: username }
            }));
        };

        ws.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === "ROOM_CREATED") {
                setRoomId(data.payload.roomId);
                setUserId(data.payload.userId);
                setUsers(data.payload.users);
            } else if (
                data.type === "UPDATED_ROOM" ||
                data.type === "JOINED_ROOM" ||
                data.type === "DISCONNECT_ROOM"
            ) {
                setUsers(data.payload.users);
            }
        };

        return () => {
            ws.current?.close();
        };
    }, [username]);

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
                    }
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

    return (
        <View style={{ flex: 1 }}>
            {/* 🗺️ MAP */}
            <MapView
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                initialRegion={initialRegion}
            >
                {/* Polyline route */}
                {/* {decodedPoints.length > 0 && (
                    <Polyline
                        coordinates={decodedPoints}
                        strokeWidth={4}
                        strokeColor="blue"
                    />
                )} */}

                {/* All user markers */}
                {Object.entries(users).map(([uid, user]: any) => (
                    user.location && (
                        <Marker
                            key={uid}
                            coordinate={{
                                latitude: user.location.latitude,
                                longitude: user.location.longitude
                            }}
                            title={user.name}
                            pinColor={uid === userId ? "green" : "red"}
                        />
                    )
                ))}
            </MapView>

            {/* 🚀 Show Details Button */}
            <TouchableOpacity
                onPress={() => setModalVisible(true)}
                style={{
                    position: 'absolute',
                    bottom: 40,
                    right: 20,
                    backgroundColor: '#007bff',
                    padding: 12,
                    borderRadius: 25,
                }}
            >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Show Details</Text>
            </TouchableOpacity>

            {/* 📦 Bottom Modal */}
            <Modal
                isVisible={modalVisible}
                onBackdropPress={() => setModalVisible(false)}
                style={{ justifyContent: 'flex-end', margin: 0 }}
            >
                <View style={{
                    backgroundColor: 'white',
                    padding: 20,
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    maxHeight: '70%'
                }}>
                     <View style={styles.detailscontainer}>
                                   <View className='flex  flex-row gap-10 items-center'>
                                       <View style={styles.optionButtoncollab}>
                                           <Image source={require('../assets/images/mode.png')} style={styles.myLocationIcon} />
                                       </View>
                                       <Text style={{color:'',fontSize: 25 ,marginLeft:20}}>{typeof mode === 'string' ? mode.toUpperCase() : ''}</Text>
                                   </View>
                                   <View className='flex  flex-row gap-10 items-center'>
                                       <View style={styles.optionButtoncollab}>
                                           <Image source={require('../assets/images/summary.png')} style={styles.myLocationIcon} />
                                       </View>
                                       <Text style={{color:'',fontSize: 15 ,marginLeft:20}}>{summary}</Text>
                                   </View>
                                   <View className='flex  flex-row gap-3 items-center'>
                                       <View style={styles.optionButtoncollab}>
                                           <Image source={require('../assets/images/distance.png')} style={styles.myLocationIcon} />
                                       </View>
                                        <Text style={{color:'orange',fontSize:30}}>{(Number(distance) / 1000).toFixed(1)} km</Text>
                   
                                   </View>
                                   <View className='flex  flex-row gap-3 items-center'>
                                       <View style={styles.optionButtoncollab}>
                                           <Image source={require('../assets/images/duration.png')} style={styles.myLocationIcon} />
                                       </View>
                                       <Text style={{color:'green',fontSize: 30}}>{(Number(duration) / 60).toFixed(1)} min</Text> 
                                   </View>
                                   {/* <View className='flex  flex-row gap-3 items-center'>
                                       <View style={styles.optionButtoncollab}>
                                           <Image source={require('../assets/images/dest.png')} style={styles.myLocationIcon} />
                                       </View>
                                       <Text style={{color:'green',fontSize: 40}}></Text> 
                                   </View> */}
                               </View>

                    <Text style={{ marginTop: 15, fontWeight: 'bold' }}>🗺️ Users in Room:</Text>
                    {Object.entries(users).map(([uid, user]: any) => (
                        <View key={uid} style={{ marginTop: 5 }}>
                            <Text>👤 {user.name}</Text>
                            {user.location ? (
                                <Text>📍 {user.location.latitude}, {user.location.longitude}</Text>
                            ) : (
                                <Text>📍 Location not shared yet</Text>
                            )}
                        </View>
                    ))}
                </View>
            </Modal>
        </View>
    );
}

const styles= StyleSheet.create({
    optionButtoncollab: {
        marginTop: 15,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 5,
        paddingVertical: 12,
        paddingHorizontal: 12,
        backgroundColor: '#E3E3E3',
        borderRadius: 40,
        borderWidth: 1,
        borderColor: "black",
        
    },
    myLocationIcon: {
        width: 24,
        height: 24,

    },
    detailscontainer:{
        backgroundColor:"#E8E8E8",
        padding:10,
        borderRadius:20,
        
    // Shadow (for iOS)
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,

    // Shadow (for Android)
    elevation: 2,

    }
})