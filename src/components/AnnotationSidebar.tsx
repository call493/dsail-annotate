import { useState } from "react";
import { Annotation } from "./AnnotationPlatform";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";
import { 
  Eye, 
  EyeOff, 
  Trash2, 
  Check, 
  X, 
  Edit2,
  Bot,
  User,
  Target
} from "lucide-react";
import { toast } from "sonner";

interface AnnotationSidebarProps {
  annotations: Annotation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onUpdate: (annotations: Annotation[]) => void;
}

export const AnnotationSidebar = ({ 
  annotations, 
  selectedId, 
  onSelect, 
  onUpdate 
}: AnnotationSidebarProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");

  const aiCount = annotations.filter(a => a.source === "ai").length;
  const manualCount = annotations.filter(a => a.source === "manual").length;

  const handleDelete = (id: string) => {
    const updated = annotations.filter(a => a.id !== id);
    onUpdate(updated);
    if (selectedId === id) {
      onSelect(updated[0]?.id || "");
    }
    toast.success("Annotation deleted");
  };

  const handleVerify = (id: string, verified: boolean) => {
    const updated = annotations.map(a => 
      a.id === id ? { ...a, verified } : a
    );
    onUpdate(updated);
    toast.success(verified ? "Annotation verified" : "Annotation unverified");
  };

  const startEdit = (annotation: Annotation) => {
    setEditingId(annotation.id);
    setEditLabel(annotation.label);
  };

  const saveEdit = (id: string) => {
    if (!editLabel.trim()) {
      toast.error("Label cannot be empty");
      return;
    }

    const updated = annotations.map(a => 
      a.id === id ? { ...a, label: editLabel.trim() } : a
    );
    onUpdate(updated);
    setEditingId(null);
    setEditLabel("");
    toast.success("Label updated");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditLabel("");
  };

  return (
    <div className="h-full flex flex-col">
      {/* Statistics Header */}
      <div className="p-4 border-b border-border w-[92%] mx-auto">
        <h2 className="text-lg font-semibold text-foreground mb-3">
          Annotations
        </h2>
        
        <div className="grid grid-cols-1 gap-2 mb-3">
          <div className="bg-muted/50 rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-foreground">
              {annotations.length}
            </div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
        </div>

        <div className="flex gap-2">
          <Badge variant="secondary" className="text-xs">
            <Bot className="w-3 h-3 mr-1" />
            {aiCount} AI
          </Badge>
          <Badge variant="outline" className="text-xs">
            <User className="w-3 h-3 mr-1" />
            {manualCount} Manual
          </Badge>
        </div>
      </div>

      {/* Annotations List */}
      <div className="flex-1 overflow-y-auto">
        {annotations.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No annotations yet</p>
            <p className="text-xs">Upload an image and run AI detection</p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {annotations.map((annotation) => (
              <Card 
                key={annotation.id}
                className={`cursor-pointer transition-all hover:shadow-md max-w-[92%] mx-auto ${
                  selectedId === annotation.id 
                    ? "ring-2 ring-primary bg-primary/5" 
                    : ""
                }`}
                onClick={() => onSelect(annotation.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {annotation.source === "ai" ? (
                        <Bot className="w-4 h-4 text-primary" />
                      ) : (
                        <User className="w-4 h-4 text-muted-foreground" />
                      )}
                      
                      {editingId === annotation.id ? (
                        <div className="flex gap-1">
                          <Input
                            value={editLabel}
                            onChange={(e) => setEditLabel(e.target.value)}
                            className="h-6 text-xs w-20"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEdit(annotation.id);
                              if (e.key === "Escape") cancelEdit();
                            }}
                          />
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              saveEdit(annotation.id);
                            }}
                          >
                            <Check className="w-3 h-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              cancelEdit();
                            }}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <span className="font-medium text-sm text-foreground">
                          {annotation.label}
                        </span>
                      )}
                    </div>

                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span>
                      Confidence: {Math.round(annotation.confidence * 100)}%
                    </span>
                    <Badge 
                      variant={annotation.confidence > 0.8 ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {annotation.confidence > 0.8 ? "High" : 
                       annotation.confidence > 0.5 ? "Medium" : "Low"}
                    </Badge>
                  </div>

                  <div className="text-xs text-muted-foreground mb-3">
                    Position: ({Math.round(annotation.bbox.x)}, {Math.round(annotation.bbox.y)}) 
                    Size: {Math.round(annotation.bbox.width)}×{Math.round(annotation.bbox.height)}
                  </div>

                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(annotation);
                      }}
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        const isVisible = annotation.visible !== false;
                        const updated = annotations.map(a => 
                          a.id === annotation.id ? { ...a, visible: !isVisible } : a
                        );
                        onUpdate(updated);
                        toast.success(!isVisible ? "Bounding box shown" : "Bounding box hidden");
                      }}
                    >
                      {annotation.visible !== false ? (
                        <EyeOff className="w-3 h-3" />
                      ) : (
                        <Eye className="w-3 h-3" />
                      )}
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(annotation.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};