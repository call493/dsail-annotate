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
}

export const Toolbar = ({ tool, onToolChange, disabled = false }: ToolbarProps) => {
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
    <div className="bg-card border-b border-border px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Drawing Tools */}
          <div className="flex items-center gap-1">
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
                  className={`relative ${isActive ? "bg-primary hover:bg-primary-hover" : ""}`}
                  title={`${toolItem.description} (${toolItem.shortcut})`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {toolItem.label}
                  {isActive && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {toolItem.shortcut}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>

          <Separator orientation="vertical" className="h-6 mx-2" />

          {/* View Tools */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              disabled={disabled}
              title="Zoom In (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              disabled={disabled}
              title="Zoom Out (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              disabled={disabled}
              title="Fit to Screen (F)"
            >
              <Move className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              disabled={disabled}
              title="Reset View (R)"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Instructions */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Info className="w-4 h-4" />
          {tool === "select" && "Click annotations to select and edit"}
          {tool === "bbox" && "Click and drag to create bounding boxes"}
          {tool === "edit" && "Double-click annotations to modify"}
        </div>
      </div>
    </div>
  );
};