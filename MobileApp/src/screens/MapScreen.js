import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline, Polygon, UrlTile } from 'react-native-maps';
import apiClient from '../api/apiClient';

export default function MapScreen() {
  const [mapData, setMapData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMapData = async () => {
      try {
        const response = await apiClient.get('/map/data');
        setMapData(response.data);
      } catch (error) {
        console.error('Failed to fetch map data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMapData();
  }, []);

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#2563eb" /></View>;
  }

  return (
    <View style={styles.container}>
      <MapView 
        style={styles.map}
        mapType="standard"
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        zoomControlsEnabled={true}
        initialRegion={{
          latitude: 16.8524,
          longitude: 74.5815,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        <UrlTile
          urlTemplate="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19}
          flipY={false}
        />
        {mapData.map((feature) => {
          if (feature.type === 'Point') {
            return (
              <Marker
                key={feature._id}
                coordinate={feature.coordinates}
                title={feature.name}
                description={feature.description}
                pinColor={feature.color || '#ff0000'}
              />
            );
          } else if (feature.type === 'LineString') {
            return (
              <Polyline
                key={feature._id}
                coordinates={feature.coordinates}
                strokeColor={feature.color || "#ff0000"}
                strokeWidth={4}
              />
            );
          } else if (feature.type === 'Polygon') {
            return (
              <Polygon
                key={feature._id}
                coordinates={feature.coordinates}
                fillColor={`${feature.color || '#ff0000'}40`}
                strokeColor={feature.color || "#ff0000"}
                strokeWidth={2}
              />
            );
          }
          return null;
        })}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
