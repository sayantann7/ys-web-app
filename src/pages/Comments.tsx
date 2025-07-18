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
  ExternalLink
} from 'lucide-react';

const Comments = () => {
  const [commentsByDocument, setCommentsByDocument] = useState<{ [documentId: string]: Comment[] }>({});
  const [expandedDocuments, setExpandedDocuments] = useState<Set<string>>(new Set());
  const [newComment, setNewComment] = useState('');
  const [newCommentDocument, setNewCommentDocument] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddComment, setShowAddComment] = useState(false);
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
      setCommentsByDocument(response.commentsByDocument || {});
      
      // Expand all documents by default
      const documentIds = Object.keys(response.commentsByDocument || {});
      setExpandedDocuments(new Set(documentIds));
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

  const addComment = async () => {
    if (!newComment.trim() || !newCommentDocument.trim() || !user?.email) return;
    
    try {
      const response = await apiService.addComment(user.email, newCommentDocument, newComment);
      
      // Update local state
      setCommentsByDocument(prev => ({
        ...prev,
        [newCommentDocument]: [...(prev[newCommentDocument] || []), response.comment]
      }));
      
      // Expand the document if it's not already expanded
      setExpandedDocuments(prev => new Set([...prev, newCommentDocument]));
      
      setNewComment('');
      setNewCommentDocument('');
      setShowAddComment(false);
      
      toast({
        title: "Comment added",
        description: "Your comment has been added successfully"
      });
    } catch (error) {
      toast({
        title: "Failed to add comment",
        description: "Could not add your comment",
        variant: "destructive"
      });
    }
  };

  const startEdit = (comment: Comment) => {
    setEditingComment(comment.id);
    setEditText(comment.content);
  };

  const cancelEdit = () => {
    setEditingComment(null);
    setEditText('');
  };

  const saveEdit = async (commentId: string, documentId: string) => {
    if (!editText.trim()) return;
    
    try {
      await apiService.updateComment(documentId, editText);
      
      // Update local state
      setCommentsByDocument(prev => ({
        ...prev,
        [documentId]: prev[documentId].map(c => 
          c.id === commentId ? { ...c, content: editText, updatedAt: new Date().toISOString() } : c
        )
      }));
      
      setEditingComment(null);
      setEditText('');
      
      toast({
        title: "Comment updated",
        description: "Your comment has been updated successfully"
      });
    } catch (error) {
      toast({
        title: "Failed to update comment",
        description: "Could not update your comment",
        variant: "destructive"
      });
    }
  };

  const deleteComment = async (comment: Comment, documentId: string) => {
    try {
      await apiService.deleteComment(documentId, comment.content);
      
      // Update local state
      setCommentsByDocument(prev => ({
        ...prev,
        [documentId]: prev[documentId].filter(c => c.id !== comment.id)
      }));
      
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

  const toggleDocument = (documentId: string) => {
    setExpandedDocuments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(documentId)) {
        newSet.delete(documentId);
      } else {
        newSet.add(documentId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDocumentName = (documentId: string) => {
    const parts = documentId.split('/');
    return parts[parts.length - 1] || documentId;
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
  const filteredCommentsByDocument = Object.entries(commentsByDocument).reduce((acc, [documentId, comments]) => {
    const filteredComments = comments.filter(comment =>
      comment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.user.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      documentId.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (filteredComments.length > 0) {
      acc[documentId] = filteredComments;
    }
    
    return acc;
  }, {} as { [documentId: string]: Comment[] });

  const totalComments = Object.values(commentsByDocument).reduce((sum, comments) => sum + comments.length, 0);

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
          Manage document comments and discussions ({totalComments} comments across {Object.keys(commentsByDocument).length} documents)
        </p>
      </div>

      {/* Search and Add Comment Actions */}
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
        
        <Button
          onClick={() => setShowAddComment(!showAddComment)}
          className="sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Comment
        </Button>
      </div>

      {/* Add New Comment Form */}
      {showAddComment && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="h-5 w-5 mr-2" />
              Add New Comment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                placeholder="Document ID (e.g., folder/filename.pdf)"
                value={newCommentDocument}
                onChange={(e) => setNewCommentDocument(e.target.value)}
              />
              <Textarea
                placeholder="Write your comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
              />
              <div className="flex space-x-2">
                <Button 
                  onClick={addComment} 
                  disabled={!newComment.trim() || !newCommentDocument.trim() || !user?.email}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Post Comment
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setShowAddComment(false);
                    setNewComment('');
                    setNewCommentDocument('');
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comments by Document */}
      <div className="space-y-4">
        {Object.keys(filteredCommentsByDocument).length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {totalComments === 0 ? "No comments yet" : "No matching comments"}
              </h3>
              <p className="text-muted-foreground">
                {totalComments === 0 
                  ? "Be the first to comment on a document"
                  : `No comments match "${searchTerm}"`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(filteredCommentsByDocument).map(([documentId, comments]) => (
            <Card key={documentId}>
              <CardHeader 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleDocument(documentId)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {expandedDocuments.has(documentId) ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-lg">{formatDocumentName(documentId)}</CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">
                        {documentId} • {comments.length} comment{comments.length !== 1 ? 's' : ''}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDocument(documentId);
                      }}
                      disabled={documentLoading}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Badge variant="secondary">
                      {comments.length}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              {expandedDocuments.has(documentId) && (
                <CardContent>
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-primary-foreground">
                                {comment.user.fullname.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-foreground">
                                {comment.user.fullname}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {comment.user.email}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary" className="text-xs">
                              {formatDate(comment.createdAt)}
                            </Badge>
                            {comment.updatedAt !== comment.createdAt && (
                              <Badge variant="outline" className="text-xs">
                                Edited
                              </Badge>
                            )}
                          </div>
                        </div>

                        {editingComment === comment.id ? (
                          <div className="space-y-3">
                            <Textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              rows={3}
                            />
                            <div className="flex space-x-2">
                              <Button size="sm" onClick={() => saveEdit(comment.id, documentId)}>
                                <Save className="h-4 w-4 mr-1" />
                                Save
                              </Button>
                              <Button size="sm" variant="outline" onClick={cancelEdit}>
                                <X className="h-4 w-4 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-foreground mb-3 whitespace-pre-wrap">
                              {comment.content}
                            </p>
                            
                            {user?.email === comment.user.email && (
                              <>
                                <Separator className="mb-3" />
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => startEdit(comment)}
                                  >
                                    <Edit2 className="h-4 w-4 mr-1" />
                                    Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => deleteComment(comment, documentId)}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Delete
                                  </Button>
                                </div>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
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