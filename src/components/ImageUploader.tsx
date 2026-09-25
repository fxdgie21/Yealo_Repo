import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  RefreshCw,
  Camera,
  FolderOpen,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { processAndCompressImage, formatFileSize, ProcessedImageResult } from '../lib/imageUpload';

interface ImageUploaderProps {
  value: string;
  onChange: (dataUrl: string) => void;
  label?: string;
  helperText?: string;
  required?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  label = 'Product Image (Upload from Device)',
  helperText = 'Select a photo directly from your computer, phone gallery, or camera',
  required = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [metaInfo, setMetaInfo] = useState<{ size?: string; dimensions?: string; name?: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, WebP, GIF, or HEIC).');
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
      console.error('Image upload processing error:', err);
      setErrorMessage(err.message || 'Failed to process image from device');
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

  // Support clipboard paste (e.g. screenshot paste directly from clipboard)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
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

  const isDataUrl = value?.startsWith('data:image/');

  return (
    <div className="space-y-2">
      {/* Label */}
      <div className="flex items-center justify-between">
        <label className="block text-slate-900 font-black text-xs">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        <span className="text-[10px] font-black uppercase text-amber-900 bg-amber-200/70 px-2 py-0.5 rounded-md">
          Direct Device File
        </span>
      </div>

      {/* Native file inputs (Device storage & Mobile camera) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/avif,image/heic,image/*"
        className="hidden"
        onChange={onFileInputChange}
      />
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

      {/* Main Direct Device Upload Dropzone */}
      <div
        ref={dropzoneRef}
        tabIndex={0}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative rounded-2xl border-2 border-dashed transition-all p-4 text-center cursor-pointer outline-none ${
          isDragging
            ? 'border-amber-500 bg-amber-100/90 ring-4 ring-amber-300 scale-[1.01]'
            : isProcessing
            ? 'border-slate-300 bg-slate-50 opacity-80'
            : 'border-amber-400 bg-amber-50/70 hover:bg-amber-100/70 hover:border-amber-500'
        }`}
      >
        {isProcessing ? (
          <div className="py-6 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-7 h-7 text-amber-600 animate-spin" />
            <p className="text-xs font-black text-slate-800">Processing image from device...</p>
            <p className="text-[10px] text-slate-500 font-medium">Compressing for instant database saving</p>
          </div>
        ) : value ? (
          /* Image Preview & Device File Metadata */
          <div className="flex flex-col sm:flex-row items-center gap-4 text-left">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-slate-900 border-2 border-amber-400 shadow-md shrink-0 group">
              <img
                src={value}
                alt="Product preview from device"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-black uppercase text-amber-300">
                <FolderOpen className="w-4 h-4 mb-0.5" />
                <span>Replace</span>
              </div>
            </div>

            <div className="flex-1 min-w-0 space-y-1.5 w-full">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border border-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {isDataUrl ? 'Uploaded from Device' : 'Image Selected'}
                </span>
                {metaInfo?.size && (
                  <span className="px-2 py-0.5 rounded-md bg-white border border-amber-200 text-slate-700 text-[10px] font-bold">
                    {metaInfo.size}
                  </span>
                )}
                {metaInfo?.dimensions && (
                  <span className="px-2 py-0.5 rounded-md bg-white border border-amber-200 text-slate-700 text-[10px] font-bold">
                    {metaInfo.dimensions}
                  </span>
                )}
              </div>

              <p className="text-xs font-black text-slate-900 truncate">
                {metaInfo?.name || 'Selected product image'}
              </p>
              <p className="text-[11px] text-slate-600 font-medium">
                Image loaded from device. Ready to be saved to product catalog.
              </p>

              <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-[#111827] hover:bg-black text-[#FED74C] font-black text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  Choose Another Photo
                </button>
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs sm:hidden flex items-center gap-1 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Camera
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Empty State - Big Device File Upload Prompt */
          <div className="py-6 px-3 flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-200/80 text-amber-900 flex items-center justify-center mb-3 shadow-xs">
              <Upload className="w-7 h-7 stroke-[2.5]" />
            </div>

            <p className="text-sm font-black text-slate-900">
              Upload Image Directly from Device
            </p>
            <p className="text-xs text-slate-600 mt-1 max-w-sm font-medium">
              Click below to pick a photo from your computer, phone gallery, or drag and drop any image file here
            </p>

            <div className="mt-3.5 flex items-center gap-2.5" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl bg-[#111827] text-[#FED74C] hover:bg-black font-black text-xs flex items-center gap-2 shadow-sm cursor-pointer active:scale-95 transition-all"
              >
                <FolderOpen className="w-4 h-4" />
                Browse Device Files
              </button>
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 font-bold text-xs sm:hidden flex items-center gap-1.5 cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                Take Photo
              </button>
            </div>

            <p className="text-[10px] text-slate-500 mt-2 font-medium">
              Supports JPG, PNG, WebP, GIF, HEIC • Auto-optimized
            </p>
          </div>
        )}
      </div>

      {helperText && (
        <p className="text-[11px] text-slate-500 font-medium">
          {helperText}
        </p>
      )}
    </div>
  );
};
