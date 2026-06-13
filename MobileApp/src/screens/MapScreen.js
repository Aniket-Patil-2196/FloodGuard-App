import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';

export default function MapScreen() {
  const { user } = useAuth();
  const [mapData, setMapData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userCoords, setUserCoords] = useState(null);
  const webViewRef = useRef(null);

  useEffect(() => {
    const fetchMapData = async () => {
      try {
        const response = await apiClient.get('/map/data');
        setMapData(response.data);
      } catch (err) {
        console.error('Failed to fetch map data', err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    const resolveUserCoords = async () => {
      if (user?.latitude && user?.longitude) {
        setUserCoords({ latitude: user.latitude, longitude: user.longitude });
      } else if (user?.city || user?.village) {
        try {
          const place = `${user.city || user.village}, ${user.district || ''}, ${user.state || 'Maharashtra'}`;
          const geocoded = await Location.geocodeAsync(place);
          if (geocoded && geocoded.length > 0) {
            setUserCoords({ latitude: geocoded[0].latitude, longitude: geocoded[0].longitude });
          }
        } catch (e) {
          console.error('Geocoding fallback failed', e);
        }
      }
    };

    fetchMapData();
    resolveUserCoords();
  }, [user]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading map data...</Text>
      </View>
    );
  }

  const generateMapFeatures = () => {
    let script = '';
    
    // Add user location blue marker
    if (userCoords) {
      script += `
        L.circleMarker([${userCoords.latitude}, ${userCoords.longitude}], {
          radius: 12,
          fillColor: '#3b82f6',
          color: '#ffffff',
          weight: 3,
          opacity: 1,
          fillOpacity: 1
        }).addTo(map).bindPopup('<b>Your Location</b><br/>${user?.city || user?.village || ''}');
      `;
    }

    mapData.forEach(feature => {
      if (!feature || !feature.type) return;
      try {
        if (feature.type === 'Point' && feature.coordinates) {
          const lat = feature.coordinates.latitude;
          const lng = feature.coordinates.longitude;
          const name = (feature.name || '').replace(/'/g, "\\'");
          const desc = (feature.description || '').replace(/'/g, "\\'");
          const color = feature.color || '#ff0000';
          script += `
            L.circleMarker([${lat}, ${lng}], {
              radius: 10,
              fillColor: '${color}',
              color: '#fff',
              weight: 2,
              opacity: 1,
              fillOpacity: 0.9
            }).addTo(map).bindPopup('<b>${name}</b><br/>${desc}');
          `;
        } else if (feature.type === 'Polygon' && feature.coordinates && feature.coordinates.length > 0) {
          const latLngs = feature.coordinates.map(c => `[${c.latitude}, ${c.longitude}]`).join(',');
          const name = (feature.name || '').replace(/'/g, "\\'");
          const color = feature.color || '#ff0000';
          script += `
            L.polygon([${latLngs}], {
              color: '${color}',
              fillColor: '${color}',
              weight: 2,
              fillOpacity: 0.4
            }).addTo(map).bindPopup('<b>${name}</b>');
          `;
        } else if (feature.type === 'LineString' && feature.coordinates && feature.coordinates.length > 0) {
          const latLngs = feature.coordinates.map(c => `[${c.latitude}, ${c.longitude}]`).join(',');
          const name = (feature.name || '').replace(/'/g, "\\'");
          const color = feature.color || '#ff0000';
          script += `
            L.polyline([${latLngs}], {
              color: '${color}',
              weight: 4
            }).addTo(map).bindPopup('<b>${name}</b>');
          `;
        }
      } catch(e) {}
    });
    return script;
  };

  const centerLat = userCoords ? userCoords.latitude : 16.8524;
  const centerLng = userCoords ? userCoords.longitude : 74.5815;

  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { height: 100%; width: 100%; }
    .leaflet-control-attribution { display: none !important; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: true }).setView([${centerLat}, ${centerLng}], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(map);
    ${generateMapFeatures()}
  </script>
</body>
</html>`;

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: htmlContent }}
        style={styles.map}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        originWhitelist={['*']}
        mixedContentMode="always"
        onError={(e) => console.error('WebView error:', e.nativeEvent)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  loadingText: { marginTop: 12, color: '#64748b', fontSize: 14 },
});
