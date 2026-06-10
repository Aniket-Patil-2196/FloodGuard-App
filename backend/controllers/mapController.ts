import { Request, Response } from 'express';
import { XMLParser } from 'fast-xml-parser';
import MapData from '../models/MapData';

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
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch map data' });
  }
};
