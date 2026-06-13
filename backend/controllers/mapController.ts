import { Request, Response } from 'express';
import { XMLParser } from 'fast-xml-parser';
import MapData from '../models/MapData';
import Alert from '../models/Alert';
import KmlDocument from '../models/KmlDocument';

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

const calculatePolygonArea = (coords: { latitude: number, longitude: number }[]): number => {
  if (coords.length < 3) return 0;
  let totalArea = 0;
  const R = 6378.137; // Earth's radius in km
  const d2r = Math.PI / 180;
  
  for (let i = 0; i < coords.length; i++) {
    const p1 = coords[i];
    const p2 = coords[(i + 1) % coords.length];
    const x1 = p1.longitude * d2r * Math.cos((p1.latitude + p2.latitude) / 2 * d2r) * R;
    const y1 = p1.latitude * d2r * R;
    const x2 = p2.longitude * d2r * Math.cos((p1.latitude + p2.latitude) / 2 * d2r) * R;
    const y2 = p2.latitude * d2r * R;
    totalArea += (x1 * y2 - x2 * y1);
  }
  return Math.abs(totalArea / 2);
};

const parseRiskLevel = (name: string, desc: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'NONE' => {
  const text = `${name} ${desc}`.toLowerCase();
  if (text.includes('critical') || text.includes('severe') || text.includes('danger') || text.includes('red')) return 'CRITICAL';
  if (text.includes('high') || text.includes('warning') || text.includes('orange')) return 'HIGH';
  if (text.includes('medium') || text.includes('moderate') || text.includes('yellow')) return 'MEDIUM';
  if (text.includes('low') || text.includes('safe') || text.includes('green')) return 'LOW';
  return 'NONE';
};

const getRiskColor = (level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'NONE'): string => {
  switch (level) {
    case 'CRITICAL': return '#dc2626'; // Red
    case 'HIGH': return '#ea580c'; // Orange
    case 'MEDIUM': return '#eab308'; // Yellow
    case 'LOW': return '#16a34a'; // Green
    default: return '#2563eb'; // Default Blue
  }
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

    let polygonCount = 0;
    let lineCount = 0;
    let pointCount = 0;
    let areaCovered = 0;

    const parsedFeatures: any[] = [];

    for (const pm of placemarks) {
      let type: 'Point' | 'LineString' | 'Polygon' | null = null;
      let coords = null;

      if (pm.Point && pm.Point.coordinates) {
        type = 'Point';
        const [lng, lat] = pm.Point.coordinates.trim().split(',').map(Number);
        if (!isNaN(lng) && !isNaN(lat)) {
          coords = { latitude: lat, longitude: lng };
          pointCount++;
        }
      } else if (pm.LineString && pm.LineString.coordinates) {
        type = 'LineString';
        coords = pm.LineString.coordinates.trim().split(/\s+/).map((c: string) => {
          const [lng, lat] = c.split(',').map(Number);
          return { latitude: lat, longitude: lng };
        }).filter((c: any) => !isNaN(c.latitude));
        if (coords.length > 0) {
          lineCount++;
        }
      } else if (pm.Polygon && pm.Polygon.outerBoundaryIs && pm.Polygon.outerBoundaryIs.LinearRing && pm.Polygon.outerBoundaryIs.LinearRing.coordinates) {
        type = 'Polygon';
        coords = pm.Polygon.outerBoundaryIs.LinearRing.coordinates.trim().split(/\s+/).map((c: string) => {
          const [lng, lat] = c.split(',').map(Number);
          return { latitude: lat, longitude: lng };
        }).filter((c: any) => !isNaN(c.latitude));
        if (coords.length > 0) {
          polygonCount++;
          areaCovered += calculatePolygonArea(coords);
        }
      }

      if (type && coords) {
        const name = pm.name || 'Unnamed Feature';
        const description = pm.description || '';
        const risk = parseRiskLevel(name, description);
        const color = getRiskColor(risk);

        parsedFeatures.push({
          type,
          name,
          description,
          coordinates: coords,
          riskLevel: risk,
          color
        });
      }
    }

    if (parsedFeatures.length === 0) {
      return res.status(400).json({ message: 'No valid mapping features found in KML file.' });
    }

    // Create the KmlDocument metadata entry
    const kmlDoc = await KmlDocument.create({
      fileName: req.file.originalname,
      polygonCount,
      lineCount,
      pointCount,
      areaCovered: Math.round(areaCovered * 100) / 100, // round to 2 decimal places
      isActive: true
    });

    const savedData = [];
    for (const feat of parsedFeatures) {
      const newMapData = await MapData.create({
        ...feat,
        kmlId: kmlDoc._id
      });
      savedData.push(newMapData);
    }

    res.json({ 
      message: 'KML processed successfully', 
      kmlId: kmlDoc._id,
      fileName: kmlDoc.fileName,
      featuresProcessed: savedData.length,
      polygons: polygonCount,
      lines: lineCount,
      points: pointCount,
      areaCovered: kmlDoc.areaCovered
    });
  } catch (error) {
    console.error('KML Upload Error:', error);
    res.status(500).json({ message: 'Failed to process KML' });
  }
};

export const getMapData = async (req: Request, res: Response) => {
  try {
    const activeKmls = await KmlDocument.find({ isActive: true });
    const activeKmlIds = activeKmls.map(k => k._id);
    const data = await MapData.find({
      $or: [
        { kmlId: { $in: activeKmlIds } },
        { kmlId: { $exists: false } }
      ]
    });
    
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

export const getKmlDocuments = async (req: Request, res: Response) => {
  try {
    const docs = await KmlDocument.find({}).sort({ uploadedAt: -1 });
    res.json(docs);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch KML documents' });
  }
};

export const updateKmlDocument = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { isActive, fileName } = req.body;
  try {
    const doc = await KmlDocument.findById(id);
    if (!doc) return res.status(404).json({ message: 'KML Document not found' });
    
    if (isActive !== undefined) doc.isActive = isActive;
    if (fileName !== undefined) doc.fileName = fileName;
    
    await doc.save();
    res.json(doc);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update KML document' });
  }
};

export const deleteKmlDocument = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const doc = await KmlDocument.findById(id);
    if (!doc) return res.status(404).json({ message: 'KML Document not found' });
    
    await MapData.deleteMany({ kmlId: doc._id });
    await doc.deleteOne();
    
    res.json({ message: 'KML Document and features deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete KML document' });
  }
};
