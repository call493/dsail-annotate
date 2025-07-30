import { useRef } from "react";
import { Button } from "./ui/button";
import { Upload, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface ImageUploaderProps {
  onImageUpload: (files: File[]) => void;
}

export const ImageUploader = ({ onImageUpload }: ImageUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const validFiles: File[] = [];
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not a valid image file`);
        continue;
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error(`${file.name} is too large (max 10MB)`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      onImageUpload(validFiles);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    
    if (files.length === 0) return;
    
    const validFiles: File[] = [];
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not a valid image file`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      onImageUpload(validFiles);
    }
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
            Drag and drop images here, or click to browse your files. 
            Supports multiple JPG, PNG, WebP formats up to 10MB each.
          </p>

          <Button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-primary hover:bg-primary-hover"
          >
            <Upload className="w-4 h-4 mr-2" />
            Choose Images
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
};