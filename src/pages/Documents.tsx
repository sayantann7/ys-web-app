import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
  ExternalLink,
  MoreVertical,
  Trash2,
  Bookmark,
  BookmarkCheck,
  Image
} from 'lucide-react';

interface DocumentItem {
  name: string;
  type: 'folder' | 'file';
  key: string;
  isBookmarked?: boolean;
  iconUrl?: string;
}

const Documents = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [pathSegments, setPathSegments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderIcon, setNewFolderIcon] = useState<File | null>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<{
    name: string;
    key: string;
    url: string;
  } | null>(null);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [uploadingFolder, setUploadingFolder] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadDocuments();
  }, [currentPath]);

  const formatDisplayName = (name: string): string => {
    // Remove trailing slash if it exists
    let formatted = name.replace(/\/$/, '');
    
    // Split by hyphens and underscores, then capitalize each word
    formatted = formatted
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    return formatted;
  };

  const loadFolderIcons = async (documentItems: DocumentItem[]) => {
    const folders = documentItems.filter(item => item.type === 'folder');
    console.log('loadFolderIcons called with folders:', folders);
    
    // Add a small delay to ensure documents are rendered before loading icons
    await new Promise(resolve => setTimeout(resolve, 500));
    
    for (const folder of folders) {
      try {
        console.log('Processing folder:', folder.key, 'currentPath:', currentPath);
        
        // Based on the S3 screenshot, the icon is stored as "vrseSha_icon.jpeg"
        // This suggests the backend might be using the original folder name, not the formatted one
        // Try multiple path variations to find the correct one
        const pathVariations = [
          folder.key, // Just the folder name
          `${folder.key}/`, // Folder name with trailing slash
          currentPath ? `${currentPath}/${folder.key}/` : `${folder.key}/`, // Full path
          currentPath ? `${currentPath}${folder.key}/` : `${folder.key}/`, // Full path without separator
          // Try with the formatted name converted back to original
          folder.name.toLowerCase().replace(/\s+/g, ''), // Remove spaces and lowercase
          folder.name.toLowerCase().replace(/\s+/g, '') + '/', // With trailing slash
        ];
        
        console.log('Trying path variations for folder:', folder.key, pathVariations);
        
        let iconFound = false;
        for (const folderPath of pathVariations) {
          try {
            console.log(`Trying icon path: ${folderPath}`);
            const iconResponse = await apiService.getFolderIcon(folderPath);
            console.log(`Icon response for path ${folderPath}:`, iconResponse);
            
            if (iconResponse && iconResponse.iconUrl) {
              console.log(`Found icon for folder ${folder.key} at path ${folderPath}: ${iconResponse.iconUrl}`);
              setDocuments(prevDocs => {
                const updatedDocs = prevDocs.map(doc => 
                  doc.key === folder.key && doc.type === 'folder'
                    ? { ...doc, iconUrl: iconResponse.iconUrl }
                    : doc
                );
                console.log('Updated documents with icon for folder:', folder.key);
                return updatedDocs;
              });
              iconFound = true;
              break;
            }
          } catch (pathError) {
            console.log(`Path ${folderPath} failed:`, pathError);
          }
        }
        
        if (!iconFound) {
          console.log(`No icon found for folder ${folder.key} with any path variation`);
        }
        
      } catch (error) {
        console.error(`Error loading icon for folder ${folder.key}:`, error);
      }
    }
  };

  // Manual refresh function for debugging
  const refreshIcons = async () => {
    console.log('Manually refreshing icons...');
    console.log('Current documents:', documents);
    
    // Try to load icon for the specific folder we can see in the screenshot
    const vrseShaFolder = documents.find(doc => doc.type === 'folder' && doc.key.toLowerCase().includes('vrse5ha'));
    if (vrseShaFolder) {
      console.log('Found vrseSha folder:', vrseShaFolder);
      
      // Try the exact path that would match the S3 object
      const testPaths = [
        'vrseSha/',
        'Vrse5ha/',
        'vrse5ha/',
        vrseShaFolder.key,
        `${vrseShaFolder.key}/`,
      ];
      
      for (const testPath of testPaths) {
        try {
          console.log(`Testing path: ${testPath}`);
          const iconResponse = await apiService.getFolderIcon(testPath);
          console.log(`Response for ${testPath}:`, iconResponse);
          
          if (iconResponse && iconResponse.iconUrl) {
            console.log(`SUCCESS! Found icon at path: ${testPath}`);
            setDocuments(prevDocs => 
              prevDocs.map(doc => 
                doc.key === vrseShaFolder.key && doc.type === 'folder'
                  ? { ...doc, iconUrl: iconResponse.iconUrl }
                  : doc
              )
            );
            break;
          }
        } catch (error) {
          console.log(`Failed for path ${testPath}:`, error);
        }
      }
    }
    
    await loadFolderIcons(documents);
  };

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
        ...folders
          .filter(folder => {
            // Filter out the icons folder
            if (typeof folder === 'string') {
              return !folder.toLowerCase().includes('icons');
            } else if (folder && typeof folder === 'object') {
              const folderName = (folder as any)?.name || 
                              (folder as any)?.Key || 
                              (folder as any)?.key || 
                              (folder as any)?.Prefix ||
                              (folder as any)?.prefix || '';
              return !folderName.toLowerCase().includes('icons');
            }
            return true;
          })
          .map((folder, index) => {
            console.log(`Folder ${index}:`, folder, typeof folder);
            console.log(`Folder ${index} keys:`, typeof folder === 'object' && folder ? Object.keys(folder) : 'N/A');
            
            // Handle both string and object cases with better extraction
            let folderName = '';
            let folderKey = '';
            let isBookmarked = false;
            
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
              
              // Get bookmark status from API response
              isBookmarked = (folder as any)?.isBookmarked || false;
              
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
              name: formatDisplayName(folderName),
              type: 'folder' as const,
              key: folderKey,
              isBookmarked: isBookmarked,
              iconUrl: undefined // Will be loaded separately
            };
          }),
        ...files.map((file, index) => {
          console.log(`File ${index}:`, file, typeof file);
          console.log(`File ${index} keys:`, typeof file === 'object' && file ? Object.keys(file) : 'N/A');
          
          // Handle both string and object cases with better extraction
          let fileName = '';
          let fileKey = '';
          let isBookmarked = false;
          
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
            
            // Get bookmark status from API response
            isBookmarked = (file as any)?.isBookmarked || false;
            
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
            name: formatDisplayName(fileName),
            type: 'file' as const,
            key: fileKey,
            isBookmarked: isBookmarked,
            iconUrl: undefined
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
      
      // Load folder icons after setting documents
      loadFolderIcons(validDocumentItems);
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
    
    setUploadingFolder(true);
    
    try {
      // Create the folder first
      await apiService.createFolder(newFolderName, currentPath || undefined);
      
      // If an icon was selected, upload it
      if (newFolderIcon) {
        const folderPath = currentPath ? `${currentPath}/${newFolderName}/` : `${newFolderName}/`;
        console.log('Creating folder with path for icon:', folderPath);
        await apiService.uploadFolderIcon(newFolderIcon, folderPath);
      }
      
      setNewFolderName('');
      setNewFolderIcon(null);
      setShowCreateFolder(false);
      
      // Reload documents to include the new folder
      await loadDocuments();
      
      toast({
        title: "Folder created",
        description: `Successfully created folder "${newFolderName}"${newFolderIcon ? ' with icon' : ''}`
      });
    } catch (error) {
      console.error('Error creating folder:', error);
      toast({
        title: "Failed to create folder",
        description: "Could not create the folder",
        variant: "destructive"
      });
    } finally {
      setUploadingFolder(false);
    }
  };

  const handleBookmark = async (docKey: string, docName: string) => {
    try {
      // Find the document in the current state
      const docIndex = documents.findIndex(doc => doc.key === docKey);
      if (docIndex === -1) return;
      
      const currentDoc = documents[docIndex];
      const isCurrentlyBookmarked = currentDoc.isBookmarked;
      
      // Update the local state optimistically
      const updatedDocuments = [...documents];
      updatedDocuments[docIndex] = {
        ...currentDoc,
        isBookmarked: !isCurrentlyBookmarked
      };
      setDocuments(updatedDocuments);
      
      // Make API call to update bookmark
      try {
        if (!isCurrentlyBookmarked) {
          // Determine item type based on document type
          const itemType = currentDoc.type === 'folder' ? 'folder' : 'document';
          await apiService.addBookmark(docKey, itemType, docName);
        } else {
          await apiService.removeBookmark(docKey);
        }
        
        toast({
          title: isCurrentlyBookmarked ? "Removed bookmark" : "Added bookmark",
          description: `${docName} ${isCurrentlyBookmarked ? 'removed from' : 'added to'} bookmarks`
        });
      } catch (apiError) {
        // Revert the optimistic update if API call fails
        const revertedDocuments = [...documents];
        revertedDocuments[docIndex] = {
          ...currentDoc,
          isBookmarked: isCurrentlyBookmarked
        };
        setDocuments(revertedDocuments);
        
        throw apiError;
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      toast({
        title: "Bookmark error",
        description: "Failed to update bookmark",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (docKey: string, docName: string) => {
    if (!confirm(`Are you sure you want to delete "${docName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      console.log('Deleting file with key:', docKey);
      
      // Call the API to delete the document from the backend
      await apiService.deleteDocument(docKey);
      
      // Update local state only after successful deletion
      const updatedDocuments = documents.filter(doc => doc.key !== docKey);
      setDocuments(updatedDocuments);
      
      toast({
        title: "Document deleted",
        description: `Successfully deleted "${docName}"`
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Delete failed",
        description: "Failed to delete the document from the server",
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
                    {formatDisplayName(segment)}
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
              {/* Debug button for icon refresh */}
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshIcons}
                className="text-xs"
              >
                Refresh Icons
              </Button>
            </div>
          </div>
          
          {showCreateFolder && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Folder name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="max-w-xs"
                />
                <Button onClick={createFolder} size="sm" disabled={uploadingFolder}>
                  {uploadingFolder ? 'Creating...' : 'Create'}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setShowCreateFolder(false);
                    setNewFolderName('');
                    setNewFolderIcon(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Optional: Choose folder icon
                </label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    setNewFolderIcon(file || null);
                  }}
                  className="max-w-xs"
                />
                {newFolderIcon && (
                  <span className="text-sm text-green-600">
                    Icon selected: {newFolderIcon.name}
                  </span>
                )}
              </div>
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
            <Card key={doc.key} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {doc.type === 'folder' ? (
                      doc.iconUrl ? (
                        <img 
                          src={doc.iconUrl} 
                          alt="Folder icon" 
                          className="h-8 w-8 object-cover rounded"
                          onError={(e) => {
                            console.error('Failed to load folder icon:', doc.iconUrl);
                            // Fallback to default folder icon
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                          onLoad={() => {
                            console.log('Successfully loaded folder icon:', doc.iconUrl);
                          }}
                        />
                      ) : (
                        <Folder className="h-8 w-8 text-primary" />
                      )
                    ) : (
                      <File className="h-8 w-8 text-muted-foreground" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">
                          {doc.name}
                        </p>
                        {doc.isBookmarked && (
                          <BookmarkCheck className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                      <Badge variant="secondary" className="mt-1">
                        {doc.type}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Three-dotted menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBookmark(doc.key, doc.name);
                        }}
                      >
                        {doc.isBookmarked ? (
                          <>
                            <BookmarkCheck className="h-4 w-4 mr-2" />
                            Remove bookmark
                          </>
                        ) : (
                          <>
                            <Bookmark className="h-4 w-4 mr-2" />
                            Add bookmark
                          </>
                        )}
                      </DropdownMenuItem>
                      {user?.role === 'admin' && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(doc.key, doc.name);
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
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