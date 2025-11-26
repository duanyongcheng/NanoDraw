import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useUiStore } from '../store/useUiStore';
import { X, Download, Trash2, ImageIcon } from 'lucide-react';
import { ImageHistoryItem } from '../types';
import { downloadImage } from '../utils/imageUtils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ImageHistoryPanel: React.FC<Props> = ({ isOpen, onClose }) => {
  const { imageHistory, clearImageHistory } = useAppStore();
  const { showDialog, addToast } = useUiStore();
  const [selectedImage, setSelectedImage] = useState<ImageHistoryItem | null>(null);

  const handleDownload = (image: ImageHistoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    downloadImage(image.mimeType, image.base64Data, `image-${image.timestamp}.${image.mimeType.split('/')[1]}`);
    addToast('图片已下载', 'success');
  };

  const handleClearHistory = () => {
    showDialog({
      type: 'confirm',
      title: '清空图片历史',
      message: '确定要清空所有图片历史记录吗?此操作无法撤销。',
      confirmLabel: '清空',
      onConfirm: () => {
        clearImageHistory();
        addToast('图片历史已清空', 'success');
      }
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">图片历史</h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">({imageHistory.length})</span>
          </div>
          <div className="flex items-center gap-2">
            {imageHistory.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition"
                title="清空历史"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {imageHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 dark:text-gray-500">
              <ImageIcon className="h-16 w-16 mb-4 opacity-20" />
              <p className="text-sm">还没有生成过图片</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {imageHistory.map((image) => (
                <div
                  key={image.id}
                  className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 cursor-pointer hover:ring-2 hover:ring-blue-500 transition"
                  onClick={() => setSelectedImage(image)}
                >
                  <img
                    src={`data:${image.mimeType};base64,${image.base64Data}`}
                    alt={image.prompt}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />

                  {/* Download Button */}
                  <button
                    onClick={(e) => handleDownload(image, e)}
                    className="absolute top-2 right-2 p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    title="下载图片"
                  >
                    <Download className="h-4 w-4" />
                  </button>

                  {/* Prompt Preview */}
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-linear-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-xs text-white line-clamp-2">{image.prompt || '无描述'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-60 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col gap-4">
            <img
              src={`data:${selectedImage.mimeType};base64,${selectedImage.base64Data}`}
              alt={selectedImage.prompt}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <div
              className="bg-white/10 backdrop-blur-md rounded-lg p-4 text-white"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-sm mb-2"><strong>提示词:</strong> {selectedImage.prompt || '无描述'}</p>
              <p className="text-xs text-gray-300">
                {new Date(selectedImage.timestamp).toLocaleString()}
                {selectedImage.modelName && ` · ${selectedImage.modelName}`}
              </p>
              <button
                onClick={(e) => {
                  handleDownload(selectedImage, e);
                  setSelectedImage(null);
                }}
                className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition"
              >
                <Download className="h-4 w-4" />
                <span>下载图片</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
