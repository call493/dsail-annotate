import { useState, useCallback } from "react";
import { ImageData, BatchProgress } from "../types/batch";
import { toast } from "sonner";

export const useBatchProcessing = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingQueue, setProcessingQueue] = useState<string[]>([]);

  const calculateProgress = (images: ImageData[]): BatchProgress => {
    const total = images.length;
    const completed = images.filter(img => img.status === 'completed').length;
    const failed = images.filter(img => img.status === 'failed').length;
    const processing = images.filter(img => img.status === 'processing').length;
    const percentage = total > 0 ? ((completed + failed) / total) * 100 : 0;

    return { total, completed, failed, processing, percentage };
  };

  const processImage = async (
    imageData: ImageData, 
    model: string,
    updateImage: (id: string, updates: Partial<ImageData>) => void
  ): Promise<void> => {
    try {
      updateImage(imageData.id, { status: 'processing', progress: 0 });

      const formData = new FormData();
      formData.append("image", imageData.file);
      formData.append("model", model);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        updateImage(imageData.id, { 
          progress: Math.min(imageData.progress + Math.random() * 20, 90) 
        });
      }, 500);

      const response = await fetch("/api/detect", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        if (response.status === 0 || !response.status) {
          throw new Error("Backend server is not running. Please start the Flask server on port 5000.");
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Detection failed: ${response.statusText}`);
      }

      const result = await response.json();
      updateImage(imageData.id, {
        status: 'completed',
        progress: 100,
        annotations: result.annotations || []
      });
    } catch (error) {
      updateImage(imageData.id, {
        status: 'failed',
        progress: 0
      });
      console.error(`Failed to process ${imageData.name}:`, error);
    }
  };

  const processBatch = useCallback(async (
    images: ImageData[],
    model: string,
    updateImage: (id: string, updates: Partial<ImageData>) => void,
    concurrency: number = 3
  ) => {
    if (isProcessing) {
      toast.error("Batch processing already in progress");
      return;
    }

    setIsProcessing(true);
    toast.info(`Starting batch processing of ${images.length} images...`);

    const pendingImages = images.filter(img => img.status === 'pending');
    setProcessingQueue(pendingImages.map(img => img.id));

    try {
      // Process images in batches with limited concurrency
      for (let i = 0; i < pendingImages.length; i += concurrency) {
        const batch = pendingImages.slice(i, i + concurrency);
        
        await Promise.all(
          batch.map(imageData => 
            processImage(imageData, model, updateImage)
          )
        );
      }

      const finalProgress = calculateProgress(images);
      toast.success(
        `Batch processing complete! ${finalProgress.completed} successful, ${finalProgress.failed} failed`
      );
    } catch (error) {
      toast.error("Batch processing encountered an error");
      console.error("Batch processing error:", error);
    } finally {
      setIsProcessing(false);
      setProcessingQueue([]);
    }
  }, [isProcessing]);

  const retryFailed = useCallback(async (
    images: ImageData[],
    model: string,
    updateImage: (id: string, updates: Partial<ImageData>) => void
  ) => {
    const failedImages = images.filter(img => img.status === 'failed');
    
    if (failedImages.length === 0) {
      toast.info("No failed images to retry");
      return;
    }

    // Reset failed images to pending
    failedImages.forEach(img => {
      updateImage(img.id, { status: 'pending', progress: 0 });
    });

    toast.info(`Retrying ${failedImages.length} failed images...`);
    await processBatch(images, model, updateImage);
  }, [processBatch]);

  return {
    isProcessing,
    processingQueue,
    calculateProgress,
    processBatch,
    retryFailed
  };
};