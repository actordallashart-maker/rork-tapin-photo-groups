import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Zap } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface BlitzLivePillProps {
  secondsRemaining: number;
  onPress: () => void;
}

export default function BlitzLivePill({ secondsRemaining, onPress }: BlitzLivePillProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Animated.View style={[styles.container, { transform: [{ scale: pulseAnim }] }]}>
        <Zap size={16} color="#000" fill="#000" />
        <Text style={styles.text}>Blitz Live</Text>
        <Text style={styles.timer}>{formatTime(secondsRemaining)}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.blitzYellow,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 6,
    alignSelf: 'flex-start',
  },
  text: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700' as const,
  },
  timer: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600' as const,
  },
});
