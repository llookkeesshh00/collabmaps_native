import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { View, Text } from 'react-native';

export default function LiveMapPage() {
    const {
        username, summary, duration, distance, mode,
        points, slat, slng, dlat, dlng
    } = useLocalSearchParams();

    const ws = useRef<WebSocket | null>(null);
    const [roomId, setRoomId] = useState(null);
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        console.log("Setting up WebSocket connection...");
        ws.current = new WebSocket("ws://10.0.2.2:3001");

        ws.current.onopen = () => {
            console.log("🟢 Connected to WS");

            if (ws.current) {
                const payload = {
                    type: "CREATE_ROOM",
                    payload: { name: username }
                };
                console.log("Sending CREATE_ROOM message:", payload);
                ws.current.send(JSON.stringify(payload));
            }
        };

        ws.current.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log("Received WebSocket message:", data);

                if (data.type === "ROOM_CREATED") {
                    console.log("Room created:", data.payload);
                    setRoomId(data.payload.roomId);
                    setUserId(data.payload.userId);
                }
            } catch (error) {
                console.error("Error parsing WebSocket message:", error);
            }
        };

        ws.current.onerror = (error) => {
            console.error("WebSocket error:", error);
        };

        ws.current.onclose = (event) => {
            console.log("WebSocket closed:", event);
        };

        // Cleanup: close WebSocket when component unmounts
        return () => {
            if (ws.current) {
                console.log("Closing WebSocket connection...");
                ws.current.close();
            }
        };
    }, [username]);

    return (
        <View style={{ padding: 20 }}>
            <Text>👤 {username}</Text>
            <Text>🧭 Route: {summary} | {distance} | {duration}</Text>
            <Text>🚀 Room ID: {roomId}</Text>
            <Text>👥 User ID: {userId}</Text>
        </View>
    );
}
