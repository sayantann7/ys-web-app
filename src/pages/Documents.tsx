import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { 
  Folder, 
  File, 
  Upload, 
  Download, 
  Plus, 
  ArrowLeft,
  Search,
  FolderPlus,
  Eye,
  X,
  ExternalLink
} from 'lucide-react';

interface DocumentItem {
  name: string;
  type: 'folder' | 'file';
  key: string;
}

const Documents = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [pathSegments, setPathSegments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<{
    name: string;
    key: string;
    url: string;
  } | null>(null);
  const [documentLoading, setDocumentLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadDocuments();
  }, [currentPath]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await apiService.listFolders(currentPath);
      
      // Debug logging
      console.log('API Response:', response);
      console.log('API Response type:', typeof response);
      console.log('API Response keys:', response ? Object.keys(response) : 'No response');
      
      // Ensure response has the expected structure
      if (!response || typeof response !== 'object') {
        console.error('Invalid response structure:', response);
        throw new Error('Invalid response structure');
      }
      
      // Ensure folders and files are arrays, default to empty arrays if not
      let folders = [];
      let files = [];
      
      if (Array.isArray(response.folders)) {
        folders = response.folders;
      } else if (response.folders) {
        console.warn('Folders is not an array:', response.folders);
        folders = [];
      }
      
      if (Array.isArray(response.files)) {
        files = response.files;
      } else if (response.files) {
        console.warn('Files is not an array:', response.files);
        files = [];
      }
      
      console.log('Folders:', folders);
      console.log('Files:', files);
      console.log('Folders type check:', Array.isArray(folders), folders);
      console.log('Files type check:', Array.isArray(files), files);
      
      const documentItems: DocumentItem[] = [
        ...folders.map((folder, index) => {
          console.log(`Folder ${index}:`, folder, typeof folder);
          console.log(`Folder ${index} keys:`, typeof folder === 'object' && folder ? Object.keys(folder) : 'N/A');
          
          // Handle both string and object cases with better extraction
          let folderName = '';
          let folderKey = '';
          
          if (typeof folder === 'string') {
            folderName = folder;
            folderKey = folder;
          } else if (folder && typeof folder === 'object') {
            // Try different possible property names for the display name
            folderName = (folder as any)?.name || 
                        (folder as any)?.Key || 
                        (folder as any)?.key || 
                        (folder as any)?.fileName || 
                        (folder as any)?.folderName ||
                        (folder as any)?.Prefix ||
                        (folder as any)?.prefix;
            
            // For the key, use the full path if available
            folderKey = (folder as any)?.Key || 
                       (folder as any)?.key || 
                       (folder as any)?.Prefix ||
                       (folder as any)?.prefix ||
                       folderName;
            
            // If still no valid name found, try to extract from the object
            if (!folderName) {
              const keys = Object.keys(folder);
              if (keys.length > 0) {
                folderName = (folder as any)[keys[0]];
                folderKey = folderName;
              }
            }
            
            // Extract just the folder name from the full path for display
            if (folderName && folderName.includes('/')) {
              folderName = folderName.split('/').pop() || folderName;
            }
            
            // Last resort - convert to string but avoid [object Object]
            if (!folderName || typeof folderName !== 'string') {
              folderName = `folder_${index}`;
              folderKey = folderName;
            }
          } else {
            folderName = `unknown_folder_${index}`;
            folderKey = folderName;
          }
          
          console.log(`Extracted folder name: "${folderName}", key: "${folderKey}"`);
          
          return {
            name: folderName,
            type: 'folder' as const,
            key: folderKey
          };
        }),
        ...files.map((file, index) => {
          console.log(`File ${index}:`, file, typeof file);
          console.log(`File ${index} keys:`, typeof file === 'object' && file ? Object.keys(file) : 'N/A');
          
          // Handle both string and object cases with better extraction
          let fileName = '';
          let fileKey = '';
          
          if (typeof file === 'string') {
            fileName = file;
            fileKey = file;
          } else if (file && typeof file === 'object') {
            // Try different possible property names for the display name
            fileName = (file as any)?.name || 
                      (file as any)?.Key || 
                      (file as any)?.key || 
                      (file as any)?.fileName || 
                      (file as any)?.filename ||
                      (file as any)?.Prefix ||
                      (file as any)?.prefix;
            
            // For the key, use the full path if available
            fileKey = (file as any)?.Key || 
                     (file as any)?.key || 
                     (file as any)?.Prefix ||
                     (file as any)?.prefix ||
                     fileName;
            
            // If still no valid name found, try to extract from the object
            if (!fileName) {
              const keys = Object.keys(file);
              if (keys.length > 0) {
                fileName = (file as any)[keys[0]];
                fileKey = fileName;
              }
            }
            
            // Extract just the file name from the full path for display
            if (fileName && fileName.includes('/')) {
              fileName = fileName.split('/').pop() || fileName;
            }
            
            // Last resort - convert to string but avoid [object Object]
            if (!fileName || typeof fileName !== 'string') {
              fileName = `file_${index}`;
              fileKey = fileName;
            }
          } else {
            fileName = `unknown_file_${index}`;
            fileKey = fileName;
          }
          
          console.log(`Extracted file name: "${fileName}", key: "${fileKey}"`);
          
          return {
            name: fileName,
            type: 'file' as const,
            key: fileKey
          };
        })
      ];
      
      console.log('Document Items:', documentItems);
      
      // Validate the document items before setting
      const validDocumentItems = documentItems.filter(item => {
        const isValid = item && 
          typeof item.name === 'string' && 
          item.name.length > 0 &&
          !item.name.includes('[object Object]') &&
          (item.type === 'folder' || item.type === 'file') &&
          typeof item.key === 'string';
        
        if (!isValid) {
          console.warn('Invalid document item:', item);
        }
        
        return isValid;
      });
      
      console.log('Valid Document Items:', validDocumentItems);
      setDocuments(validDocumentItems);
    } catch (error) {
      console.error('Error loading documents:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Set empty array on error to prevent crashes
      setDocuments([]);
      
      toast({
        title: "Error loading documents",
        description: "Failed to load documents from the server",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const navigateToFolder = (folderKey: string) => {
    setCurrentPath(folderKey);
    setPathSegments(folderKey.split('/').filter(Boolean));
  };

  const navigateUp = () => {
    const newSegments = pathSegments.slice(0, -1);
    setPathSegments(newSegments);
    setCurrentPath(newSegments.join('/'));
  };

  const navigateToRoot = () => {
    setCurrentPath('');
    setPathSegments([]);
  };

  const handleDownload = async (fileKey: string) => {
    try {
      const response = await apiService.getFileUrl(fileKey);
      
      // Track document view
      if (user?.email) {
        await apiService.documentViewed(user.email, fileKey);
        await apiService.addRecentDocument(user.email, fileKey);
      }
      
      window.open(response.url, '_blank');
      
      toast({
        title: "Download started",
        description: `Opening ${fileKey.split('/').pop()}`
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to generate download link",
        variant: "destructive"
      });
    }
  };

  const handleViewDocument = async (fileKey: string) => {
    try {
      setDocumentLoading(true);
      const response = await apiService.getFileUrl(fileKey);
      
      // Track document view
      if (user?.email) {
        await apiService.documentViewed(user.email, fileKey);
        await apiService.addRecentDocument(user.email, fileKey);
      }
      
      setViewingDocument({
        name: fileKey.split('/').pop() || fileKey,
        key: fileKey,
        url: response.url
      });
      
      toast({
        title: "Document loaded",
        description: `Viewing ${fileKey.split('/').pop()}`
      });
    } catch (error) {
      toast({
        title: "View failed",
        description: "Failed to load document for viewing",
        variant: "destructive"
      });
    } finally {
      setDocumentLoading(false);
    }
  };

  const getFileExtension = (filename: string): string => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  const isViewableFile = (filename: string): boolean => {
    const ext = getFileExtension(filename);
    const viewableExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'txt', 'md', 'html', 'htm'];
    return viewableExtensions.includes(ext);
  };

  const renderDocumentViewer = () => {
    if (!viewingDocument) return null;

    const extension = getFileExtension(viewingDocument.name);
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(extension);
    const isPDF = extension === 'pdf';
    const isText = ['txt', 'md'].includes(extension);
    const isHTML = ['html', 'htm'].includes(extension);

    return (
      <div className="w-full h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="text-lg font-medium">{viewingDocument.name}</h3>
            <p className="text-sm text-muted-foreground">{viewingDocument.key}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(viewingDocument.url, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Open in New Tab
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewingDocument(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden">
          {isPDF && (
            <iframe
              src={viewingDocument.url}
              className="w-full h-full border-0"
              title={viewingDocument.name}
            />
          )}
          
          {isImage && (
            <div className="w-full h-full flex items-center justify-center p-4">
              <img
                src={viewingDocument.url}
                alt={viewingDocument.name}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          )}
          
          {(isText || isHTML) && (
            <iframe
              src={viewingDocument.url}
              className="w-full h-full border-0"
              title={viewingDocument.name}
            />
          )}
          
          {!isPDF && !isImage && !isText && !isHTML && (
            <div className="w-full h-full flex items-center justify-center p-8">
              <div className="text-center">
                <File className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Preview not available
                </h3>
                <p className="text-muted-foreground mb-4">
                  This file type cannot be previewed directly in the browser.
                </p>
                <Button
                  onClick={() => window.open(viewingDocument.url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in New Tab
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleUpload = async (fileKey: string) => {
    try {
      const response = await apiService.getUploadUrl(fileKey);
      
      toast({
        title: "Upload URL generated",
        description: "Copy the URL to upload your file",
      });
      
      // In a real implementation, you'd show a file picker and upload interface
      console.log('Upload URL:', response.url);
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to generate upload link",
        variant: "destructive"
      });
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    
    try {
      await apiService.createFolder(newFolderName, currentPath || undefined);
      setNewFolderName('');
      setShowCreateFolder(false);
      loadDocuments();
      
      toast({
        title: "Folder created",
        description: `Successfully created folder "${newFolderName}"`
      });
    } catch (error) {
      toast({
        title: "Failed to create folder",
        description: "Could not create the folder",
        variant: "destructive"
      });
    }
  };

  const filteredDocuments = Array.isArray(documents) 
    ? documents.filter(doc => {
        // Additional safety checks
        if (!doc || typeof doc !== 'object') return false;
        if (!doc.name || typeof doc.name !== 'string' || doc.name.length === 0) return false;
        if (!doc.type || (doc.type !== 'folder' && doc.type !== 'file')) return false;
        if (!doc.key || typeof doc.key !== 'string') return false;
        
        // Ensure the name is actually a string and not [object Object]
        if (doc.name.includes('[object Object]')) {
          console.warn('Document has invalid name:', doc);
          return false;
        }
        
        // Search filter - make sure doc.name is actually a string
        try {
          return doc.name.toLowerCase().includes(searchTerm.toLowerCase());
        } catch (error) {
          console.error('Error filtering document:', doc, error);
          return false;
        }
      })
    : [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Documents</h1>
        <p className="text-muted-foreground">
          Browse and manage your document repository
        </p>
      </div>

      {/* Navigation Bar */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {pathSegments.length > 0 && (
                <Button variant="ghost" size="sm" onClick={navigateUp}>
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={navigateToRoot}>
                Root
              </Button>
              {pathSegments.map((segment, index) => (
                <React.Fragment key={index}>
                  <span className="text-muted-foreground">/</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateToFolder(pathSegments.slice(0, index + 1).join('/'))}
                  >
                    {segment}
                  </Button>
                </React.Fragment>
              ))}
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateFolder(!showCreateFolder)}
              >
                <FolderPlus className="h-4 w-4 mr-1" />
                New Folder
              </Button>
            </div>
          </div>
          
          {showCreateFolder && (
            <div className="mt-4 flex items-center space-x-2">
              <Input
                placeholder="Folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="max-w-xs"
              />
              <Button onClick={createFolder} size="sm">
                Create
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowCreateFolder(false)}
              >
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search Bar */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.isArray(filteredDocuments) && filteredDocuments.length > 0 && filteredDocuments.map((doc) => {
          // Additional safety check for each document
          if (!doc || typeof doc !== 'object' || !doc.name || !doc.type || !doc.key) {
            console.warn('Skipping invalid document:', doc);
            return null;
          }
          
          return (
            <Card key={doc.key} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  {doc.type === 'folder' ? (
                    <Folder className="h-8 w-8 text-primary" />
                  ) : (
                    <File className="h-8 w-8 text-muted-foreground" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {doc.name}
                    </p>
                    <Badge variant="secondary" className="mt-1">
                      {doc.type}
                    </Badge>
                  </div>
                </div>
                
                <Separator className="my-3" />
                
                <div className="flex space-x-2">
                  {doc.type === 'folder' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateToFolder(doc.key)}
                      className="flex-1"
                    >
                      <Folder className="h-4 w-4 mr-1" />
                      Open
                    </Button>
                  ) : (
                    <>
                      {isViewableFile(doc.name) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDocument(doc.key)}
                          disabled={documentLoading}
                          className="flex-1"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          {documentLoading ? 'Loading...' : 'View'}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(doc.key)}
                        className="flex-1"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredDocuments.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <File className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No documents found
            </h3>
            <p className="text-muted-foreground">
              {searchTerm 
                ? `No documents match "${searchTerm}"`
                : "This folder is empty"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Document Viewer Modal */}
      <Dialog open={!!viewingDocument} onOpenChange={() => setViewingDocument(null)}>
        <DialogContent className="max-w-7xl max-h-[90vh] w-[95vw] h-[85vh] p-0">
          {renderDocumentViewer()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Documents;