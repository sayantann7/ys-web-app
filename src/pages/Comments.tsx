import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  X
} from 'lucide-react';

const Comments = () => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [documentId, setDocumentId] = useState('');
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (documentId.trim()) {
      loadComments();
    } else {
      setComments([]);
    }
  }, [documentId]);

  const loadComments = async () => {
    if (!documentId.trim()) return;
    
    try {
      setLoading(true);
      const response = await apiService.getComments(documentId);
      setComments(response.comments || []);
    } catch (error) {
      toast({
        title: "Error loading comments",
        description: "Failed to load comments for this document",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addComment = async () => {
    if (!newComment.trim() || !documentId.trim() || !user?.email) return;
    
    try {
      const response = await apiService.addComment(user.email, documentId, newComment);
      setComments(prev => [...prev, response.comment]);
      setNewComment('');
      
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

  const saveEdit = async (commentId: string) => {
    if (!editText.trim()) return;
    
    try {
      const response = await apiService.updateComment(documentId, editText);
      setComments(prev => 
        prev.map(c => c.id === commentId ? { ...c, content: editText, updatedAt: new Date().toISOString() } : c)
      );
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

  const deleteComment = async (comment: Comment) => {
    try {
      await apiService.deleteComment(documentId, comment.content);
      setComments(prev => prev.filter(c => c.id !== comment.id));
      
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

  const filteredComments = comments.filter(comment =>
    comment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comment.user.fullname.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Comments</h1>
        <p className="text-muted-foreground">
          Manage document comments and discussions
        </p>
      </div>

      {/* Document Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Select Document
          </CardTitle>
          <CardDescription>
            Enter the document ID to view and manage comments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              placeholder="Enter document ID (e.g., folder/filename.pdf)"
              value={documentId}
              onChange={(e) => setDocumentId(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={loadComments} 
              disabled={!documentId.trim() || loading}
            >
              {loading ? "Loading..." : "Load Comments"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {documentId && (
        <>
          {/* Search Comments */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search comments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Add New Comment */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="h-5 w-5 mr-2" />
                Add Comment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  placeholder="Write your comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />
                <Button 
                  onClick={addComment} 
                  disabled={!newComment.trim() || !user?.email}
                  className="w-full sm:w-auto"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Post Comment
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Comments List */}
          <div className="space-y-4">
            {filteredComments.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    {comments.length === 0 ? "No comments yet" : "No matching comments"}
                  </h3>
                  <p className="text-muted-foreground">
                    {comments.length === 0 
                      ? "Be the first to comment on this document"
                      : `No comments match "${searchTerm}"`
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredComments.map((comment) => (
                <Card key={comment.id}>
                  <CardContent className="p-4">
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
                          <Button size="sm" onClick={() => saveEdit(comment.id)}>
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
                                onClick={() => deleteComment(comment)}
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
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Comments;