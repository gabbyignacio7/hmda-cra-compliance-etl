import { useState, useCallback, useRef } from 'react';
import { Upload, FileText, X, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface MultiFileUploadProps {
  label: string;
  description?: string;
  accept?: Record<string, string[]>;
  onFilesSelect: (files: File[]) => void;
  files: File[];
  onRemoveFile: (index: number) => void;
}

export function MultiFileUpload({
  label,
  description,
  accept,
  onFilesSelect,
  files,
  onRemoveFile,
}: MultiFileUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const newFiles = Array.from(e.dataTransfer.files);
        onFilesSelect(newFiles);
      }
    },
    [onFilesSelect]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      onFilesSelect(newFiles);
    }
  };

  const onButtonClick = () => {
    inputRef.current?.click();
  };

  const acceptString = accept
    ? Object.values(accept).flat().join(',')
    : '.xlsx,.xls,.csv,.txt,.pdf';

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-foreground">{label}</label>
        {files.length > 0 && (
          <span className="text-xs text-green-600 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> {files.length} file{files.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer flex flex-col items-center justify-center text-center min-h-[120px]',
          isDragActive ? 'border-primary bg-primary/5' : 'border-border bg-card hover:bg-accent/50',
          files.length > 0 ? 'border-green-200 bg-green-50/30' : ''
        )}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={handleChange}
          accept={acceptString}
          multiple
        />

        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
            <Upload className="w-5 h-5" />
          </div>
          <p className="text-sm text-muted-foreground">
            {isDragActive
              ? 'Drop files here...'
              : description || 'Drag & drop multiple files or click to upload'}
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-white border rounded-lg px-3 py-2 hover:bg-slate-50 transition-colors"
              data-testid={`file-item-${index}`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-8 h-8 rounded bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={e => {
                  e.stopPropagation();
                  onRemoveFile(index);
                }}
                className="shrink-0"
                data-testid={`button-remove-${index}`}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
