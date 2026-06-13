import { Request, Response } from 'express';
import { XMLParser } from 'fast-xml-parser';
import MapData from '../models/MapData';
import Alert from '../models/Alert';

const extractPlacemarks = (obj: any): any[] => {
  let results: any[] = [];
  if (!obj) return results;

  if (Array.isArray(obj)) {
    for (const item of obj) {
      results = results.concat(extractPlacemarks(item));
    }
  } else if (typeof obj === 'object') {
    if (obj.Placemark) {
      if (Array.isArray(obj.Placemark)) {
        results = results.concat(obj.Placemark);
      } else {
        results.push(obj.Placemark);
      }
    }
    for (const key in obj) {
      if (key !== 'Placemark') {
        results = results.concat(extractPlacemarks(obj[key]));
      }
    }
  }
  return results;
};

export const uploadKml = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No KML file uploaded' });
    }

    const xmlData = req.file.buffer.toString('utf-8');
    const parser = new XMLParser({ ignoreAttributes: false, parseAttributeValue: true });
    const jsonObj = parser.parse(xmlData);

    const placemarks = extractPlacemarks(jsonObj);

    // Optional: Only clear if you want 1 map at a time. Otherwise don't deleteMany.
    await MapData.deleteMany({}); 

    const savedData = [];
    for (const pm of placemarks) {
      let type: 'Point' | 'LineString' | 'Polygon' | null = null;
      let coords = null;

      if (pm.Point && pm.Point.coordinates) {
        type = 'Point';
        const [lng, lat] = pm.Point.coordinates.trim().split(',').map(Number);
        if (!isNaN(lng) && !isNaN(lat)) {
          coords = { latitude: lat, longitude: lng };
        }
      } else if (pm.LineString && pm.LineString.coordinates) {
        type = 'LineString';
        coords = pm.LineString.coordinates.trim().split(/\s+/).map((c: string) => {
          const [lng, lat] = c.split(',').map(Number);
          return { latitude: lat, longitude: lng };
        }).filter((c: any) => !isNaN(c.latitude));
      } else if (pm.Polygon && pm.Polygon.outerBoundaryIs && pm.Polygon.outerBoundaryIs.LinearRing && pm.Polygon.outerBoundaryIs.LinearRing.coordinates) {
        type = 'Polygon';
        coords = pm.Polygon.outerBoundaryIs.LinearRing.coordinates.trim().split(/\s+/).map((c: string) => {
          const [lng, lat] = c.split(',').map(Number);
          return { latitude: lat, longitude: lng };
        }).filter((c: any) => !isNaN(c.latitude));
      }

      if (type && coords) {
        const newMapData = await MapData.create({
          type,
          name: pm.name || 'Unnamed Feature',
          description: pm.description || '',
          coordinates: coords,
        });
        savedData.push(newMapData);
      }
    }

    res.json({ message: 'KML processed successfully', featuresProcessed: savedData.length });
  } catch (error) {
    console.error('KML Upload Error:', error);
    res.status(500).json({ message: 'Failed to process KML' });
  }
};

export const getMapData = async (req: Request, res: Response) => {
  try {
    const data = await MapData.find({});
    
    // Fetch Active Alerts with location
    const activeAlerts = await Alert.find({ 
      status: 'ACTIVE', 
      location: { $exists: true } 
    });

    const alertFeatures = activeAlerts.map(alert => {
      let color = '#2563eb';
      if (alert.severity === 'CRITICAL') color = '#dc2626';
      if (alert.severity === 'HIGH') color = '#ea580c';
      if (alert.severity === 'MEDIUM') color = '#ca8a04';

      return {
        _id: alert._id.toString(),
        type: 'Point',
        name: `ALERT: ${alert.title}`,
        description: alert.message,
        color: color,
        coordinates: {
          latitude: alert.location?.coordinates[1] || 0,
          longitude: alert.location?.coordinates[0] || 0
        }
      };
    });
    
    // Inject mock presentation data for visual richness
    const mockData = [
      {
        _id: 'mock_poly_1',
        type: 'Polygon',
        name: 'High Risk Zone - Sangli',
        color: '#f97316', // Orange
        coordinates: [
          { latitude: 16.855, longitude: 74.580 },
          { latitude: 16.865, longitude: 74.580 },
          { latitude: 16.865, longitude: 74.595 },
          { latitude: 16.855, longitude: 74.595 }
        ]
      },
      {
        _id: 'mock_poly_2',
        type: 'Polygon',
        name: 'Severe Risk Zone - Krishna Riverbed',
        color: '#dc2626', // Red
        coordinates: [
          { latitude: 16.840, longitude: 74.570 },
          { latitude: 16.850, longitude: 74.575 },
          { latitude: 16.850, longitude: 74.585 },
          { latitude: 16.840, longitude: 74.585 }
        ]
      },
      {
        _id: 'mock_poly_3',
        type: 'Polygon',
        name: 'Safe Zone - Highland Shelter',
        color: '#10b981', // Green
        coordinates: [
          { latitude: 16.870, longitude: 74.600 },
          { latitude: 16.880, longitude: 74.600 },
          { latitude: 16.880, longitude: 74.615 },
          { latitude: 16.870, longitude: 74.615 }
        ]
      },
      {
        _id: 'mock_pt_1',
        type: 'Point',
        name: 'Alert: Bridge Submerged',
        description: 'Irwin Bridge is currently underwater. Avoid travel.',
        color: '#dc2626',
        coordinates: { latitude: 16.852, longitude: 74.582 }
      },
      {
        _id: 'mock_pt_2',
        type: 'Point',
        name: 'Shelter: Municipal School',
        description: 'Capacity: 500 people. Currently open.',
        color: '#10b981',
        coordinates: { latitude: 16.875, longitude: 74.605 }
      }
    ];

    res.json([...data, ...alertFeatures, ...mockData]);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch map data' });
  }
};
