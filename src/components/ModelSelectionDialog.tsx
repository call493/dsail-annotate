import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Play, Zap, Brain, Eye } from "lucide-react";

interface ModelSelectionDialogProps {
  onModelSelect: (model: string) => void;
  children: React.ReactNode;
}

const aiModels = [
  {
    id: "yolov8n",
    name: "YOLOv8 Nano",
    description: "Fast and lightweight model for real-time detection",
    accuracy: "Medium",
    speed: "Very Fast",
    icon: Zap,
    color: "bg-green-500"
  },
  {
    id: "yolov8s",
    name: "YOLOv8 Small",
    description: "Balanced performance and accuracy",
    accuracy: "Good",
    speed: "Fast",
    icon: Eye,
    color: "bg-blue-500"
  },
  {
    id: "yolov8m",
    name: "YOLOv8 Medium",
    description: "Higher accuracy for detailed detection",
    accuracy: "High",
    speed: "Medium",
    icon: Brain,
    color: "bg-purple-500"
  },
  {
    id: "yolov8l",
    name: "YOLOv8 Large",
    description: "Maximum accuracy for professional use",
    accuracy: "Very High",
    speed: "Slow",
    icon: Brain,
    color: "bg-red-500"
  }
];

export const ModelSelectionDialog = ({ onModelSelect, children }: ModelSelectionDialogProps) => {
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [open, setOpen] = useState(false);

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
            <SelectTrigger>
              <SelectValue placeholder="Choose an AI model" />
            </SelectTrigger>
            <SelectContent>
              {aiModels.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${model.color}`} />
                    {model.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedModel && (
            <div className="border border-border rounded-lg p-4 space-y-3">
              {(() => {
                const model = aiModels.find(m => m.id === selectedModel);
                if (!model) return null;
                const Icon = model.icon;
                
                return (
                  <>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-md ${model.color} text-white`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">{model.name}</h3>
                        <p className="text-sm text-muted-foreground">{model.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Badge variant="outline">
                        Accuracy: {model.accuracy}
                      </Badge>
                      <Badge variant="outline">
                        Speed: {model.speed}
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