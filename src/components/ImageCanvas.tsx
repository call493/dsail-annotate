import { useRef, useEffect, useState } from "react";
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

interface ResizeHandle {
  position: "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w";
  x: number;
  y: number;
}

export const ImageCanvas = ({
  image,
  annotations,
  selectedAnnotationId,
  tool,
  onAnnotationSelect,
  onAnnotationUpdate,
  onZoomIn,
  onZoomOut,
  onResetView
}: ImageCanvasProps) => {
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
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0 });
  const [originalBbox, setOriginalBbox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

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

      // Draw resize handles for selected annotation
      if (isSelected && tool === "select") {
        const handleSize = 8;
        const handles = [
          { pos: "nw", x: x - handleSize/2, y: y - handleSize/2 },
          { pos: "ne", x: x + width - handleSize/2, y: y - handleSize/2 },
          { pos: "sw", x: x - handleSize/2, y: y + height - handleSize/2 },
          { pos: "se", x: x + width - handleSize/2, y: y + height - handleSize/2 },
          { pos: "n", x: x + width/2 - handleSize/2, y: y - handleSize/2 },
          { pos: "s", x: x + width/2 - handleSize/2, y: y + height - handleSize/2 },
          { pos: "w", x: x - handleSize/2, y: y + height/2 - handleSize/2 },
          { pos: "e", x: x + width - handleSize/2, y: y + height/2 - handleSize/2 }
        ];

        handles.forEach(handle => {
          ctx.fillStyle = 'white';
          ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
          ctx.strokeStyle = bboxColor;
          ctx.lineWidth = 2;
          ctx.strokeRect(handle.x, handle.y, handleSize, handleSize);
        });
      }
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

  const getResizeHandle = (coords: { x: number; y: number }, annotation: Annotation) => {
    const bbox = annotation.bbox;
    const handleSize = 8 / scale; // Account for canvas scaling
    
    const handles = [
      { pos: "nw", x: bbox.x, y: bbox.y },
      { pos: "ne", x: bbox.x + bbox.width, y: bbox.y },
      { pos: "sw", x: bbox.x, y: bbox.y + bbox.height },
      { pos: "se", x: bbox.x + bbox.width, y: bbox.y + bbox.height },
      { pos: "n", x: bbox.x + bbox.width/2, y: bbox.y },
      { pos: "s", x: bbox.x + bbox.width/2, y: bbox.y + bbox.height },
      { pos: "w", x: bbox.x, y: bbox.y + bbox.height/2 },
      { pos: "e", x: bbox.x + bbox.width, y: bbox.y + bbox.height/2 }
    ];

    for (const handle of handles) {
      if (coords.x >= handle.x - handleSize/2 && 
          coords.x <= handle.x + handleSize/2 &&
          coords.y >= handle.y - handleSize/2 && 
          coords.y <= handle.y + handleSize/2) {
        return handle.pos;
      }
    }
    return null;
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev * 1.2, 5));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev / 1.2, 0.1));
  };

  const resetView = () => {
    if (imageElement) {
      fitImageToCanvas(imageElement);
    }
  };

  const handleWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    if (event.deltaY < 0) {
      zoomIn();
    } else {
      zoomOut();
    }
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
    const coords = getCanvasCoordinates(event);
    
    if (tool === "bbox") {
      setDragStart(coords);
      setIsDragging(true);
      setNewBbox({ x: coords.x, y: coords.y, width: 0, height: 0 });
    } else if (tool === "select") {
      // Check if clicking on a resize handle
      const selectedAnnotation = annotations.find(ann => ann.id === selectedAnnotationId);
      if (selectedAnnotation) {
        const handle = getResizeHandle(coords, selectedAnnotation);
        if (handle) {
          setIsResizing(true);
          setResizeHandle(handle);
          setResizeStart(coords);
          setOriginalBbox(selectedAnnotation.bbox);
          return;
        }
      }
      
      if (event.button === 1) { // Middle mouse button for panning
        const panCoords = { x: event.clientX, y: event.clientY };
        setPanStart(panCoords);
        setIsPanning(true);
      }
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
    } else if (isResizing && originalBbox && resizeHandle) {
      const coords = getCanvasCoordinates(event);
      const deltaX = coords.x - resizeStart.x;
      const deltaY = coords.y - resizeStart.y;
      
      let newBbox = { ...originalBbox };
      
      switch (resizeHandle) {
        case "nw":
          newBbox.x = originalBbox.x + deltaX;
          newBbox.y = originalBbox.y + deltaY;
          newBbox.width = originalBbox.width - deltaX;
          newBbox.height = originalBbox.height - deltaY;
          break;
        case "ne":
          newBbox.y = originalBbox.y + deltaY;
          newBbox.width = originalBbox.width + deltaX;
          newBbox.height = originalBbox.height - deltaY;
          break;
        case "sw":
          newBbox.x = originalBbox.x + deltaX;
          newBbox.width = originalBbox.width - deltaX;
          newBbox.height = originalBbox.height + deltaY;
          break;
        case "se":
          newBbox.width = originalBbox.width + deltaX;
          newBbox.height = originalBbox.height + deltaY;
          break;
        case "n":
          newBbox.y = originalBbox.y + deltaY;
          newBbox.height = originalBbox.height - deltaY;
          break;
        case "s":
          newBbox.height = originalBbox.height + deltaY;
          break;
        case "w":
          newBbox.x = originalBbox.x + deltaX;
          newBbox.width = originalBbox.width - deltaX;
          break;
        case "e":
          newBbox.width = originalBbox.width + deltaX;
          break;
      }
      
      // Ensure minimum size
      if (newBbox.width < 10) {
        newBbox.width = 10;
        if (resizeHandle.includes("w")) newBbox.x = originalBbox.x + originalBbox.width - 10;
      }
      if (newBbox.height < 10) {
        newBbox.height = 10;
        if (resizeHandle.includes("n")) newBbox.y = originalBbox.y + originalBbox.height - 10;
      }
      
      // Update the annotation
      const updatedAnnotations = annotations.map(ann => 
        ann.id === selectedAnnotationId ? { ...ann, bbox: newBbox } : ann
      );
      onAnnotationUpdate(updatedAnnotations);
      
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
          verified: true
        };
        
        onAnnotationUpdate([...annotations, newAnnotation]);
        onAnnotationSelect(newAnnotation.id);
      }
    }
    
    setIsDragging(false);
    setNewBbox(null);
    setIsPanning(false);
    setIsResizing(false);
    setResizeHandle(null);
    setOriginalBbox(null);
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
};