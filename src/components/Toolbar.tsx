import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { 
  MousePointer, 
  Square, 
  Edit, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Move,
  Info
} from "lucide-react";
import { Badge } from "./ui/badge";

interface ToolbarProps {
  tool: "select" | "bbox" | "edit";
  onToolChange: (tool: "select" | "bbox" | "edit") => void;
  disabled?: boolean;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetView?: () => void;
}

export const Toolbar = ({ 
  tool, 
  onToolChange, 
  disabled = false, 
  onZoomIn, 
  onZoomOut, 
  onResetView 
}: ToolbarProps) => {
  const tools = [
    {
      id: "select" as const,
      icon: MousePointer,
      label: "Select",
      description: "Select and edit annotations",
      shortcut: "V"
    },
    {
      id: "bbox" as const,
      icon: Square,
      label: "Bounding Box",
      description: "Draw new bounding boxes",
      shortcut: "B"
    },
    {
      id: "edit" as const,
      icon: Edit,
      label: "Edit",
      description: "Edit existing annotations",
      shortcut: "E"
    }
  ];

  return (
    <div className="bg-card border-b border-border px-4 py-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {/* Drawing Tools */}
          {tools.map((toolItem) => {
            const Icon = toolItem.icon;
            const isActive = tool === toolItem.id;
            
            return (
              <Button
                key={toolItem.id}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                disabled={disabled}
                onClick={() => onToolChange(toolItem.id)}
                className={`h-8 px-3 ${isActive ? "bg-primary hover:bg-primary-hover" : ""}`}
                title={`${toolItem.description} (${toolItem.shortcut})`}
              >
                <Icon className="w-4 h-4" />
              </Button>
            );
          })}

          <Separator orientation="vertical" className="h-5 mx-2" />

          {/* View Tools */}
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={onZoomIn}
            title="Zoom In (+)"
            className="h-8 px-2"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={onZoomOut}
            title="Zoom Out (-)"
            className="h-8 px-2"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={onResetView}
            title="Reset View (R)"
            className="h-8 px-2"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        {/* Minimal Instructions */}
        <div className="text-xs text-muted-foreground">
          {tool === "select" && "Select"}
          {tool === "bbox" && "Draw"}
          {tool === "edit" && "Edit"}
        </div>
      </div>
    </div>
  );
};