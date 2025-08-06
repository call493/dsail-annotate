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
    <div className="h-full flex flex-col bg-card">
      {/* Enhanced Search Header */}
      <div className="p-6 border-b border-border bg-gradient-to-r from-card to-muted/30">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search images by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 h-11 bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary transition-all duration-200"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-sm font-medium text-foreground">
                {filteredImages.length} of {images.length} images
              </div>
              {filteredImages.length !== images.length && (
                <Badge variant="outline" className="text-xs">
                  Filtered
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-primary">{selectedCount}</span> selected
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg bg-background/50 border border-border/50">
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
                  className="h-7 px-2 text-xs font-medium hover:bg-primary/10 transition-colors"
                >
                  {allSelected ? "Deselect All" : "Select All"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Image Grid */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {filteredImages.map((image) => (
            <div
              key={image.id}
              onClick={() => onImageSelect(image.id)}
              className={cn(
                "group relative cursor-pointer rounded-xl border-2 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1",
                "bg-card backdrop-blur-sm overflow-hidden",
                currentImageId === image.id
                  ? "border-primary ring-4 ring-primary/20 shadow-lg shadow-primary/20"
                  : "border-border/60 hover:border-primary/70",
                image.selected && "ring-2 ring-accent/30"
              )}
            >
              {/* Image Thumbnail with Enhanced Overlay */}
              <div className="aspect-square overflow-hidden bg-gradient-to-br from-muted/50 to-muted relative">
                <img
                  src={image.url}
                  alt={image.name}
                  className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Selection Checkbox */}
                <div className="absolute top-3 left-3 z-10">
                  <Checkbox
                    checked={image.selected}
                    onCheckedChange={() => onImageToggleSelection(image.id)}
                    className={cn(
                      "bg-background/90 backdrop-blur-sm border-2 shadow-lg transition-all duration-200",
                      "hover:bg-background hover:scale-110",
                      image.selected && "border-primary"
                    )}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                
                {/* Current Image Indicator */}
                {currentImageId === image.id && (
                  <div className="absolute top-3 right-3 z-10">
                    <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-lg ring-2 ring-background">
                      <CheckCircle className="w-4 h-4 text-primary-foreground" />
                    </div>
                  </div>
                )}
              </div>

              {/* Enhanced Image Info */}
              <div className="p-4 space-y-3 bg-card/95 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-background/50">
                      {getStatusIcon(image.status)}
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs font-medium border-0 px-2 py-0.5",
                          getStatusColor(image.status)
                        )}
                      >
                        {image.status}
                      </Badge>
                    </div>
                  </div>
                  {image.annotations.length > 0 && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary">
                      <span className="text-xs font-medium">
                        {image.annotations.length}
                      </span>
                      <span className="text-xs opacity-75">
                        {image.annotations.length === 1 ? 'object' : 'objects'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div 
                    className="text-sm font-medium text-foreground truncate leading-tight" 
                    title={image.name}
                  >
                    {image.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {(image.size / 1024 / 1024).toFixed(1)} MB
                  </div>
                </div>

                {/* Enhanced Progress Bar for Processing */}
                {image.status === 'processing' && (
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Processing...</span>
                      <span className="text-xs font-medium text-primary">{image.progress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-primary to-primary-hover h-full rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${image.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredImages.length === 0 && searchTerm && (
          <div className="text-center py-16 px-6">
            <div className="max-w-sm mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                <Search className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No images found</h3>
              <p className="text-muted-foreground">
                No images match your search for <span className="font-medium text-foreground">"{searchTerm}"</span>
              </p>
            </div>
          </div>
        )}
        
        {filteredImages.length === 0 && !searchTerm && images.length === 0 && (
          <div className="text-center py-16 px-6">
            <div className="max-w-sm mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                <Search className="w-8 h-8 text-muted-foreground/50" />
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