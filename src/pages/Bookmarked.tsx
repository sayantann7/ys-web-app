import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import { 
  Eye, 
  ExternalLink, 
  X, 
  File, 
  Folder, 
  BookmarkX,
  Trash2 
} from 'lucide-react';

interface Bookmark {
  id: string;
  itemId: string;
  itemType: 'document' | 'folder';
  itemName: string;
  createdAt: string;
}

const Bookmarked: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingDocument, setViewingDocument] = useState<{
    name: string;
    key: string;
    url: string;
  } | null>(null);
  const [documentLoading, setDocumentLoading] = useState(false);

  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    try {
      setLoading(true);
      const response = await apiService.getBookmarks();
      setBookmarks(response.bookmarks || []);
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      toast({
        title: "Error loading bookmarks",
        description: "Failed to load bookmarks from the server",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = async (bookmark: Bookmark) => {
    if (bookmark.itemType === 'folder') {
      toast({
        title: "Cannot view folder",
        description: "Folders cannot be viewed directly. Please go to Documents to navigate.",
        variant: "destructive"
      });
      return;
    }

    try {
      setDocumentLoading(true);
      const response = await apiService.getFileUrl(bookmark.itemId);
      
      // Track document view
      if (user?.email) {
        await apiService.documentViewed(user.email, bookmark.itemId);
        await apiService.addRecentDocument(user.email, bookmark.itemId);
      }
      
      setViewingDocument({
        name: bookmark.itemName,
        key: bookmark.itemId,
        url: response.url
      });
      
      toast({
        title: "Document loaded",
        description: `Viewing ${bookmark.itemName}`
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

  const handleRemoveBookmark = async (bookmark: Bookmark) => {
    try {
      await apiService.removeBookmark(bookmark.itemId);
      setBookmarks(bookmarks.filter(b => b.id !== bookmark.id));
      toast({
        title: "Bookmark removed",
        description: `Removed bookmark for ${bookmark.itemName}`
      });
    } catch (error) {
      toast({
        title: "Remove failed",
        description: "Failed to remove bookmark",
        variant: "destructive"
      });
    }
  };

  const getFileExtension = (filename: string): string => {
    return filename.split('.').pop()?.toLowerCase() || '';
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

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-5xl">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Bookmarked Documents</h1>
        <p className="text-muted-foreground">
          View and manage your bookmarked documents and folders
        </p>
      </div>

      {bookmarks.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <File className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No bookmarks yet
            </h3>
            <p className="text-muted-foreground">
              Start bookmarking documents and folders from the Documents page
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bookmarks.map((bookmark) => (
            <Card key={bookmark.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {bookmark.itemType === 'folder' ? (
                      <Folder className="h-8 w-8 text-primary" />
                    ) : (
                      <File className="h-8 w-8 text-muted-foreground" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">
                          {bookmark.itemName}
                        </p>
                      </div>
                      <Badge variant="secondary" className="mt-1">
                        {bookmark.itemType}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        Bookmarked {new Date(bookmark.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveBookmark(bookmark)}
                    className="text-destructive hover:text-destructive"
                  >
                    <BookmarkX className="h-4 w-4" />
                  </Button>
                </div>
                
                <Separator className="my-3" />
                
                <div className="flex space-x-2">
                  {bookmark.itemType === 'document' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDocument(bookmark)}
                      disabled={documentLoading}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      {documentLoading ? 'Loading...' : 'View'}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Navigate to documents page with this folder
                        window.location.href = `/documents?path=${encodeURIComponent(bookmark.itemId)}`;
                      }}
                      className="flex-1"
                    >
                      <Folder className="h-4 w-4 mr-1" />
                      Open Folder
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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

export default Bookmarked; 