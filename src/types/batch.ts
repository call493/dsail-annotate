import { Annotation } from "../components/AnnotationPlatform";

export interface ImageData {
  id: string;
  file: File;
  url: string;
  annotations: Annotation[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  name: string;
  size: number;
  lastModified: number;
  selected: boolean;
}

export interface BatchProgress {
  total: number;
  completed: number;
  failed: number;
  processing: number;
  percentage: number;
}

export interface BatchAnnotationState {
  images: ImageData[];
  currentImageId: string | null;
  batchProgress: BatchProgress;
  isProcessing: boolean;
  selectedModel: string | null;
}