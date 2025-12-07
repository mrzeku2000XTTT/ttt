import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Heart, Reply, Trash2, DollarSign, Upload, X, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function DAGCommentSection({ postId, onClose }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [user, setUser] = useState(null);
  const [kaswareWallet, setKaswareWallet] = useState({ connected: false, address: null });
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadData();
    checkKasware();
  }, [postId]);

  const checkKasware = async () => {
    if (typeof window.kasware !== 'undefined') {
      try {
        const accounts = await window.kasware.getAccounts();
        if (accounts.length > 0) {
          setKaswareWallet({ connected: true, address: accounts[0] });
        }
      } catch (err) {
        console.log('Kasware not connected');
      }
    }
  };

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const allComments = await base44.entities.DAGComment.filter({ post_id: postId });
      setComments(allComments);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setIsUploadingFile(true);
    try {
      const uploads = await Promise.all(
        files.map(async (file) => {
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          return { url: file_url, type: file.type.startsWith('image/') ? 'image' : 'file', name: file.name };
        })
      );
      setUploadedFiles([...uploadedFiles, ...uploads]);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handlePaste = async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          setIsUploadingFile(true);
          try {
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            setUploadedFiles([...uploadedFiles, { url: file_url, type: 'image', name: file.name }]);
          } catch (err) {
            console.error('Paste upload failed:', err);
          } finally {
            setIsUploadingFile(false);
          }
        }
      }
    }
  };

  const handleComment = async () => {
    if (!newComment.trim() && uploadedFiles.length === 0) return;

    let walletAddress = kaswareWallet.address || user?.created_wallet_address || '';
    const authorName = user?.username || `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;

    setIsSending(true);
    try {
      const commentData = {
        post_id: postId,
        content: newComment.trim(),
        author_name: authorName,
        author_wallet_address: walletAddress,
        author_role: user?.role || 'user',
        likes: 0,
        replies_count: 0,
        tips_received: 0
      };

      if (replyTo) {
        commentData.parent_comment_id = replyTo.id;
      }

      if (uploadedFiles.length > 0) {
        commentData.media_files = uploadedFiles;
      }

      await base44.entities.DAGComment.create(commentData);

      // Update comment count on post
      const post = await base44.entities.DAGPost.filter({ id: postId });
      if (post.length > 0) {
        await base44.entities.DAGPost.update(postId, {
          comments_count: (post[0].comments_count || 0) + 1
        });
      }

      setNewComment("");
      setReplyTo(null);
      setUploadedFiles([]);
      await loadData();
    } catch (err) {
      console.error('Failed to comment:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleLike = async (comment) => {
    const newLikes = (comment.likes || 0) + 1;
    try {
      await base44.entities.DAGComment.update(comment.id, { likes: newLikes });
      setComments(comments.map(c => c.id === comment.id ? { ...c, likes: newLikes } : c));
    } catch (err) {
      console.error('Failed to like:', err);
    }
  };

  const handleDelete = async (commentId) => {
    if (!confirm('Delete this comment?')) return;
    try {
      await base44.entities.DAGComment.delete(commentId);
      await loadData();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const getMainComments = () => {
    return comments.filter(c => !c.parent_comment_id);
  };

  const getReplies = (commentId) => {
    return comments.filter(c => c.parent_comment_id === commentId);
  };

  const renderComment = (comment, isReply = false) => {
    const isMyComment = comment.created_by === user?.email;
    const replies = getReplies(comment.id);

    return (
      <div key={comment.id} className={`${isReply ? 'ml-8 mt-2' : 'mt-4'}`}>
        <div className="bg-white/5 border border-white/10 rounded-lg p-3">
          <div className="flex items-start justify-between mb-2">
            <div className="flex gap-2">
              <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-xs font-bold">
                {comment.author_name[0].toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm font-semibold">{comment.author_name}</span>
                  {comment.author_role === 'admin' && (
                    <Badge className="bg-cyan-500/20 text-cyan-400 text-[10px] px-1.5 py-0">ADMIN</Badge>
                  )}
                </div>
                <div className="text-xs text-white/40">
                  {format(new Date(comment.created_date), 'MMM d, HH:mm')}
                </div>
              </div>
            </div>
            {isMyComment && (
              <Button
                onClick={() => handleDelete(comment.id)}
                variant="ghost"
                size="sm"
                className="text-red-400/60 hover:text-red-400 h-6 w-6 p-0"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>

          <p className="text-white text-sm mb-2 whitespace-pre-wrap">{comment.content}</p>

          {comment.media_files && comment.media_files.length > 0 && (
            <div className="mb-2">
              {comment.media_files.map((file, idx) => (
                <img key={idx} src={file.url} alt="" className="max-h-48 rounded" />
              ))}
            </div>
          )}

          <div className="flex items-center gap-4 pt-2 border-t border-white/5">
            <Button
              onClick={() => handleLike(comment)}
              variant="ghost"
              size="sm"
              className="text-white/40 hover:text-red-400 h-auto p-0"
            >
              <Heart className="w-4 h-4 mr-1" />
              <span className="text-xs">{comment.likes || 0}</span>
            </Button>

            <Button
              onClick={() => setReplyTo(comment)}
              variant="ghost"
              size="sm"
              className="text-white/40 hover:text-white h-auto p-0"
            >
              <Reply className="w-4 h-4 mr-1" />
              <span className="text-xs">Reply</span>
            </Button>

            {comment.tips_received > 0 && (
              <div className="text-xs text-yellow-400 flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                {comment.tips_received.toFixed(2)} KAS
              </div>
            )}
          </div>
        </div>

        {replies.map(reply => renderComment(reply, true))}
      </div>
    );
  };

  const mainComments = getMainComments();

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[999] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-black border border-white/20 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-white/20 flex items-center justify-between">
          <h3 className="text-white font-bold">Comments ({comments.length})</h3>
          <Button onClick={onClose} variant="ghost" size="sm" className="text-white/60 hover:text-white">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          ) : mainComments.length === 0 ? (
            <div className="text-center py-12 text-white/40">No comments yet</div>
          ) : (
            mainComments.map(comment => renderComment(comment))
          )}
        </div>

        <div className="p-4 border-t border-white/20">
          {replyTo && (
            <div className="mb-2 bg-white/5 border border-white/10 rounded-lg p-2 flex items-center justify-between">
              <span className="text-xs text-white/60">Replying to {replyTo.author_name}</span>
              <Button onClick={() => setReplyTo(null)} variant="ghost" size="sm" className="h-6 text-white/40">
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}

          {uploadedFiles.length > 0 && (
            <div className="mb-2 flex gap-2">
              {uploadedFiles.map((file, idx) => (
                <div key={idx} className="relative">
                  <img src={file.url} alt="" className="h-16 rounded" />
                  <button
                    onClick={() => setUploadedFiles(uploadedFiles.filter((_, i) => i !== idx))}
                    className="absolute -top-1 -right-1 bg-black rounded-full p-0.5"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingFile}
              variant="outline"
              size="sm"
              className="bg-white/5 border-white/10 text-white h-10 w-10 p-0"
            >
              {isUploadingFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            </Button>

            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onPaste={handlePaste}
              placeholder="Write a comment..."
              className="flex-1 bg-white/5 border-white/10 text-white resize-none h-10 min-h-0"
            />

            <Button
              onClick={handleComment}
              disabled={isSending || (!newComment.trim() && uploadedFiles.length === 0)}
              className="bg-white text-black hover:bg-white/90 h-10"
            >
              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}