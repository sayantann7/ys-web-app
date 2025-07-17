import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  FolderPlus 
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
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadDocuments();
  }, [currentPath]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await apiService.listFolders(currentPath);
      
      const documentItems: DocumentItem[] = [
        ...response.folders.map(folder => ({
          name: folder,
          type: 'folder' as const,
          key: currentPath ? `${currentPath}/${folder}` : folder
        })),
        ...response.files.map(file => ({
          name: file,
          type: 'file' as const,
          key: currentPath ? `${currentPath}/${file}` : file
        }))
      ];
      
      setDocuments(documentItems);
    } catch (error) {
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

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        {filteredDocuments.map((doc) => (
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(doc.key)}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
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
    </div>
  );
};

export default Documents;