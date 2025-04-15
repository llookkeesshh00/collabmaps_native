import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Share, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Image } from 'react-native';

export default function CollabPage() {
    const { summary, duration, distance, mode, points, slat, slng, dlat, dlng } = useLocalSearchParams();
    const [username, setUsername] = useState('');
    const handleStart = () => {
        if (!username) {
            Alert.alert("Please enter your name");
            return;
        }
    
        router.push({
            pathname: "/livemap",
            params: {
                username,
                summary,
                duration,
                distance,
                mode,
                points: JSON.stringify(points),
                slat,
                slng,
                dlat,
                dlng
            }
        });
    };
    
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Start a Collaborative Trip</Text>
            <View style={styles.detailscontainer}>
                <View className='flex  flex-row gap-3 items-center'>
                    <View style={styles.optionButtoncollab}>
                        <Image source={require('../assets/images/mode.png')} style={styles.myLocationIcon} />
                    </View>
                    <Text style={{color:'',fontSize: 25 }}>{typeof mode === 'string' ? mode.toUpperCase() : ''}</Text>
                </View>
                <View className='flex  flex-row gap-3 items-center'>
                    <View style={styles.optionButtoncollab}>
                        <Image source={require('../assets/images/summary.png')} style={styles.myLocationIcon} />
                    </View>
                    <Text style={{color:'',fontSize: 15 }}>{summary}</Text>
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


            <TextInput
                style={styles.input}
                placeholder="Enter your name"
                value={username}
                onChangeText={setUsername}
            />

            <TouchableOpacity style={styles.button} onPress={handleStart}>
                <Text style={styles.buttonText}>Start and Share</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { padding: 20 ,marginTop:20},
    title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 10,
        padding: 12,
        marginVertical: 20,
    },
    button: {
        backgroundColor: '#2D79F4',
        padding: 15,
        borderRadius: 40,
        alignItems: 'center',
    },
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
    ,
    buttonText: { color: 'white', fontWeight: 'bold',borderRadius:20 },
});
