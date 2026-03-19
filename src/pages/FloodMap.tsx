import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

export default function FloodMap() {
  const center = [16.8524, 74.5815]; // Sangli coordinates
  
  const riskZones = [
    { name: 'Sangli City', pos: [16.8524, 74.5815], risk: 'HIGH', color: '#f97316' },
    { name: 'Miraj', pos: [16.8222, 74.6466], risk: 'MODERATE', color: '#eab308' },
    { name: 'Kupwad', pos: [16.8667, 74.6333], risk: 'LOW', color: '#10b981' },
    { name: 'Krishna River Bank', pos: [16.8450, 74.5750], risk: 'CRITICAL', color: '#ef4444' },
  ];

  const shelters = [
    { name: 'Shelter A', pos: [16.8550, 74.5900] },
    { name: 'Shelter B', pos: [16.8400, 74.6000] },
  ];

  return (
    <div className="h-[calc(100vh-80px)] w-full relative">
      <MapContainer center={center} zoom={13} className="h-full w-full">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {riskZones.map((zone, idx) => (
          <React.Fragment key={idx}>
            <Circle 
              center={zone.pos} 
              radius={1000} 
              pathOptions={{ color: zone.color, fillColor: zone.color, fillOpacity: 0.3 }} 
            />
            <Marker position={zone.pos}>
              <Popup>
                <div className="text-slate-900">
                  <h3 className="font-bold">{zone.name}</h3>
                  <p>Risk Level: <span style={{ color: zone.color }}>{zone.risk}</span></p>
                </div>
              </Popup>
            </Marker>
          </React.Fragment>
        ))}

        {shelters.map((s, idx) => (
          <Marker key={`s-${idx}`} position={s.pos}>
            <Popup>
              <div className="text-slate-900 font-bold">Emergency Shelter: {s.name}</div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-10 left-10 z-[1000] bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-sm space-y-2">
        <h4 className="font-bold mb-2">Risk Legend</h4>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /> Safe / Low</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500" /> Moderate</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500" /> High Risk</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500" /> Critical / SOS</div>
      </div>
    </div>
  );
}
