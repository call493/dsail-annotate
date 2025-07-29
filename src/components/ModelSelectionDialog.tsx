import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Play, Zap, Brain, Eye } from "lucide-react";

interface ModelSelectionDialogProps {
  onModelSelect: (model: string) => void;
  children: React.ReactNode;
}

interface AIModel {
  id: string;
  name: string;
  description: string;
}

export const ModelSelectionDialog = ({ onModelSelect, children }: ModelSelectionDialogProps) => {
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchModels = async () => {
      setLoading(true);
      try {
        const response = await fetch("http://localhost:5000/api/models");
        if (response.ok) {
          const data = await response.json();
          setAvailableModels(data.models);
        } else {
          // Fallback models if backend is not available
          setAvailableModels([
            {
              id: "mdv6-yolov9",
              name: "MDV6 YOLOv9-C",
              description: "General object detection model"
            },
            {
              id: "mugie-grevys-plains",
              name: "Mugie Grevy's & Plains",
              description: "Specialized for Grevy's zebras and plains animals"
            },
            {
              id: "mugie-zebra",
              name: "Mugie Zebra",
              description: "Specialized for zebra detection"
            }
          ]);
        }
      } catch (error) {
        console.error("Failed to fetch models:", error);
        // Fallback models if backend is not available
        setAvailableModels([
          {
            id: "mdv6-yolov9",
            name: "MDV6 YOLOv9-C",
            description: "General object detection model"
          },
          {
            id: "mugie-grevys-plains",
            name: "Mugie Grevy's & Plains",
            description: "Specialized for Grevy's zebras and plains animals"
          },
          {
            id: "mugie-zebra",
            name: "Mugie Zebra",
            description: "Specialized for zebra detection"
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchModels();
    }
  }, [open]);

  const handleRunDetection = () => {
    if (selectedModel) {
      onModelSelect(selectedModel);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select AI Model</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder={loading ? "Loading models..." : "Choose an AI model"} />
            </SelectTrigger>
            <SelectContent className="bg-background border-border z-50">
              {availableModels.map((model) => (
                <SelectItem key={model.id} value={model.id} className="bg-background hover:bg-accent">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    {model.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedModel && (
            <div className="border border-border rounded-lg p-4 space-y-3">
              {(() => {
                const model = availableModels.find(m => m.id === selectedModel);
                if (!model) return null;
                
                return (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-primary text-primary-foreground">
                        <Brain className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">{model.name}</h3>
                        <p className="text-sm text-muted-foreground">{model.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Badge variant="outline">
                        YOLO Model
                      </Badge>
                      <Badge variant="outline">
                        Ready
                      </Badge>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRunDetection}
              disabled={!selectedModel}
              className="flex-1 bg-primary hover:bg-primary-hover"
            >
              <Play className="w-4 h-4 mr-2" />
              Run Detection
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};