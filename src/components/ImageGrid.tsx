import { useState, useMemo } from "react";
import { ImageData } from "../types/batch";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { Button } from "./ui/button";
import { Search, CheckCircle, Clock, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageGridProps {
  images: ImageData[];
  currentImageId: string | null;
  onImageSelect: (imageId: string) => void;
  onImageToggleSelection: (imageId: string) => void;
  onToggleAllSelection: () => void;
}

export const ImageGrid = ({ images, currentImageId, onImageSelect, onImageToggleSelection, onToggleAllSelection }: ImageGridProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredImages = useMemo(() => {
    return images.filter(image => 
      image.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [images, searchTerm]);

  const selectedCount = useMemo(() => 
    images.filter(img => img.selected).length, 
    [images]
  );

  const allSelected = selectedCount === images.length;
  const someSelected = selectedCount > 0 && selectedCount < images.length;

  const getStatusIcon = (status: ImageData['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: ImageData['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-success/10 text-success border-success/20';
      case 'processing':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'failed':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Search Header */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search images..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {filteredImages.length} of {images.length} images
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-muted-foreground">
              {selectedCount} selected
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={allSelected}
                onCheckedChange={onToggleAllSelection}
                className={someSelected ? "data-[state=checked]:bg-primary/50" : ""}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleAllSelection}
                className="h-auto p-0 text-sm"
              >
                {allSelected ? "Deselect All" : "Select All"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Image Grid */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredImages.map((image) => (
            <div
              key={image.id}
              onClick={() => onImageSelect(image.id)}
              className={cn(
                "group relative cursor-pointer rounded-lg border-2 transition-all hover:shadow-md",
                currentImageId === image.id
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border hover:border-primary/50"
              )}
            >
              {/* Image Thumbnail */}
              <div className="aspect-square overflow-hidden rounded-t-lg bg-muted relative">
                <img
                  src={image.url}
                  alt={image.name}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                {/* Selection Checkbox */}
                <div className="absolute top-2 left-2">
                  <Checkbox
                    checked={image.selected}
                    onCheckedChange={() => onImageToggleSelection(image.id)}
                    className="bg-background/80 backdrop-blur-sm"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>

              {/* Image Info */}
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(image.status)}
                    <Badge variant="outline" className={getStatusColor(image.status)}>
                      {image.status}
                    </Badge>
                  </div>
                  {image.annotations.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {image.annotations.length} objects
                    </span>
                  )}
                </div>

                <div>
                  <div className="text-sm font-medium text-foreground truncate" title={image.name}>
                    {image.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {(image.size / 1024 / 1024).toFixed(1)} MB
                  </div>
                </div>

                {/* Progress Bar for Processing */}
                {image.status === 'processing' && (
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${image.progress}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Selected Indicator */}
              {currentImageId === image.id && (
                <div className="absolute top-2 right-2">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-primary-foreground" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredImages.length === 0 && searchTerm && (
          <div className="text-center py-12 text-muted-foreground">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No images found matching "{searchTerm}"</p>
          </div>
        )}
      </div>
    </div>
  );
};