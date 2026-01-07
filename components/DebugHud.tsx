import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Clipboard from 'expo-clipboard';

interface DebugHudProps {
  tabName: 'Today' | 'Blitz';
  activeUserId: string;
  activeGroupId: string;
  hasPosted: boolean;
  cycleStart?: string;
  cycleEnd?: string;
  roundStart?: string;
  roundEnd?: string;
  photosCount: number;
}

export default function DebugHud({
  tabName,
  activeUserId,
  activeGroupId,
  hasPosted,
  cycleStart,
  cycleEnd,
  roundStart,
  roundEnd,
  photosCount,
}: DebugHudProps) {
  const debugText = `
=== DEBUG HUD ===
Tab: ${tabName}
Active User ID: ${activeUserId}
Active Group ID: ${activeGroupId}
Has Posted: ${hasPosted}
${cycleStart ? `Cycle Start: ${cycleStart}` : ''}
${cycleEnd ? `Cycle End: ${cycleEnd}` : ''}
${roundStart ? `Round Start: ${roundStart}` : ''}
${roundEnd ? `Round End: ${roundEnd}` : ''}
Photos Count: ${photosCount}
================
`.trim();

  const handleCopy = async () => {
    await Clipboard.setStringAsync(debugText);
    console.log('[DebugHud] Copied to clipboard');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🐛 DEBUG HUD</Text>
        <TouchableOpacity style={styles.copyButton} onPress={handleCopy}>
          <Text style={styles.copyText}>Copy</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.row}>
        <Text style={styles.label}>Tab:</Text>
        <Text style={styles.value}>{tabName}</Text>
      </View>
      
      <View style={styles.row}>
        <Text style={styles.label}>User ID:</Text>
        <Text style={styles.value}>{activeUserId}</Text>
      </View>
      
      <View style={styles.row}>
        <Text style={styles.label}>Group ID:</Text>
        <Text style={styles.value}>{activeGroupId}</Text>
      </View>
      
      <View style={styles.row}>
        <Text style={styles.label}>Posted:</Text>
        <Text style={[styles.value, hasPosted && styles.valueGreen]}>
          {hasPosted ? 'YES' : 'NO'}
        </Text>
      </View>
      
      {cycleStart && (
        <View style={styles.row}>
          <Text style={styles.label}>Cycle Start:</Text>
          <Text style={styles.value}>{cycleStart}</Text>
        </View>
      )}
      
      {cycleEnd && (
        <View style={styles.row}>
          <Text style={styles.label}>Cycle End:</Text>
          <Text style={styles.value}>{cycleEnd}</Text>
        </View>
      )}
      
      {roundStart && (
        <View style={styles.row}>
          <Text style={styles.label}>Round Start:</Text>
          <Text style={styles.value}>{roundStart}</Text>
        </View>
      )}
      
      {roundEnd && (
        <View style={styles.row}>
          <Text style={styles.label}>Round End:</Text>
          <Text style={styles.value}>{roundEnd}</Text>
        </View>
      )}
      
      <View style={styles.row}>
        <Text style={styles.label}>Photos:</Text>
        <Text style={[styles.value, styles.valueHighlight]}>{photosCount}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 8,
    padding: 12,
    minWidth: 280,
    borderWidth: 2,
    borderColor: '#00FF00',
    zIndex: 9999,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#00FF00',
  },
  title: {
    color: '#00FF00',
    fontSize: 12,
    fontWeight: '700' as const,
    fontFamily: 'monospace' as const,
  },
  copyButton: {
    backgroundColor: '#00FF00',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  copyText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '700' as const,
    fontFamily: 'monospace' as const,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  label: {
    color: '#888',
    fontSize: 11,
    fontFamily: 'monospace' as const,
  },
  value: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600' as const,
    fontFamily: 'monospace' as const,
  },
  valueGreen: {
    color: '#00FF00',
  },
  valueHighlight: {
    color: '#00BFFF',
    fontWeight: '700' as const,
  },
});
