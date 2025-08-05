import { BatchProgress as BatchProgressType } from "../types/batch";
import { Progress } from "./ui/progress";
import { CheckCircle, AlertCircle, Loader2, Clock } from "lucide-react";

interface BatchProgressProps {
  progress: BatchProgressType;
  isProcessing: boolean;
}

export const BatchProgress = ({ progress, isProcessing }: BatchProgressProps) => {
  if (!isProcessing && progress.total === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Progress Card */}
      <div className="relative bg-card border border-border rounded-lg shadow-xl p-6 mx-4 min-w-80 max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Processing Images</h3>
          {isProcessing && (
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          )}
        </div>

        <Progress value={progress.percentage} className="mb-4 h-3" />

        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success" />
              <span className="text-muted-foreground">Completed</span>
            </div>
            <span className="font-medium text-foreground">{progress.completed}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">Processing</span>
            </div>
            <span className="font-medium text-foreground">{progress.processing}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-destructive" />
              <span className="text-muted-foreground">Failed</span>
            </div>
            <span className="font-medium text-foreground">{progress.failed}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 flex items-center justify-center">
                <div className="w-2 h-2 bg-muted-foreground rounded-full" />
              </div>
              <span className="text-muted-foreground">Total</span>
            </div>
            <span className="font-medium text-foreground">{progress.total}</span>
          </div>
        </div>

        <div className="text-center">
          <div className="text-sm font-medium text-foreground">
            {progress.percentage.toFixed(1)}% Complete
          </div>
          {isProcessing && (
            <div className="text-xs text-muted-foreground mt-1">
              Processing your images, please wait...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};