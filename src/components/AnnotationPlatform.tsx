import { useState, useRef } from "react";
import { ImageUploader } from "./ImageUploader";
import { ImageCanvas } from "./ImageCanvas";
import { AnnotationSidebar } from "./AnnotationSidebar";
import { Toolbar } from "./Toolbar";
import { ModelSelectionDialog } from "./ModelSelectionDialog";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Download, Play, Settings, Trash2, ChevronLeft, ChevronRight, Layers } from "lucide-react";

export interface Annotation {
  id: string;
  label: string;
  confidence: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  source: "ai" | "manual";
  verified: boolean;
}

export interface ImageData {
  id: string;
  file: File;
  url: string;
  annotations: Annotation[];
}

export interface AnnotationPlatformState {
  images: ImageData[];
  currentImageIndex: number;
  selectedAnnotationId: string | null;
  isProcessing: boolean;
  tool: "select" | "bbox" | "edit";
}

export const AnnotationPlatform = () => {
  const [state, setState] = useState<AnnotationPlatformState>({
    images: [],
    currentImageIndex: -1,
    selectedAnnotationId: null,
    isProcessing: false,
    tool: "select"
  });

  const updateState = (updates: Partial<AnnotationPlatformState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const getCurrentImage = (): ImageData | null => {
    return state.currentImageIndex >= 0 ? state.images[state.currentImageIndex] : null;
  };

  const handleImageUpload = (files: File[]) => {
    const newImages: ImageData[] = files.map(file => ({
      id: `img-${Date.now()}-${Math.random()}`,
      file,
      url: URL.createObjectURL(file),
      annotations: []
    }));

    updateState({ 
      images: [...state.images, ...newImages],
      currentImageIndex: state.images.length === 0 ? 0 : state.currentImageIndex,
      selectedAnnotationId: null 
    });
    
    toast.success(`${files.length} image(s) uploaded successfully`);
  };

  const runAIDetectionOnAll = async (model: string) => {
    if (state.images.length === 0) return;

    updateState({ isProcessing: true });
    toast.info(`Running ${model} detection on ${state.images.length} images...`);

    let totalDetections = 0;
    const updatedImages = [...state.images];

    for (let i = 0; i < state.images.length; i++) {
      const image = state.images[i];
      const formData = new FormData();
      formData.append("image", image.file);
      formData.append("model", model);

      try {
        const response = await fetch("http://localhost:5000/api/detect", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          updatedImages[i] = {
            ...updatedImages[i],
            annotations: result.annotations
          };
          totalDetections += result.annotations.length;
        }
      } catch (error) {
        console.error(`Detection failed for image ${i + 1}:`, error);
      }
    }

    updateState({ 
      images: updatedImages,
      isProcessing: false 
    });
    
    toast.success(`Detection complete! Found ${totalDetections} objects across ${state.images.length} images`);
  };

  const runSpecializedDetection = async (model: string) => {
    const currentImage = getCurrentImage();
    if (!currentImage) return;

    // Only run on objects that were detected as animals in the current image
    const animalAnnotations = currentImage.annotations.filter(ann => 
      ann.source === "ai" && (
        ann.label.toLowerCase().includes("zebra") || 
        ann.label.toLowerCase().includes("animal") ||
        ann.label.toLowerCase().includes("horse") ||
        ann.label.toLowerCase().includes("donkey")
      )
    );

    if (animalAnnotations.length === 0) {
      toast.error("No animals detected to analyze. Run general detection first.");
      return;
    }

    updateState({ isProcessing: true });
    toast.info(`Running specialized ${model} detection...`);

    const formData = new FormData();
    formData.append("image", currentImage.file);
    formData.append("model", model);

    try {
      const response = await fetch("http://localhost:5000/api/detect", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update the current image's annotations
        const updatedImages = [...state.images];
        updatedImages[state.currentImageIndex] = {
          ...currentImage,
          annotations: [...currentImage.annotations, ...result.annotations]
        };

        updateState({ 
          images: updatedImages,
          isProcessing: false 
        });
        
        toast.success(`${result.model_used} detected ${result.annotations.length} specialized objects`);
      } else {
        updateState({ isProcessing: false });
        toast.error("Specialized detection failed");
      }
    } catch (error) {
      updateState({ isProcessing: false });
      toast.error("Could not connect to detection server");
    }
  };

  const handleRemoveImage = () => {
    if (state.images.length === 0) return;

    const currentImage = getCurrentImage();
    if (currentImage) {
      URL.revokeObjectURL(currentImage.url);
    }

    const newImages = state.images.filter((_, index) => index !== state.currentImageIndex);
    const newIndex = newImages.length === 0 ? -1 : Math.min(state.currentImageIndex, newImages.length - 1);

    updateState({
      images: newImages,
      currentImageIndex: newIndex,
      selectedAnnotationId: null,
      tool: "select"
    });
    
    toast.success("Image removed");
  };

  const exportAnnotations = () => {
    if (state.images.length === 0) {
      toast.error("No images to export");
      return;
    }

    const exportData = {
      images: state.images.map(img => ({
        filename: img.file.name,
        annotations: img.annotations.map(ann => ({
          id: ann.id,
          label: ann.label,
          confidence: ann.confidence,
          bbox: ann.bbox,
          source: ann.source,
          verified: ann.verified
        })),
        total_annotations: img.annotations.length,
        verified_annotations: img.annotations.filter(a => a.verified).length
      })),
      timestamp: new Date().toISOString(),
      total_images: state.images.length,
      total_annotations: state.images.reduce((sum, img) => sum + img.annotations.length, 0)
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json"
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `annotations_batch_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Batch annotations exported successfully");
  };

  const updateCurrentImageAnnotations = (annotations: Annotation[]) => {
    if (state.currentImageIndex < 0) return;
    
    const updatedImages = [...state.images];
    updatedImages[state.currentImageIndex] = {
      ...updatedImages[state.currentImageIndex],
      annotations
    };
    
    updateState({ images: updatedImages });
  };

  const navigateImage = (direction: "prev" | "next") => {
    if (state.images.length === 0) return;
    
    let newIndex = state.currentImageIndex;
    if (direction === "prev") {
      newIndex = newIndex > 0 ? newIndex - 1 : state.images.length - 1;
    } else {
      newIndex = newIndex < state.images.length - 1 ? newIndex + 1 : 0;
    }
    
    updateState({ 
      currentImageIndex: newIndex,
      selectedAnnotationId: null 
    });
  };

  const currentImage = getCurrentImage();

  return (
    <div className="min-h-screen bg-workspace-bg">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src="/favicon.png"
              alt="DSAIL Logo"
              className="h-8 w-8 mr-2"
            />
            <h1 className="text-xl font-semibold text-foreground">
              DSAIL Annotate
            </h1>
            {state.images.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Layers className="w-4 h-4" />
                <span>{state.images.length} images</span>
                {currentImage && (
                  <>
                    <span>•</span>
                    <span>{currentImage.file.name}</span>
                  </>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {state.images.length > 0 && (
              <>
                <ModelSelectionDialog onModelSelect={runAIDetectionOnAll}>
                  <Button
                    disabled={state.isProcessing}
                    className="bg-primary hover:bg-primary-hover"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {state.isProcessing ? "Processing..." : "Run on All Images"}
                  </Button>
                </ModelSelectionDialog>

                {currentImage && currentImage.annotations.some(ann => 
                  ann.source === "ai" && ann.label.toLowerCase().includes("zebra")
                ) && (
                  <ModelSelectionDialog onModelSelect={runSpecializedDetection}>
                    <Button
                      disabled={state.isProcessing}
                      variant="outline"
                    >
                      <Layers className="w-4 h-4 mr-2" />
                      Classify Zebras
                    </Button>
                  </ModelSelectionDialog>
                )}
                
                <Button
                  onClick={exportAnnotations}
                  variant="outline"
                  disabled={state.images.reduce((sum, img) => sum + img.annotations.length, 0) === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export All
                </Button>

                <Button
                  onClick={handleRemoveImage}
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  disabled={!currentImage}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove Current
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Sidebar */}
        <div className="w-80 bg-card border-r border-border">
          <AnnotationSidebar 
            annotations={currentImage?.annotations || []}
            selectedId={state.selectedAnnotationId}
            onSelect={(id) => updateState({ selectedAnnotationId: id })}
            onUpdate={updateCurrentImageAnnotations}
          />
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col">
          {/* Toolbar */}
          {currentImage && (
            <>
              <Toolbar 
                tool={state.tool}
                onToolChange={(tool) => updateState({ tool })}
                disabled={!currentImage}
              />

              {/* Image Navigation */}
              {state.images.length > 1 && (
                <div className="bg-card border-b border-border px-6 py-2 flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateImage("prev")}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  
                  <span className="text-sm text-muted-foreground">
                    {state.currentImageIndex + 1} of {state.images.length}
                  </span>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateImage("next")}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Canvas */}
          <div className="flex-1 p-6">
            {currentImage ? (
              <ImageCanvas
                image={currentImage.url}
                annotations={currentImage.annotations}
                selectedAnnotationId={state.selectedAnnotationId}
                tool={state.tool}
                onAnnotationSelect={(id) => updateState({ selectedAnnotationId: id })}
                onAnnotationUpdate={updateCurrentImageAnnotations}
                onZoomIn={() => {}}
                onZoomOut={() => {}}
                onResetView={() => {}}
              />
            ) : (
              <ImageUploader onImageUpload={handleImageUpload} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};