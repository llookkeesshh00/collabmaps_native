import React, { createContext, useState, useContext, useRef, useCallback, useEffect } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';

// Define toast types for styling
export type ToastType = 'join' | 'leave' | 'info';

// Toast notification interface
interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

// Context interface
interface ToastContextType {
  showToast: (message: string, type: ToastType) => void;
}

// Create the context with a default value
const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

// Toast provider props
interface ToastProviderProps {
  children: React.ReactNode;
}

// Generate unique IDs for toasts
let nextId = 1;

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Show a toast notification
  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = nextId++;
    setToasts(prevToasts => [...prevToasts, { id, message, type }]);
    
    // Reset the animation value
    fadeAnim.setValue(0);
    
    // Fade in
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      // Hold visible
      Animated.delay(2000),
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Remove the toast after animation completes
      setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    });
  }, [fadeAnim]);

  // Get toast background color based on type
  const getBackgroundColor = (type: ToastType) => {
    switch (type) {
      case 'join':
        return 'rgba(46, 204, 113, 0.9)'; // Green for joining
      case 'leave':
        return 'rgba(231, 76, 60, 0.9)'; // Red for leaving
      default:
        return 'rgba(52, 152, 219, 0.9)'; // Blue for general info
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.length > 0 && (
        <View style={styles.toastContainer}>
          {toasts.map(toast => (
            <Animated.View
              key={toast.id}
              style={[
                styles.toast,
                { 
                  backgroundColor: getBackgroundColor(toast.type),
                  opacity: fadeAnim,
                  transform: [{ 
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-20, 0],
                    })
                  }]
                }
              ]}
            >
              <Text style={styles.toastText}>{toast.message}</Text>
            </Animated.View>
          ))}
        </View>
      )}
    </ToastContext.Provider>
  );
};

// Custom hook to use toast
export const useToast = () => useContext(ToastContext);

// Add a default export that returns null
// This is needed because the file is treated as a route component
export default function ToastContextComponent() {
  return null;
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 60, // Position below status bar and align with participants button
    alignSelf: 'center',
    zIndex: 9999,
  },
  toast: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 25,
    marginVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  toastText: {
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
});