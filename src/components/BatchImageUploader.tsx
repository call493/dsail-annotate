import { useRef } from "react";
import { Button } from "./ui/button";
import { Upload, FolderOpen, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface BatchImageUploaderProps {
  onImagesUpload: (files: File[]) => void;
}

export const BatchImageUploader = ({ onImagesUpload }: BatchImageUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const validateFiles = (files: FileList | File[]): File[] => {
    const validFiles: File[] = [];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const maxFiles = 500;

    const fileArray = Array.from(files);
    
    if (fileArray.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} images allowed`);
      return [];
    }

    for (const file of fileArray) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not a valid image file`);
        continue;
      }

      if (file.size > maxSize) {
        toast.error(`${file.name} is too large (max 10MB)`);
        continue;
      }

      validFiles.push(file);
    }

    return validFiles;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const validFiles = validateFiles(files);
    if (validFiles.length > 0) {
      onImagesUpload(validFiles);
      toast.success(`${validFiles.length} images uploaded successfully`);
    }

    // Reset input
    event.target.value = '';
  };

  const handleFolderSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const validFiles = validateFiles(files);
    if (validFiles.length > 0) {
      onImagesUpload(validFiles);
      toast.success(`${validFiles.length} images uploaded from folder`);
    }

    // Reset input
    event.target.value = '';
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    
    if (!files || files.length === 0) return;
    
    const validFiles = validateFiles(files);
    if (validFiles.length > 0) {
      onImagesUpload(validFiles);
      toast.success(`${validFiles.length} images uploaded successfully`);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  return (
    <div className="h-full flex items-center justify-center">
      <div
        className="w-full max-w-3xl mx-auto p-12 border-2 border-dashed border-border rounded-xl bg-canvas-bg transition-colors hover:bg-muted/50"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-primary" />
          </div>
          
          <h3 className="text-2xl font-semibold text-foreground mb-3">
            Upload Images for Batch Annotation
          </h3>
          
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Upload multiple images or an entire folder to run AI detection on all images at once. 
            Supports JPG, PNG, WebP formats up to 10MB each. Maximum 500 images per batch.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-primary hover:bg-primary-hover"
              size="lg"
            >
              <Upload className="w-5 h-5 mr-2" />
              Choose Images
            </Button>

            <Button 
              onClick={() => folderInputRef.current?.click()}
              variant="outline"
              size="lg"
            >
              <FolderOpen className="w-5 h-5 mr-2" />
              Upload Folder
            </Button>
          </div>

          <div className="mt-6 text-sm text-muted-foreground">
            <p>• Drag and drop images or folders here</p>
            <p>• Up to 500 images, 10MB each</p>
            <p>• Supported formats: JPG, PNG, WebP</p>
          </div>

          {/* Multiple file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Folder input */}
          <input
            ref={folderInputRef}
            type="file"
            accept="image/*"
            // @ts-ignore - webkitdirectory is not in types but works
            webkitdirectory=""
            multiple
            onChange={handleFolderSelect}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
};