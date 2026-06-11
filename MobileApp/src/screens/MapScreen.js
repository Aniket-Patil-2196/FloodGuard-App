import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import MapView, { Marker, Polyline, Polygon, UrlTile } from 'react-native-maps';
import apiClient from '../api/apiClient';

export default function MapScreen() {
  const [mapData, setMapData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    const fetchMapData = async () => {
      try {
        const response = await apiClient.get('/map/data');
        setMapData(response.data);
        console.log('Map data loaded:', response.data.length, 'features');
      } catch (err) {
        console.error('Failed to fetch map data:', err.message);
        setErrorMsg(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMapData();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        mapType="none"
        initialRegion={{
          latitude: 16.8524,
          longitude: 74.5815,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
        zoomControlsEnabled={true}
      >
        {/* OpenStreetMap tiles - completely free, no Google billing needed */}
        <UrlTile
          urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19}
          flipY={false}
          tileSize={256}
        />

        {mapData.map((feature) => {
          if (!feature || !feature.type) return null;

          if (feature.type === 'Point' && feature.coordinates) {
            return (
              <Marker
                key={feature._id}
                coordinate={{
                  latitude: feature.coordinates.latitude,
                  longitude: feature.coordinates.longitude,
                }}
                title={feature.name}
                description={feature.description}
                pinColor={feature.color || '#ff0000'}
              />
            );
          }

          if (feature.type === 'LineString' && feature.coordinates?.length > 0) {
            return (
              <Polyline
                key={feature._id}
                coordinates={feature.coordinates}
                strokeColor={feature.color || '#ff0000'}
                strokeWidth={4}
              />
            );
          }

          if (feature.type === 'Polygon' && feature.coordinates?.length > 0) {
            return (
              <Polygon
                key={feature._id}
                coordinates={feature.coordinates}
                fillColor={`${feature.color || '#ff0000'}55`}
                strokeColor={feature.color || '#ff0000'}
                strokeWidth={2}
              />
            );
          }

          return null;
        })}
      </MapView>

      {errorMsg && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>Could not load overlay data</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  loadingText: { marginTop: 12, color: '#64748b', fontSize: 14 },
  errorBanner: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  errorText: { color: '#dc2626', fontSize: 13, textAlign: 'center' },
});
