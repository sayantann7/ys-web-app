import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Comment } from '@/types';
import { 
  MessageSquare, 
  Send, 
  Edit2, 
  Trash2, 
  Search,
  FileText,
  Plus,
  Save,
  X,
  Folder,
  ChevronDown,
  ChevronRight,
  Eye,
  ExternalLink,
  File
} from 'lucide-react';

// Extended comment interface for this page
interface CommentWithDocument extends Comment {
  documentName: string;
}

const Comments = () => {
  const [allComments, setAllComments] = useState<CommentWithDocument[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [viewingDocument, setViewingDocument] = useState<{
    name: string;
    key: string;
    url: string;
  } | null>(null);
  const [documentLoading, setDocumentLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadAllComments();
  }, []);

  const loadAllComments = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAllComments();
      
      // Flatten all comments into a single array with document info
      const commentsArray: CommentWithDocument[] = [];
      Object.entries(response.commentsByDocument || {}).forEach(([documentId, comments]) => {
        comments.forEach(comment => {
          commentsArray.push({
            ...comment,
            documentId,
            documentName: formatDocumentName(documentId)
          });
        });
      });
      
      // Sort comments by creation date (newest first)
      commentsArray.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setAllComments(commentsArray);
    } catch (error) {
      toast({
        title: "Error loading comments",
        description: "Failed to load comments",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addReply = async (parentCommentId: string, documentId: string) => {
    if (!replyText.trim() || !user?.email) return;
    
    try {
      const response = await apiService.addComment(user.email, documentId, replyText);
      
      // Add the new reply to the comments list
      const newReply: CommentWithDocument = {
        ...response.comment,
        documentId,
        documentName: formatDocumentName(documentId)
      };
      
      setAllComments(prev => [newReply, ...prev]);
      setReplyText('');
      setReplyingTo(null);
      
      toast({
        title: "Reply added",
        description: "Your reply has been added successfully"
      });
    } catch (error) {
      toast({
        title: "Failed to add reply",
        description: "Could not add your reply",
        variant: "destructive"
      });
    }
  };

  const deleteComment = async (comment: CommentWithDocument) => {
    try {
      await apiService.deleteComment(comment.documentId, comment.content);
      
      // Update local state
      setAllComments(prev => prev.filter(c => c.id !== comment.id));
      
      toast({
        title: "Comment deleted",
        description: "Your comment has been deleted successfully"
      });
    } catch (error) {
      toast({
        title: "Failed to delete comment",
        description: "Could not delete your comment",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDocumentName = (documentId: string) => {
    const parts = documentId.split('/');
    return parts[parts.length - 1] || documentId;
  };

  const getDocumentType = (documentId: string): 'file' | 'folder' => {
    // If it ends with /, it's likely a folder
    if (documentId.endsWith('/')) return 'folder';
    
    // If it has a file extension, it's likely a file
    const fileName = formatDocumentName(documentId);
    if (fileName.includes('.')) return 'file';
    
    // Default to file
    return 'file';
  };

  const getDocumentIcon = (documentId: string) => {
    const type = getDocumentType(documentId);
    return type === 'folder' ? <Folder className="h-5 w-5 text-primary" /> : <File className="h-5 w-5 text-muted-foreground" />;
  };

  const handleViewDocument = async (documentId: string) => {
    try {
      setDocumentLoading(true);
      const response = await apiService.getFileUrl(documentId);
      
      // Track document view
      if (user?.email) {
        await apiService.documentViewed(user.email, documentId);
        await apiService.addRecentDocument(user.email, documentId);
      }
      
      setViewingDocument({
        name: formatDocumentName(documentId),
        key: documentId,
        url: response.url
      });
      
      toast({
        title: "Document loaded",
        description: `Viewing ${formatDocumentName(documentId)}`
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
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
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

  // Filter comments based on search term
  const filteredComments = allComments.filter(comment =>
    comment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comment.user.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comment.documentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalComments = allComments.length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Comments</h1>
        <p className="text-muted-foreground">
          Manage document comments and discussions ({totalComments} total comments)
        </p>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Card className="flex-1">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search comments, users, or documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {filteredComments.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {totalComments === 0 ? "No comments yet" : "No matching comments"}
              </h3>
              <p className="text-muted-foreground">
                {totalComments === 0 
                  ? "Comments will appear here when users start commenting on documents"
                  : `No comments match "${searchTerm}"`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredComments.map((comment) => (
            <Card key={comment.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-foreground">
                        {comment.user?.fullname?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="font-medium text-foreground">
                          {comment.user?.fullname || 'Unknown User'}
                        </p>
                        <Badge variant="secondary" className="text-xs">
                          {formatDate(comment.createdAt)}
                        </Badge>
                        {comment.updatedAt !== comment.createdAt && (
                          <Badge variant="outline" className="text-xs">
                            Edited
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 mb-3">
                        {getDocumentIcon(comment.documentId)}
                        <p className="text-sm text-muted-foreground">
                          Commented on: <span className="font-medium">{comment.documentName}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {getDocumentType(comment.documentId) === 'file' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDocument(comment.documentId)}
                        disabled={documentLoading}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Document
                      </Button>
                    )}
                    {user?.email === comment.user?.email && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteComment(comment)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>

                <div className="ml-13">
                  <p className="text-foreground mb-4 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                  
                  {replyingTo === comment.id ? (
                    <div className="mt-4 space-y-3 bg-muted/50 p-4 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-primary-foreground">
                            {user?.fullname?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                        <span className="text-sm font-medium">Reply to {comment.user?.fullname}</span>
                      </div>
                      <Textarea
                        placeholder="Write your reply..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        rows={3}
                        className="bg-background"
                      />
                      <div className="flex space-x-2">
                        <Button 
                          size="sm"
                          onClick={() => addReply(comment.id, comment.documentId)}
                          disabled={!replyText.trim() || !user?.email}
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Post Reply
                        </Button>
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyText('');
                          }}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setReplyingTo(comment.id)}
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Reply
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Document Viewer Modal */}
      <Dialog open={!!viewingDocument} onOpenChange={() => setViewingDocument(null)}>
        <DialogContent className="max-w-7xl max-h-[90vh] w-[95vw] h-[85vh] p-0">
          {renderDocumentViewer()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Comments;