import { useState, useCallback } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { BatchImageUploader } from "./BatchImageUploader";
import { ImageGrid } from "./ImageGrid";
import { ImageCanvas } from "./ImageCanvas";
import { AnnotationSidebar } from "./AnnotationSidebar";
import { Toolbar } from "./Toolbar";
import { BatchProgress } from "./BatchProgress";
import { ModelSelectionDialog } from "./ModelSelectionDialog";
import { ImageData, BatchAnnotationState } from "../types/batch";
import { useBatchProcessing } from "../hooks/useBatchProcessing";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Download, Play, Trash2, RotateCcw, Grid, Image as ImageIcon } from "lucide-react";

export const BatchAnnotationPlatform = () => {
  const [showProgress, setShowProgress] = useState(false);
  const [state, setState] = useState<BatchAnnotationState>({
    images: [],
    currentImageId: null,
    batchProgress: { total: 0, completed: 0, failed: 0, processing: 0, percentage: 0 },
    isProcessing: false,
    selectedModel: null
  });

  const [tool, setTool] = useState<"select" | "bbox" | "edit">("select");
  const [showGrid, setShowGrid] = useState(true);

  const { isProcessing, calculateProgress, processBatch, retryFailed, cancelProcessing } = useBatchProcessing();

  const updateState = (updates: Partial<BatchAnnotationState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const updateImage = useCallback((id: string, updates: Partial<ImageData>) => {
    setState(prev => {
      const newImages = prev.images.map(img => 
        img.id === id ? { ...img, ...updates } : img
      );
      const newProgress = calculateProgress(newImages);
      
      return {
        ...prev,
        images: newImages,
        batchProgress: newProgress,
        isProcessing: isProcessing
      };
    });
  }, [calculateProgress, isProcessing]);

  const handleImagesUpload = (files: File[]) => {
    const newImages: ImageData[] = files.map(file => ({
      id: crypto.randomUUID(),
      file,
      url: URL.createObjectURL(file),
      annotations: [],
      status: 'pending' as const,
      progress: 0,
      name: file.name,
      size: file.size,
      lastModified: file.lastModified,
      selected: true // Default to selected
    }));

    const allImages = [...state.images, ...newImages];
    const progress = calculateProgress(allImages);

    updateState({
      images: allImages,
      batchProgress: progress,
      currentImageId: allImages[0]?.id || null
    });

    toast.success(`${files.length} images uploaded successfully`);
  };

  const handleImageSelect = (imageId: string) => {
    updateState({ currentImageId: imageId });
  };

  const handleImageToggleSelection = (imageId: string) => {
    setState(prev => ({
      ...prev,
      images: prev.images.map(img => 
        img.id === imageId ? { ...img, selected: !img.selected } : img
      )
    }));
  };

  const handleToggleAllSelection = () => {
    const allSelected = state.images.every(img => img.selected);
    setState(prev => ({
      ...prev,
      images: prev.images.map(img => ({ ...img, selected: !allSelected }))
    }));
  };

  const getCurrentImage = (): ImageData | null => {
    return state.images.find(img => img.id === state.currentImageId) || null;
  };

  const handleBatchProcess = async (model: string) => {
    const selectedImages = state.images.filter(img => img.selected);
    if (selectedImages.length === 0) {
      toast.error("No images selected for processing");
      return;
    }

    // Check if backend is available
    try {
      const healthCheck = await fetch('/api/models');
      if (!healthCheck.ok) {
        throw new Error('Backend not available');
      }
    } catch (error) {
      toast.error("Backend server not available. Please start the Flask backend server (python app.py) and ensure your .pt model files are in the backend folder.");
      return;
    }

    updateState({ selectedModel: model, isProcessing: true });
    setShowProgress(true);
    await processBatch(selectedImages, model, updateImage);
    updateState({ isProcessing: false });
  };

  const handleRetryFailed = async () => {
    if (!state.selectedModel) {
      toast.error("No model selected");
      return;
    }

    updateState({ isProcessing: true });
    await retryFailed(state.images, state.selectedModel, updateImage);
    updateState({ isProcessing: false });
  };

  const handleRemoveAllImages = () => {
    // Clean up object URLs
    state.images.forEach(img => URL.revokeObjectURL(img.url));
    
    updateState({
      images: [],
      currentImageId: null,
      batchProgress: { total: 0, completed: 0, failed: 0, processing: 0, percentage: 0 },
      selectedModel: null
    });
    
    toast.success("All images removed");
  };

  const handleAnnotationUpdate = (annotations: any[]) => {
    if (!state.currentImageId) return;
    updateImage(state.currentImageId, { annotations });
  };

  const exportAllAnnotations = () => {
    const completedImages = state.images.filter(img => img.status === 'completed' && img.annotations.length > 0);
    
    if (completedImages.length === 0) {
      toast.error("No completed annotations to export");
      return;
    }

    const exportData = {
      batch_info: {
        total_images: state.images.length,
        completed_images: completedImages.length,
        model_used: state.selectedModel,
        timestamp: new Date().toISOString()
      },
      annotations: completedImages.map(img => ({
        image_name: img.name,
        image_id: img.id,
        file_size: img.size,
        annotations: img.annotations,
        annotation_count: img.annotations.length,
        verified_count: img.annotations.filter(a => a.verified).length
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json"
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `batch_annotations_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`Exported annotations for ${completedImages.length} images`);
  };

  const currentImage = getCurrentImage();

  return (
    <div className="min-h-screen bg-workspace-bg">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/dsail annotate.png" alt="DSAIL Logo" className="h-8 w-8" />
            <h1 className="text-xl font-semibold text-foreground">DSAIL Annotate</h1>
            {state.images.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {state.images.length} images • {currentImage?.name || 'No selection'}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {state.images.length > 0 && (
              <>
                <Button
                  onClick={() => setShowGrid(!showGrid)}
                  variant="outline"
                  size="sm"
                >
                  {showGrid ? <ImageIcon className="w-4 h-4 mr-2" /> : <Grid className="w-4 h-4 mr-2" />}
                  {showGrid ? "Single View" : "Grid View"}
                </Button>

                <ModelSelectionDialog onModelSelect={handleBatchProcess}>
                  <Button
                    disabled={isProcessing}
                    className="bg-primary hover:bg-primary-hover"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {isProcessing ? "Processing..." : "Run Batch Detection"}
                  </Button>
                </ModelSelectionDialog>

                {state.batchProgress.failed > 0 && (
                  <Button
                    onClick={handleRetryFailed}
                    variant="outline"
                    disabled={isProcessing}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Retry Failed
                  </Button>
                )}
                
                <Button
                  onClick={exportAllAnnotations}
                  variant="outline"
                  disabled={state.batchProgress.completed === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export All
                </Button>

                <Button
                  onClick={handleRemoveAllImages}
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              </>
            )}
          </div>
        </div>
      </header>


      {/* Main Content */}
      <div className="flex h-[calc(100vh-140px)]">
        {state.images.length === 0 ? (
          <div className="flex-1">
            <BatchImageUploader onImagesUpload={handleImagesUpload} />
          </div>
        ) : showGrid ? (
          // Grid View Layout
          <PanelGroup direction="horizontal">
            {/* Left: Resizable Image Grid */}
            <Panel defaultSize={25} minSize={20} maxSize={50}>
              <div className="h-full bg-card border-r border-border">
                <ImageGrid
                  images={state.images}
                  currentImageId={state.currentImageId}
                  onImageSelect={handleImageSelect}
                  onImageToggleSelection={handleImageToggleSelection}
                  onToggleAllSelection={handleToggleAllSelection}
                />
              </div>
            </Panel>
            
            <PanelResizeHandle className="w-1 bg-border hover:bg-border/80 transition-colors" />
            
            <Panel defaultSize={75}>
              {/* Right: Current Image and Annotations */}
              <div className="flex-1 flex flex-col">
                {currentImage && (
                  <>
                    <Toolbar 
                      tool={tool}
                      onToolChange={setTool}
                      disabled={false}
                    />
                    
                    <div className="flex flex-1">
                      <div className="flex-1 p-6">
                        <ImageCanvas
                          image={currentImage.url}
                          annotations={currentImage.annotations}
                          selectedAnnotationId={null}
                          tool={tool}
                          onAnnotationSelect={() => {}}
                          onAnnotationUpdate={handleAnnotationUpdate}
                          onZoomIn={() => {}}
                          onZoomOut={() => {}}
                          onResetView={() => {}}
                        />
                      </div>
                      
                      <div className="w-80 bg-card border-l border-border">
                        <AnnotationSidebar
                          annotations={currentImage.annotations}
                          selectedId={null}
                          onSelect={() => {}}
                          onUpdate={handleAnnotationUpdate}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Panel>
          </PanelGroup>
        ) : (
          // Single Image View Layout
          <div className="flex-1 flex flex-col">
            {currentImage && (
              <>
                <Toolbar 
                  tool={tool}
                  onToolChange={setTool}
                  disabled={false}
                />
                
                <div className="flex flex-1">
                  <div className="w-80 bg-card border-r border-border">
                    <AnnotationSidebar
                      annotations={currentImage.annotations}
                      selectedId={null}
                      onSelect={() => {}}
                      onUpdate={handleAnnotationUpdate}
                    />
                  </div>
                  
                  <div className="flex-1 p-6">
                    <ImageCanvas
                      image={currentImage.url}
                      annotations={currentImage.annotations}
                      selectedAnnotationId={null}
                      tool={tool}
                      onAnnotationSelect={() => {}}
                      onAnnotationUpdate={handleAnnotationUpdate}
                      onZoomIn={() => {}}
                      onZoomOut={() => {}}
                      onResetView={() => {}}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Progress Overlay */}
      {showProgress && (
        <BatchProgress 
          progress={state.batchProgress} 
          isProcessing={isProcessing}
          onClose={() => setShowProgress(false)}
          onCancel={cancelProcessing}
        />
      )}
    </div>
  );
};