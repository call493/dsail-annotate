import { useMemo } from "react";
import { ImageData } from "../types/batch";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { Button } from "./ui/button";
import { CheckCircle, Clock, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageGridProps {
  images: ImageData[];
  currentImageId: string | null;
  onImageSelect: (imageId: string) => void;
  onImageToggleSelection: (imageId: string) => void;
  onToggleAllSelection: () => void;
}

export const ImageGrid = ({ images, currentImageId, onImageSelect, onImageToggleSelection, onToggleAllSelection }: ImageGridProps) => {
  const filteredImages = images;

  const selectedCount = useMemo(() => 
    images.filter(img => img.selected).length, 
    [images]
  );

  const totalSelectedSize = useMemo(() => 
    images.filter(img => img.selected).reduce((total, img) => total + img.size, 0),
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
    <div className="h-full flex flex-col bg-card">
      {/* Simplified Header */}
      <div className="p-3 border-b border-border bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {selectedCount > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  {selectedCount} selected
                </Badge>
                <span className="text-sm text-muted-foreground">
                  ({(totalSelectedSize / 1024 / 1024).toFixed(1)} MB)
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Checkbox
              checked={allSelected}
              onCheckedChange={onToggleAllSelection}
              className={cn(
                "transition-all duration-200",
                someSelected && "data-[state=checked]:bg-primary/70"
              )}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleAllSelection}
              className="h-6 px-2 text-sm font-medium hover:bg-primary/10 transition-colors"
            >
              {allSelected ? "Deselect All" : "Select All"}
            </Button>
          </div>
        </div>
      </div>

      {/* Compact Square Image Grid */}
      <div className="flex-1 overflow-auto p-3">
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
          {filteredImages.map((image) => (
            <div
              key={image.id}
              onClick={() => onImageSelect(image.id)}
              className={cn(
                "group relative cursor-pointer border-2 transition-all duration-200 hover:shadow-lg",
                "bg-card overflow-hidden",
                currentImageId === image.id
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border hover:border-primary/50",
                image.selected && "ring-2 ring-primary/40"
              )}
            >
              {/* Image Thumbnail */}
              <div className="aspect-square overflow-hidden bg-muted relative">
                <img
                  src={image.url}
                  alt={image.name}
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                />
                
                {/* Selection Checkbox */}
                <div className="absolute top-2 left-2 z-10">
                  <Checkbox
                    checked={image.selected}
                    onCheckedChange={() => onImageToggleSelection(image.id)}
                    className={cn(
                      "bg-background/90 backdrop-blur-sm border shadow-md transition-all duration-200",
                      "hover:bg-background hover:scale-105",
                      image.selected && "border-primary"
                    )}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                
                {/* Current Image Indicator */}
                {currentImageId === image.id && (
                  <div className="absolute top-2 right-2 z-10">
                    <div className="w-5 h-5 bg-primary flex items-center justify-center shadow-md">
                      <CheckCircle className="w-3 h-3 text-primary-foreground" />
                    </div>
                  </div>
                )}

                {/* Status Badge */}
                <div className="absolute bottom-2 left-2 z-10">
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-xs font-medium border-0 px-1.5 py-0.5 shadow-sm",
                      getStatusColor(image.status)
                    )}
                  >
                    {getStatusIcon(image.status)}
                  </Badge>
                </div>

                {/* Annotation Count */}
                {image.annotations.length > 0 && (
                  <div className="absolute bottom-2 right-2 z-10">
                    <Badge className="bg-primary/90 text-primary-foreground text-xs px-1.5 py-0.5 shadow-sm">
                      {image.annotations.length}
                    </Badge>
                  </div>
                )}

                {/* Progress Bar for Processing */}
                {image.status === 'processing' && (
                  <div className="absolute inset-x-0 bottom-0 z-10">
                    <div className="w-full bg-background/80 h-1">
                      <div
                        className="bg-primary h-full transition-all duration-500 ease-out"
                        style={{ width: `${image.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredImages.length === 0 && images.length === 0 && (
          <div className="text-center py-16 px-6">
            <div className="max-w-sm mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No images uploaded</h3>
              <p className="text-muted-foreground">
                Upload images to start batch annotation
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};