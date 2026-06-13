import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMapData extends Document {
  type: 'Point' | 'LineString' | 'Polygon';
  name: string;
  description?: string;
  coordinates: any;
  color?: string;
  kmlId?: mongoose.Types.ObjectId;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'NONE';
  uploadedAt: Date;
}

const mapDataSchema: Schema<IMapData> = new mongoose.Schema({
  type: { type: String, enum: ['Point', 'LineString', 'Polygon'], required: true },
  name: { type: String, required: true },
  description: { type: String },
  coordinates: { type: Schema.Types.Mixed, required: true },
  color: { type: String, default: '#ff0000' },
  kmlId: { type: Schema.Types.ObjectId, ref: 'KmlDocument' },
  riskLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'NONE'], default: 'NONE' },
  uploadedAt: { type: Date, default: Date.now }
});

const MapData: Model<IMapData> = mongoose.models.MapData || mongoose.model<IMapData>('MapData', mapDataSchema);
export default MapData;
