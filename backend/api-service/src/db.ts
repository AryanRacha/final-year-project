import mongoose, { Schema, Document } from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-service';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');
}

export interface IRepository extends Document {
  repoId: string;
  name: string;
  installationId: number;
  status: 'initializing' | 'indexed';
}

const repositorySchema = new Schema<IRepository>({
  repoId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  installationId: { type: Number, required: true },
  status: { type: String, enum: ['initializing', 'indexed'], default: 'initializing' }
}, { timestamps: true });

export const Repository = mongoose.models.Repository || mongoose.model<IRepository>('Repository', repositorySchema);

export interface ISuggestion extends Document {
  prId: string;
  repoId: string;
  filePath: string;
  line: number;
  diff: string;
  status: 'pending' | 'accepted' | 'denied';
  dismissalReason?: string;
}

const suggestionSchema = new Schema<ISuggestion>({
  prId: { type: String, required: true },
  repoId: { type: String, required: true },
  filePath: { type: String, required: true },
  line: { type: Number, required: true },
  diff: { type: String, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'denied'], default: 'pending' },
  dismissalReason: { type: String }
}, { timestamps: true });

export const Suggestion = mongoose.models.Suggestion || mongoose.model<ISuggestion>('Suggestion', suggestionSchema);
