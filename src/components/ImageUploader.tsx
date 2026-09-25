import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Image as ImageIcon,
  CheckCircle,
  X,
  RefreshCw,
  Camera,
  Link,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { processAndCompressImage, formatFileSize, ProcessedImageResult } from '../lib/imageUpload';

interface ImageUploaderProps {
  value: string;
  onChange: (dataUrlOrUrl: string) => void;
  label?: string;
  helperText?: string;
  required?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  label = 'Product Image',
  helperText = 'Upload directly from your device, drag & drop, or paste from clipboard',
  required = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [metaInfo, setMetaInfo] = useState<{ size?: string; dimensions?: string; name?: string } | null>(null);
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [customUrlInput, setCustomUrlInput] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);

  // Sync initial custom url if value is an external link
  useEffect(() => {
    if (value && (value.startsWith('http://') || value.startsWith('https://'))) {
      setCustomUrlInput(value);
    }
  }, [value]);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please choose a valid image file (PNG, JPG, WebP, etc.)');
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const result: ProcessedImageResult = await processAndCompressImage(file, file.name);
      onChange(result.dataUrl);
      setMetaInfo({
        size: formatFileSize(result.sizeBytes),
        dimensions: `${result.width}×${result.height}`,
        name: file.name,
      });
    } catch (err: any) {
      console.error('Image compression error:', err);
      setErrorMessage(err.message || 'Failed to process image');
      setTimeout(() => setErrorMessage(null), 4000);
    } finally {
      setIsProcessing(false);
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
    // reset input so selecting the same file triggers change
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  // Support clipboard paste (e.g. screenshot paste)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // Only process if user is focused inside or near the dropzone
      if (!dropzoneRef.current?.contains(document.activeElement)) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            handleFile(file);
            e.preventDefault();
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (customUrlInput.trim()) {
      onChange(customUrlInput.trim());
      setMetaInfo({ name: 'Web URL' });
    }
  };

  const isDataUrl = value?.startsWith('data:image/');

  return (
    <div className="space-y-2">
      {/* Label and Mode Switcher */}
      <div className="flex items-center justify-between">
        <label className="block text-slate-800 font-bold text-xs">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        <div className="flex items-center gap-1.5 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
              mode === 'upload'
                ? 'bg-[#111827] text-[#FED74C]'
                : 'text-slate-500 hover:text-slate-900 bg-slate-100'
            }`}
          >
            Direct Upload
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
              mode === 'url'
                ? 'bg-[#111827] text-[#FED74C]'
                : 'text-slate-500 hover:text-slate-900 bg-slate-100'
            }`}
          >
            URL / Presets
          </button>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
        className="hidden"
        onChange={onFileInputChange}
      />
      {/* Hidden camera input for mobile devices */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onFileInputChange}
      />

      {/* ERROR ALERT */}
      {errorMessage && (
        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* MODE 1: DIRECT UPLOAD */}
      {mode === 'upload' && (
        <div className="space-y-2.5">
          {/* Main Dropzone / Upload Box */}
          <div
            ref={dropzoneRef}
            tabIndex={0}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative rounded-2xl border-2 border-dashed transition-all p-3 sm:p-4 text-center cursor-pointer outline-none ${
              isDragging
                ? 'border-amber-500 bg-amber-50/90 ring-4 ring-amber-200 scale-[1.01]'
                : isProcessing
                ? 'border-slate-300 bg-slate-50 opacity-80'
                : 'border-amber-300/90 bg-amber-50/40 hover:bg-amber-50/80 hover:border-amber-400'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            {isProcessing ? (
              <div className="py-4 flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-6 h-6 text-amber-600 animate-spin" />
                <p className="text-xs font-bold text-slate-700">Compressing and optimizing image...</p>
                <p className="text-[10px] text-slate-500">Auto-scaling for instant database performance</p>
              </div>
            ) : value ? (
              /* Image Preview within Dropzone */
              <div className="flex flex-col sm:flex-row items-center gap-3.5 text-left">
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-slate-900 border border-amber-300 shadow-xs shrink-0 group">
                  <img
                    src={value}
                    alt="Product preview"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-bold">
                    Change
                  </div>
                </div>

                <div className="flex-1 min-w-0 space-y-1.5 w-full">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                      {isDataUrl ? 'Direct Upload' : 'Image Ready'}
                    </span>
                    {metaInfo?.size && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                        {metaInfo.size}
                      </span>
                    )}
                    {metaInfo?.dimensions && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                        {metaInfo.dimensions}
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-bold text-slate-800 truncate">
                    {metaInfo?.name || 'Selected product photograph'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Click to choose a different photo, or drag and drop a new image file here.
                  </p>

                  <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1 rounded-lg bg-[#FED74C] hover:bg-[#FDD023] text-[#111827] font-black text-[11px] flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <Upload className="w-3 h-3" />
                      Browse Device
                    </button>
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] sm:hidden flex items-center gap-1 cursor-pointer"
                    >
                      <Camera className="w-3 h-3" />
                      Camera
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Empty Dropzone Call to Action */
              <div className="py-4 px-2 flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-xs font-black text-slate-800">
                  Click to upload image directly from your computer or phone
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                  Supports PNG, JPG, WebP, GIF • Drag & drop or paste directly
                </p>
                <div className="mt-2.5 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1 rounded-xl bg-[#111827] text-[#FED74C] hover:bg-black font-black text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Choose File
                  </button>
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="px-3 py-1 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs sm:hidden flex items-center gap-1.5 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Take Photo
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODE 2: WEB URL OR PRESETS */}
      {mode === 'url' && (
        <div className="space-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              External Image URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://images.unsplash.com/... or /images/..."
                value={customUrlInput}
                onChange={(e) => setCustomUrlInput(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-[#111827]"
              />
              <button
                type="button"
                onClick={handleApplyCustomUrl}
                className="px-3 py-1.5 rounded-xl bg-[#111827] text-[#FED74C] text-xs font-black hover:bg-black shrink-0 cursor-pointer"
              >
                Apply
              </button>
            </div>
          </div>

          <div>
            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Quick Ice Presets:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  onChange('/images/crystal-ice-cubes.jpg');
                  setCustomUrlInput('/images/crystal-ice-cubes.jpg');
                  setMetaInfo({ name: 'Default Cube Ice' });
                }}
                className={`text-[11px] px-2.5 py-1 rounded-lg font-bold border transition-colors flex items-center gap-1 cursor-pointer ${
                  value === '/images/crystal-ice-cubes.jpg'
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Sparkles className="w-3 h-3 text-amber-600" />
                Cubes Photo
              </button>
              <button
                type="button"
                onClick={() => {
                  onChange('/images/pure-tube-ice.jpg');
                  setCustomUrlInput('/images/pure-tube-ice.jpg');
                  setMetaInfo({ name: 'Default Tube Ice' });
                }}
                className={`text-[11px] px-2.5 py-1 rounded-lg font-bold border transition-colors flex items-center gap-1 cursor-pointer ${
                  value === '/images/pure-tube-ice.jpg'
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Sparkles className="w-3 h-3 text-amber-600" />
                Tubes Photo
              </button>
            </div>
          </div>
        </div>
      )}

      {helperText && (
        <p className="text-[10px] text-slate-500 font-medium">
          {helperText}
        </p>
      )}
    </div>
  );
};
