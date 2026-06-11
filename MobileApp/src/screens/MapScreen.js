import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import apiClient from '../api/apiClient';

export default function MapScreen() {
  const [mapData, setMapData] = useState([]);
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef(null);

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

  // Generate Leaflet JavaScript based on mapData
  const generateMapScript = () => {
    let script = '';
    mapData.forEach(feature => {
      if (feature.type === 'Point') {
        script += `
          L.circleMarker([${feature.coordinates.latitude}, ${feature.coordinates.longitude}], {
            radius: 8,
            fillColor: "${feature.color || '#ff0000'}",
            color: "#fff",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
          }).addTo(map)
          .bindPopup("<b>${feature.name}</b><br/>${feature.description || ''}");
        `;
      } else if (feature.type === 'Polygon' || feature.type === 'LineString') {
        const latLngs = feature.coordinates.map(c => `[${c.latitude}, ${c.longitude}]`).join(',');
        const method = feature.type === 'Polygon' ? 'polygon' : 'polyline';
        script += `
          L.${method}([${latLngs}], {
            color: "${feature.color || '#ff0000'}",
            fillColor: "${feature.color || '#ff0000'}",
            weight: ${feature.type === 'Polygon' ? 2 : 4},
            fillOpacity: 0.4
          }).addTo(map)
          .bindPopup("<b>${feature.name}</b>");
        `;
      }
    });
    return script;
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { padding: 0; margin: 0; }
          html, body, #map { height: 100%; width: 100vw; }
          .leaflet-control-attribution { display: none; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const map = L.map('map').setView([16.8524, 74.5815], 13);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
          }).addTo(map);

          ${generateMapScript()}
        </script>
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: htmlContent }}
        style={styles.map}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
