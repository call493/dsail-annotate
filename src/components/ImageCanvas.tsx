import { useRef, useEffect, useState, useImperativeHandle, forwardRef } from "react";
import { Annotation } from "./AnnotationPlatform";

interface ImageCanvasProps {
  image: string;
  annotations: Annotation[];
  selectedAnnotationId: string | null;
  tool: "select" | "bbox" | "edit";
  onAnnotationSelect: (id: string | null) => void;
  onAnnotationUpdate: (annotations: Annotation[]) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
}

export type ImageCanvasHandle = {
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  setPanMode: (active: boolean) => void;
};

export const ImageCanvas = forwardRef<ImageCanvasHandle, ImageCanvasProps>(({
  image,
  annotations,
  selectedAnnotationId,
  tool,
  onAnnotationSelect,
  onAnnotationUpdate,
  onZoomIn,
  onZoomOut,
  onResetView
}: ImageCanvasProps, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [newBbox, setNewBbox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isPanMode, setIsPanMode] = useState(false);

  // Color palette for different bounding boxes
  const bboxColors = [
    'hsl(220, 100%, 50%)', // Blue
    'hsl(120, 100%, 40%)', // Green  
    'hsl(0, 100%, 50%)',   // Red
    'hsl(280, 100%, 50%)', // Purple
    'hsl(35, 100%, 50%)',  // Orange
    'hsl(180, 100%, 40%)', // Cyan
    'hsl(60, 100%, 45%)',  // Yellow
    'hsl(320, 100%, 50%)', // Magenta
  ];

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageElement(img);
      fitImageToCanvas(img);
    };
    img.src = image;
  }, [image]);

  useEffect(() => {
    if (imageElement && canvasRef.current) {
      drawCanvas();
    }
  }, [imageElement, annotations, selectedAnnotationId, scale, offset, newBbox]);

  const fitImageToCanvas = (img: HTMLImageElement) => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const containerWidth = container.clientWidth - 40; // padding
    const containerHeight = container.clientHeight - 40;
    
    const imageAspect = img.width / img.height;
    const containerAspect = containerWidth / containerHeight;
    
    let newScale;
    if (imageAspect > containerAspect) {
      newScale = containerWidth / img.width;
    } else {
      newScale = containerHeight / img.height;
    }
    
    setScale(Math.min(newScale, 1)); // Don't scale up beyond original size
    setOffset({ x: 0, y: 0 });
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !imageElement) return;

    // Set canvas size
    const scaledWidth = imageElement.width * scale;
    const scaledHeight = imageElement.height * scale;
    canvas.width = scaledWidth;
    canvas.height = scaledHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw image with offset
    ctx.drawImage(imageElement, offset.x, offset.y, scaledWidth, scaledHeight);

    // Draw annotations
    annotations.forEach((annotation, index) => {
      // Skip hidden annotations
      if (annotation.visible === false) return;

      const isSelected = annotation.id === selectedAnnotationId;
      const bbox = annotation.bbox;
      
      // Scale bbox coordinates
      const x = bbox.x * scale + offset.x;
      const y = bbox.y * scale + offset.y;
      const width = bbox.width * scale;
      const height = bbox.height * scale;

      // Get color for this annotation
      const colorIndex = index % bboxColors.length;
      const bboxColor = bboxColors[colorIndex];

      // Draw bounding box
      ctx.strokeStyle = isSelected ? bboxColor : bboxColor;
      ctx.lineWidth = isSelected ? 3 : 2;
      if (isSelected) {
        ctx.setLineDash([]);
      } else {
        ctx.globalAlpha = 0.8;
      }
      ctx.strokeRect(x, y, width, height);
      ctx.globalAlpha = 1;

      // Draw label background
      const labelText = `${annotation.label} (${Math.round(annotation.confidence * 100)}%)`;
      ctx.font = '12px sans-serif';
      const textMetrics = ctx.measureText(labelText);
      const labelWidth = textMetrics.width + 8;
      const labelHeight = 20;

      // Use same color for label background with transparency
      ctx.fillStyle = bboxColor.replace(')', ', 0.9)').replace('hsl(', 'hsla(');
      ctx.fillRect(x, y - labelHeight, labelWidth, labelHeight);

      // Draw label text
      ctx.fillStyle = 'white';
      ctx.fillText(labelText, x + 4, y - 6);

      // Draw confidence indicator
      const confidenceColor = annotation.confidence > 0.8 ? 
        'hsl(var(--success))' : 
        annotation.confidence > 0.5 ? 
        'hsl(var(--warning))' : 
        'hsl(var(--destructive))';
      
      ctx.fillStyle = confidenceColor;
      ctx.fillRect(x + width - 6, y, 6, 6);
    });

    // Draw new bbox being created
    if (newBbox) {
      ctx.strokeStyle = 'hsl(var(--primary))';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(
        newBbox.x * scale + offset.x, 
        newBbox.y * scale + offset.y, 
        newBbox.width * scale, 
        newBbox.height * scale
      );
      ctx.setLineDash([]);
    }
  };

  const getCanvasCoordinates = (event: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left - offset.x) / scale;
    const y = (event.clientY - rect.top - offset.y) / scale;
    return { x, y };
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev * 1.2, 3));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev / 1.2, 0.1));
  };

  const resetView = () => {
    if (imageElement) {
      fitImageToCanvas(imageElement);
    }
  };

  useImperativeHandle(ref, () => ({
    zoomIn,
    zoomOut,
    resetView,
    setPanMode: (active: boolean) => setIsPanMode(active),
  }));

  const handleWheel = (_event: React.WheelEvent) => {
    // Zoom on scroll disabled by request
    return;
  };

  const handleCanvasClick = (event: React.MouseEvent) => {
    const coords = getCanvasCoordinates(event);
    
    if (tool === "select") {
      // Find clicked annotation
      const clickedAnnotation = annotations.find(ann => {
        const bbox = ann.bbox;
        return coords.x >= bbox.x && 
               coords.x <= bbox.x + bbox.width &&
               coords.y >= bbox.y && 
               coords.y <= bbox.y + bbox.height;
      });
      
      onAnnotationSelect(clickedAnnotation?.id || null);
    }
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    if (tool === "bbox") {
      const coords = getCanvasCoordinates(event);
      setDragStart(coords);
      setIsDragging(true);
      setNewBbox({ x: coords.x, y: coords.y, width: 0, height: 0 });
    } else if (tool === "select" && (event.button === 1 || (isPanMode && event.button === 0))) { // Middle button or left button in pan mode
      const coords = { x: event.clientX, y: event.clientY };
      setPanStart(coords);
      setIsPanning(true);
    }
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (isDragging && tool === "bbox") {
      const coords = getCanvasCoordinates(event);
      const width = coords.x - dragStart.x;
      const height = coords.y - dragStart.y;
      
      setNewBbox({
        x: width < 0 ? coords.x : dragStart.x,
        y: height < 0 ? coords.y : dragStart.y,
        width: Math.abs(width),
        height: Math.abs(height)
      });
    } else if (isPanning) {
      const deltaX = event.clientX - panStart.x;
      const deltaY = event.clientY - panStart.y;
      
      setOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      
      setPanStart({ x: event.clientX, y: event.clientY });
    }
  };

  const handleMouseUp = () => {
    if (isDragging && newBbox && tool === "bbox") {
      if (newBbox.width > 10 && newBbox.height > 10) {
        // Create new annotation
        const newAnnotation: Annotation = {
          id: `manual-${Date.now()}`,
          label: "object", // Default label
          confidence: 1.0,
          bbox: newBbox,
          source: "manual",
          visible: true
        };
        
        onAnnotationUpdate([...annotations, newAnnotation]);
        onAnnotationSelect(newAnnotation.id);
      }
    }
    
    setIsDragging(false);
    setNewBbox(null);
    setIsPanning(false);
  };

  return (
    <div 
      ref={containerRef}
      className="w-full h-full bg-canvas-bg rounded-lg border border-border overflow-hidden relative"
    >
      <div className="absolute inset-0 p-5 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          className={`max-w-full max-h-full shadow-lg ${
            tool === "bbox" ? "cursor-crosshair" : isPanning ? "cursor-grabbing" : "cursor-grab"
          }`}
          onClick={handleCanvasClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        />
      </div>
    </div>
  );
});