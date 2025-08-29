import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useToast } from '../../hooks/use-toast';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/api';
import { Upload, X, FileIcon, FolderIcon, Image } from 'lucide-react';

interface FileUploadModalProps {
  open: boolean;
  onClose: () => void;
  currentPath: string;
  onUploadComplete: () => void;
}

interface FileWithIcon {
  file: File;
  customIcon?: File | null;
}

const FileUploadModal: React.FC<FileUploadModalProps> = ({
  open,
  onClose,
  currentPath,
  onUploadComplete,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<FileWithIcon[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const fileWithIcons = files.map(file => ({ file, customIcon: null }));
    setSelectedFiles(prev => [...prev, ...fileWithIcons]);
  };

  const handleFolderSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const fileWithIcons = files.map(file => ({ file, customIcon: null }));
    setSelectedFiles(prev => [...prev, ...fileWithIcons]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const fileWithIcons = files.map(file => ({ file, customIcon: null }));
    setSelectedFiles(prev => [...prev, ...fileWithIcons]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const setFileIcon = (index: number, iconFile: File | null) => {
    setSelectedFiles(prev => prev.map((item, i) => 
      i === index ? { ...item, customIcon: iconFile } : item
    ));
  };

  const handleIconSelect = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({
          title: "File too large",
          description: "Icon must be less than 2MB",
          variant: "destructive",
        });
        return;
      }
      setFileIcon(index, file);
    }
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    try {
      for (const { file, customIcon } of selectedFiles) {
        // Construct the S3 key
        const prefix = currentPath ? (currentPath.endsWith('/') ? currentPath : `${currentPath}/`) : '';
        const key = `${prefix}${file.name}`;

        // Get signed URL for file upload
  const { url: signedUrl } = await apiService.getUploadUrl(key, file.type || 'application/octet-stream');
        
        // Upload the file
  const uploadResponse = await fetch(signedUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type || 'application/octet-stream',
      // Explicitly allow CORS preflight success with standard headers only; avoid custom headers here.
          },
        });

        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        // Upload custom icon if provided
        if (customIcon) {
          try {
            const extension = customIcon.name.split('.').pop()?.toLowerCase() || 'jpeg';
            const { uploadUrl } = await apiService.getIconUploadUrl(key, extension);
            await fetch(uploadUrl.replace('amazonaws.com//', 'amazonaws.com/'), {
              method: 'PUT',
              body: customIcon,
              headers: { 'Content-Type': customIcon.type },
            });
            console.log('✅ File icon uploaded successfully for:', file.name);
          } catch (iconError) {
            console.error('Failed to upload icon for file:', file.name, iconError);
          }
        }
      }

      // Send notification if admin uploaded files
      if (user?.role === 'admin' && selectedFiles.length > 0) {
        try {
          const folderPath = currentPath || 'Root';
          const fileNames = selectedFiles.map(f => f.file.name).join(', ');
          
      try {
        await apiService.sendUploadNotification(fileNames, folderPath);
      } catch (e) {
        console.warn('Notification request failed (continuing):', e);
      }
          
          console.log('Upload notification sent successfully');
        } catch (notificationError) {
          console.error('Failed to send upload notification:', notificationError);
          toast({
            title: "Upload Complete",
            description: "Files uploaded successfully, but failed to send notifications to users.",
          });
        }
      }

      toast({
        title: "Upload successful",
        description: `${selectedFiles.length} file(s) uploaded successfully`,
      });

      setSelectedFiles([]);
      onUploadComplete();
      onClose();
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An error occurred during upload",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Drag & drop files here, or click to select
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Upload to: {currentPath || 'Root'}
            </p>
            
            <div className="space-y-2">
              <div>
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <Button 
                  variant="outline" 
                  onClick={() => document.getElementById('file-upload')?.click()}
                  className="mr-2"
                >
                  <FileIcon className="mr-2 h-4 w-4" />
                  Select Files
                </Button>
              </div>
              
              <div>
                <input
                  type="file"
                  multiple
                  {...({ webkitdirectory: '' } as any)}
                  onChange={handleFolderSelect}
                  className="hidden"
                  id="folder-upload"
                />
                <Button 
                  variant="outline" 
                  onClick={() => document.getElementById('folder-upload')?.click()}
                >
                  <FolderIcon className="mr-2 h-4 w-4" />
                  Select Folder
                </Button>
              </div>
            </div>
          </div>

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Selected Files ({selectedFiles.length})</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {selectedFiles.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      {item.customIcon ? (
                        <img 
                          src={URL.createObjectURL(item.customIcon)} 
                          alt="Custom icon" 
                          className="h-8 w-8 rounded object-cover"
                        />
                      ) : (
                        <FileIcon className="h-8 w-8 text-gray-400" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {item.file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(item.file.size)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleIconSelect(index, e)}
                          className="hidden"
                          id={`icon-upload-${index}`}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => document.getElementById(`icon-upload-${index}`)?.click()}
                          title="Add custom icon"
                        >
                          <Image className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {item.customIcon && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setFileIcon(index, null)}
                          title="Remove custom icon"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        title="Remove file"
                      >
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Button */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose} disabled={uploading}>
              Cancel
            </Button>
            <Button 
              onClick={uploadFiles} 
              disabled={selectedFiles.length === 0 || uploading}
            >
              {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} file(s)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FileUploadModal;
