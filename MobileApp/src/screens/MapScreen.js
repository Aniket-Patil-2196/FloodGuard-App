import React, { useState, useEffect, useRef } from 'react';
import {
  View, StyleSheet, ActivityIndicator, Text,
  TouchableOpacity, ScrollView, Dimensions
} from 'react-native';
import apiClient from '../api/apiClient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Simple coordinate-to-screen projection for Sangli area
const MAP_CENTER = { lat: 16.8524, lng: 74.5815 };
const MAP_ZOOM_LAT = 0.09;
const MAP_ZOOM_LNG = 0.09;

function latLngToXY(lat, lng) {
  const x = ((lng - (MAP_CENTER.lng - MAP_ZOOM_LNG / 2)) / MAP_ZOOM_LNG) * SCREEN_WIDTH;
  const y = (1 - (lat - (MAP_CENTER.lat - MAP_ZOOM_LAT / 2)) / MAP_ZOOM_LAT) * (SCREEN_HEIGHT * 0.75);
  return { x, y };
}

function FeatureOverlay({ mapData }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {mapData.map((feature) => {
        if (!feature || !feature.type) return null;
        const color = feature.color || '#ff0000';

        if (feature.type === 'Point' && feature.coordinates) {
          const { x, y } = latLngToXY(
            feature.coordinates.latitude,
            feature.coordinates.longitude
          );
          return (
            <View
              key={feature._id}
              style={[styles.marker, { left: x - 8, top: y - 8, backgroundColor: color }]}
            />
          );
        }
        return null;
      })}
    </View>
  );
}

export default function MapScreen() {
  const [mapData, setMapData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeature, setSelectedFeature] = useState(null);

  useEffect(() => {
    apiClient.get('/map/data')
      .then(r => { setMapData(r.data); console.log('Map data:', r.data.length, 'features'); })
      .catch(e => console.error('Map fetch error:', e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading flood data...</Text>
      </View>
    );
  }

  const points = mapData.filter(f => f.type === 'Point');
  const zones = mapData.filter(f => f.type === 'Polygon' || f.type === 'LineString');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🗺️ Flood Risk Map</Text>
        <Text style={styles.headerSub}>Sangli Region, Maharashtra</Text>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#dc2626' }]} />
          <Text style={styles.legendText}>High Risk</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#f97316' }]} />
          <Text style={styles.legendText}>Moderate</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
          <Text style={styles.legendText}>Safe Zone</Text>
        </View>
      </View>

      {/* Flood Alerts List */}
      <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>⚠️ Active Flood Alerts</Text>
        {mapData.length === 0 ? (
          <Text style={styles.emptyText}>No active alerts in your area</Text>
        ) : (
          mapData.map(feature => {
            if (!feature || !feature.name) return null;
            const color = feature.color || '#64748b';
            const icon = color === '#dc2626' ? '🔴' : color === '#f97316' ? '🟠' : '🟢';
            return (
              <TouchableOpacity
                key={feature._id}
                style={[styles.featureCard, { borderLeftColor: color }]}
                onPress={() => setSelectedFeature(selectedFeature?._id === feature._id ? null : feature)}
              >
                <View style={styles.featureHeader}>
                  <Text style={styles.featureIcon}>{icon}</Text>
                  <View style={styles.featureInfo}>
                    <Text style={styles.featureName}>{feature.name}</Text>
                    <Text style={styles.featureType}>{feature.type}</Text>
                  </View>
                </View>
                {selectedFeature?._id === feature._id && feature.description && (
                  <Text style={styles.featureDesc}>{feature.description}</Text>
                )}
              </TouchableOpacity>
            );
          })
        )}

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>📍 Location Summary</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Zones Monitored</Text>
            <Text style={styles.summaryValue}>{zones.length}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Active Alert Points</Text>
            <Text style={styles.summaryValue}>{points.length}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>High Risk Zones</Text>
            <Text style={[styles.summaryValue, { color: '#dc2626' }]}>
              {mapData.filter(f => f.color === '#dc2626').length}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Safe Zones</Text>
            <Text style={[styles.summaryValue, { color: '#10b981' }]}>
              {mapData.filter(f => f.color === '#10b981').length}
            </Text>
          </View>
        </View>

        <Text style={styles.osmNote}>
          📡 Map data powered by OpenStreetMap contributors
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  loadingText: { marginTop: 12, color: '#64748b', fontSize: 14 },

  header: {
    backgroundColor: '#1e3a8a',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#ffffff' },
  headerSub: { fontSize: 13, color: '#93c5fd', marginTop: 2 },

  legend: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 16,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { fontSize: 12, color: '#475569', fontWeight: '500' },

  scrollArea: { flex: 1, padding: 16 },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
  },

  featureCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  featureHeader: { flexDirection: 'row', alignItems: 'center' },
  featureIcon: { fontSize: 22, marginRight: 12 },
  featureInfo: { flex: 1 },
  featureName: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  featureType: { fontSize: 12, color: '#94a3b8', marginTop: 2, textTransform: 'uppercase' },
  featureDesc: { fontSize: 13, color: '#475569', marginTop: 10, lineHeight: 18 },

  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  summaryLabel: { fontSize: 14, color: '#64748b' },
  summaryValue: { fontSize: 14, fontWeight: '700', color: '#1e293b' },

  emptyText: { color: '#94a3b8', textAlign: 'center', padding: 20 },

  marker: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ffffff',
    elevation: 4,
  },

  osmNote: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 20,
    marginBottom: 30,
  },
});
