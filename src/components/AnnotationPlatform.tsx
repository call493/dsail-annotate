import { useState, useRef } from "react";
import { ImageUploader } from "./ImageUploader";
import { ImageCanvas } from "./ImageCanvas";
import { AnnotationSidebar } from "./AnnotationSidebar";
import { Toolbar } from "./Toolbar";
import { ModelSelectionDialog } from "./ModelSelectionDialog";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Download, Play, Settings, Trash2 } from "lucide-react";

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

export interface AnnotationPlatformState {
  image: string | null;
  imageFile: File | null;
  annotations: Annotation[];
  selectedAnnotationId: string | null;
  isProcessing: boolean;
  tool: "select" | "bbox" | "edit";
}

export const AnnotationPlatform = () => {
  const [state, setState] = useState<AnnotationPlatformState>({
    image: null,
    imageFile: null,
    annotations: [],
    selectedAnnotationId: null,
    isProcessing: false,
    tool: "select"
  });

  const updateState = (updates: Partial<AnnotationPlatformState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const handleImageUpload = (file: File) => {
    const imageUrl = URL.createObjectURL(file);
    updateState({ 
      image: imageUrl, 
      imageFile: file, 
      annotations: [],
      selectedAnnotationId: null 
    });
    toast.success("Image uploaded successfully");
  };

  const simulateAIDetection = async (model: string) => {
    if (!state.image) return;
    
    updateState({ isProcessing: true });
    toast.info(`Running ${model} detection...`);

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock AI annotations - replace with actual AI model calls
    const mockAnnotations: Annotation[] = [
      {
        id: "ai-1",
        label: "person",
        confidence: 0.95,
        bbox: { x: 100, y: 150, width: 120, height: 200 },
        source: "ai",
        verified: false
      },
      {
        id: "ai-2", 
        label: "car",
        confidence: 0.87,
        bbox: { x: 300, y: 250, width: 180, height: 100 },
        source: "ai",
        verified: false
      }
    ];

    updateState({ 
      annotations: mockAnnotations, 
      isProcessing: false 
    });
    toast.success(`${model} detected ${mockAnnotations.length} objects`);
  };

  const handleRemoveImage = () => {
    if (state.image) {
      URL.revokeObjectURL(state.image);
    }
    updateState({
      image: null,
      imageFile: null,
      annotations: [],
      selectedAnnotationId: null,
      tool: "select"
    });
    toast.success("Image removed");
  };

  const exportAnnotations = () => {
    if (state.annotations.length === 0) {
      toast.error("No annotations to export");
      return;
    }

    const exportData = {
      image: state.imageFile?.name || "unknown",
      annotations: state.annotations.map(ann => ({
        id: ann.id,
        label: ann.label,
        confidence: ann.confidence,
        bbox: ann.bbox,
        source: ann.source,
        verified: ann.verified
      })),
      timestamp: new Date().toISOString(),
      total_annotations: state.annotations.length,
      verified_annotations: state.annotations.filter(a => a.verified).length
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json"
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `annotations_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Annotations exported successfully");
  };

  return (
    <div className="min-h-screen bg-workspace-bg">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-foreground">
              AI Annotation Platform
            </h1>
            {state.imageFile && (
              <span className="text-sm text-muted-foreground">
                {state.imageFile.name}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {state.image && (
              <>
                <ModelSelectionDialog onModelSelect={simulateAIDetection}>
                  <Button
                    disabled={state.isProcessing}
                    className="bg-primary hover:bg-primary-hover"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {state.isProcessing ? "Processing..." : "Run AI Detection"}
                  </Button>
                </ModelSelectionDialog>
                
                <Button
                  onClick={exportAnnotations}
                  variant="outline"
                  disabled={state.annotations.length === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export JSON
                </Button>

                <Button
                  onClick={handleRemoveImage}
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove Image
                </Button>
              </>
            )}
            
            <Button variant="ghost" size="icon">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Sidebar */}
        <div className="w-80 bg-card border-r border-border">
          <AnnotationSidebar 
            annotations={state.annotations}
            selectedId={state.selectedAnnotationId}
            onSelect={(id) => updateState({ selectedAnnotationId: id })}
            onUpdate={(annotations) => updateState({ annotations })}
          />
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col">
          {/* Toolbar */}
          <Toolbar 
            tool={state.tool}
            onToolChange={(tool) => updateState({ tool })}
            disabled={!state.image}
          />

          {/* Canvas */}
          <div className="flex-1 p-6">
            {state.image ? (
              <ImageCanvas
                image={state.image}
                annotations={state.annotations}
                selectedAnnotationId={state.selectedAnnotationId}
                tool={state.tool}
                onAnnotationSelect={(id) => updateState({ selectedAnnotationId: id })}
                onAnnotationUpdate={(annotations) => updateState({ annotations })}
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