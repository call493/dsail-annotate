import { useRef } from "react";
import { Button } from "./ui/button";
import { Upload, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
}

export const ImageUploader = ({ onImageUpload }: ImageUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error("Image size must be less than 10MB");
      return;
    }

    onImageUpload(file);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    
    if (!file) return;
    
    if (!file.type.startsWith("image/")) {
      toast.error("Please drop a valid image file");
      return;
    }

    onImageUpload(file);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  return (
    <div className="h-full flex items-center justify-center">
      <div
        className="w-full max-w-2xl mx-auto p-12 border-2 border-dashed border-border rounded-xl bg-canvas-bg transition-colors hover:bg-muted/50"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
            <ImageIcon className="w-10 h-10 text-primary" />
          </div>
          
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Upload an Image to Annotate
          </h3>
          
          <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
            Drag and drop an image here, or click to browse your files. 
            Supports JPG, PNG, WebP formats up to 10MB.
          </p>

          <Button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-primary hover:bg-primary-hover"
          >
            <Upload className="w-4 h-4 mr-2" />
            Choose Image
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
};