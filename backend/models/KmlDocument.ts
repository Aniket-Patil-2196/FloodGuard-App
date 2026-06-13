import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IKmlDocument extends Document {
  fileName: string;
  polygonCount: number;
  lineCount: number;
  pointCount: number;
  areaCovered: number; // in square km
  isActive: boolean;
  uploadedAt: Date;
}

const kmlDocumentSchema: Schema<IKmlDocument> = new Schema({
  fileName: { type: String, required: true },
  polygonCount: { type: Number, default: 0 },
  lineCount: { type: Number, default: 0 },
  pointCount: { type: Number, default: 0 },
  areaCovered: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  uploadedAt: { type: Date, default: Date.now }
});

const KmlDocument: Model<IKmlDocument> = mongoose.models.KmlDocument || mongoose.model<IKmlDocument>('KmlDocument', kmlDocumentSchema);
export default KmlDocument;
