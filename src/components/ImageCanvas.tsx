import { useRef, useEffect, useState } from "react";
import { Annotation } from "./AnnotationPlatform";

interface ImageCanvasProps {
  image: string;
  annotations: Annotation[];
  selectedAnnotationId: string | null;
  tool: "select" | "bbox" | "edit";
  onAnnotationSelect: (id: string | null) => void;
  onAnnotationUpdate: (annotations: Annotation[]) => void;
}

export const ImageCanvas = ({
  image,
  annotations,
  selectedAnnotationId,
  tool,
  onAnnotationSelect,
  onAnnotationUpdate
}: ImageCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [newBbox, setNewBbox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

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

    // Draw image
    ctx.drawImage(imageElement, 0, 0, scaledWidth, scaledHeight);

    // Draw annotations
    annotations.forEach(annotation => {
      const isSelected = annotation.id === selectedAnnotationId;
      const bbox = annotation.bbox;
      
      // Scale bbox coordinates
      const x = bbox.x * scale;
      const y = bbox.y * scale;
      const width = bbox.width * scale;
      const height = bbox.height * scale;

      // Draw bounding box
      ctx.strokeStyle = isSelected ? 
        'hsl(var(--annotation-bbox-selected))' : 
        'hsl(var(--annotation-bbox))';
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.strokeRect(x, y, width, height);

      // Draw label background
      const labelText = `${annotation.label} (${Math.round(annotation.confidence * 100)}%)`;
      ctx.font = '12px sans-serif';
      const textMetrics = ctx.measureText(labelText);
      const labelWidth = textMetrics.width + 8;
      const labelHeight = 20;

      ctx.fillStyle = 'hsl(var(--annotation-label-bg))';
      ctx.fillRect(x, y - labelHeight, labelWidth, labelHeight);

      // Draw label text
      ctx.fillStyle = 'hsl(var(--annotation-label-text))';
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
        newBbox.x * scale, 
        newBbox.y * scale, 
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
    const x = (event.clientX - rect.left) / scale;
    const y = (event.clientY - rect.top) / scale;
    return { x, y };
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
          verified: true
        };
        
        onAnnotationUpdate([...annotations, newAnnotation]);
        onAnnotationSelect(newAnnotation.id);
      }
    }
    
    setIsDragging(false);
    setNewBbox(null);
  };

  return (
    <div 
      ref={containerRef}
      className="w-full h-full bg-canvas-bg rounded-lg border border-border overflow-hidden relative"
    >
      <div className="absolute inset-0 p-5 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full cursor-crosshair shadow-lg"
          onClick={handleCanvasClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>
    </div>
  );
};