import { useState, useCallback } from "react";
import { ImageData, BatchProgress } from "../types/batch";
import { toast } from "sonner";

export const useBatchProcessing = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingQueue, setProcessingQueue] = useState<string[]>([]);
  const [shouldCancel, setShouldCancel] = useState(false);

  const calculateProgress = (images: ImageData[]): BatchProgress => {
    const total = images.length;
    const completed = images.filter(img => img.status === 'completed').length;
    const failed = images.filter(img => img.status === 'failed').length;
    const processing = images.filter(img => img.status === 'processing').length;
    const percentage = total > 0 ? ((completed + failed) / total) * 100 : 0;

    return { total, completed, failed, processing, percentage };
  };

  const processBatchParallel = async (
    images: ImageData[],
    model: string,
    updateImage: (id: string, updates: Partial<ImageData>) => void
  ): Promise<void> => {
    if (shouldCancel) return;
    
    try {
      // Mark all images as processing
      images.forEach(img => {
        updateImage(img.id, { status: 'processing', progress: 10 });
      });

      const formData = new FormData();
      formData.append("model", model);
      
      // Add all images to form data
      images.forEach((imageData, index) => {
        formData.append(`image_${index}`, imageData.file);
      });

      // Simulate progress updates for all images
      const progressInterval = setInterval(() => {
        images.forEach(img => {
          updateImage(img.id, { 
            progress: Math.min(img.progress + Math.random() * 15, 85) 
          });
        });
      }, 800);

      const response = await fetch("/api/detect-batch", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        if (response.status === 0 || !response.status) {
          throw new Error("Backend server is not running. Please start the Flask server on port 5000.");
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Batch detection failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Update each image with its results
      result.results.forEach((imageResult: any) => {
        const imageData = images.find(img => img.name === imageResult.image_name);
        if (imageData) {
          if (imageResult.error) {
            updateImage(imageData.id, {
              status: 'failed',
              progress: 0
            });
          } else {
            updateImage(imageData.id, {
              status: 'completed',
              progress: 100,
              annotations: imageResult.annotations || []
            });
          }
        }
      });
      
    } catch (error) {
      // Mark all images as failed
      images.forEach(img => {
        updateImage(img.id, {
          status: 'failed',
          progress: 0
        });
      });
      console.error("Failed to process batch:", error);
      throw error;
    }
  };

  const processBatch = useCallback(async (
    images: ImageData[],
    model: string,
    updateImage: (id: string, updates: Partial<ImageData>) => void
  ) => {
    if (isProcessing) {
      toast.error("Batch processing already in progress");
      return;
    }

    setIsProcessing(true);
    toast.info(`Starting parallel batch processing of ${images.length} images...`);

    const pendingImages = images.filter(img => img.status === 'pending');
    setProcessingQueue(pendingImages.map(img => img.id));

    try {
      await processBatchParallel(pendingImages, model, updateImage);

      if (!shouldCancel) {
        const finalProgress = calculateProgress(images);
        toast.success(
          `Batch processing complete! ${finalProgress.completed} successful, ${finalProgress.failed} failed`
        );
      }
    } catch (error) {
      toast.error("Batch processing encountered an error");
      console.error("Batch processing error:", error);
    } finally {
      setIsProcessing(false);
      setProcessingQueue([]);
      setShouldCancel(false);
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

  const cancelProcessing = useCallback(() => {
    setShouldCancel(true);
    setIsProcessing(false);
    toast.info("Cancelling batch processing...");
  }, []);

  return {
    isProcessing,
    processingQueue,
    calculateProgress,
    processBatch,
    retryFailed,
    cancelProcessing
  };
};