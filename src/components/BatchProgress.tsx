import { BatchProgress as BatchProgressType } from "../types/batch";
import { Progress } from "./ui/progress";
import { CheckCircle, AlertCircle, Loader2, Clock } from "lucide-react";

interface BatchProgressProps {
  progress: BatchProgressType;
  isProcessing: boolean;
}

export const BatchProgress = ({ progress, isProcessing }: BatchProgressProps) => {
  return (
    <div className="p-4 bg-card border border-border rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-foreground">Batch Progress</h3>
        {isProcessing && (
          <Loader2 className="w-4 h-4 text-primary animate-spin" />
        )}
      </div>

      <Progress value={progress.percentage} className="mb-4" />

      <div className="grid grid-cols-4 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-muted-foreground rounded-full" />
          <span className="text-muted-foreground">Total</span>
          <span className="font-medium text-foreground">{progress.total}</span>
        </div>

        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-success" />
          <span className="text-muted-foreground">Done</span>
          <span className="font-medium text-foreground">{progress.completed}</span>
        </div>

        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-primary" />
          <span className="text-muted-foreground">Processing</span>
          <span className="font-medium text-foreground">{progress.processing}</span>
        </div>

        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-destructive" />
          <span className="text-muted-foreground">Failed</span>
          <span className="font-medium text-foreground">{progress.failed}</span>
        </div>
      </div>

      <div className="mt-3 text-xs text-muted-foreground">
        {progress.percentage.toFixed(1)}% complete
        {isProcessing && " - Processing images..."}
      </div>
    </div>
  );
};