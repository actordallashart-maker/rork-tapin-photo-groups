import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';

interface ConfigBlockerProps {
  missingKeys: string[];
  envDebug?: Record<string, string>;
}

export default function ConfigBlocker({ missingKeys, envDebug }: ConfigBlockerProps) {
  const maskValue = (val: string) => {
    if (!val || val === "(empty)") return val;
    return val.length > 6 ? val.substring(0, 6) + "..." : val;
  };
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Backend Not Configured</Text>
          <Text style={styles.subtitle}>
            TapIn requires Firebase backend services to run.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Missing Configuration:</Text>
          {missingKeys.map((key) => (
            <View key={key} style={styles.keyItem}>
              <Text style={styles.keyText}>• {key}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Required Setup:</Text>
          <Text style={styles.helpText}>
            1. Create a Firebase project at console.firebase.google.com
          </Text>
          <Text style={styles.helpText}>
            2. Add Firebase environment variables to your .env file
          </Text>
          <Text style={styles.helpText}>
            3. Configure Firebase Authentication and Firestore
          </Text>
          <Text style={styles.helpText}>
            4. Restart the app
          </Text>
        </View>

        {envDebug && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ENV DEBUG (temporary):</Text>
            {Object.entries(envDebug).map(([key, value]) => {
              const displayValue = key.includes('ApiKey') || key.includes('API_KEY') 
                ? maskValue(value)
                : value;
              return (
                <Text key={key} style={styles.envDebug}>
                  {key}: {displayValue}
                </Text>
              );
            })}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Firebase Configuration Example:</Text>
          <Text style={styles.envExample}>EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyxxx...</Text>
          <Text style={styles.envExample}>EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id</Text>
          <Text style={styles.envExample}>EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com</Text>
          <Text style={styles.envExample}>EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  content: {
    padding: 24,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    lineHeight: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 12,
  },
  keyItem: {
    marginBottom: 8,
  },
  keyText: {
    fontSize: 15,
    color: Colors.dark.accent,
    fontFamily: 'monospace',
  },
  helpText: {
    fontSize: 15,
    color: Colors.dark.textSecondary,
    lineHeight: 22,
    marginBottom: 8,
  },
  envExample: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    fontFamily: 'monospace',
    backgroundColor: Colors.dark.surface,
    padding: 8,
    borderRadius: 4,
    marginTop: 4,
    marginBottom: 4,
  },
  envDebug: {
    fontSize: 12,
    color: Colors.dark.accent,
    fontFamily: 'monospace',
    backgroundColor: Colors.dark.surface,
    padding: 6,
    borderRadius: 4,
    marginTop: 2,
    marginBottom: 2,
  },
});
