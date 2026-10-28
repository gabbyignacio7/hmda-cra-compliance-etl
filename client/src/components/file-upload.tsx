import { useState, useCallback, useRef } from 'react';
import { Upload, FileSpreadsheet, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  label: string;
  description?: string;
  accept?: Record<string, string[]>;
  onFileSelect: (file: File) => void;
  file?: File | null;
}

export function FileUpload({ label, description, accept, onFileSelect, file }: FileUploadProps) {
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

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        onFileSelect(e.dataTransfer.files[0]);
      }
    },
    [onFileSelect]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    inputRef.current?.click();
  };

  // Simple accept string for input
  const acceptString = accept
    ? Object.values(accept).flat().join(',')
    : '.xlsx,.xls,.csv,.txt,.pdf';

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-foreground">{label}</label>
        {file && (
          <span className="text-xs text-green-600 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Uploaded
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
          file ? 'border-green-200 bg-green-50/30' : ''
        )}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={handleChange}
          accept={acceptString}
        />

        {file ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-foreground">{file.name}</p>
            <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
              <Upload className="w-5 h-5" />
            </div>
            <p className="text-sm text-muted-foreground">
              {isDragActive ? 'Drop file here...' : description || 'Drag & drop or click to upload'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
