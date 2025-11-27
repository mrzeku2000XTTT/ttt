import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Heart, MessageCircle, ArrowLeft, UserPlus, UserMinus, Flame } from "lucide-react";
import { format } from "date-fns";
import { createPageUrl } from "@/utils";

export default function TTTProfilePage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [reels, setReels] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      // Get current user (optional, don't fail if not logged in)
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (err) {
        console.log('User not logged in - viewing as guest');
        setCurrentUser(null);
      }

      // Get profile username from URL hash parameters
      const fullHash = window.location.hash;
      const queryString = fullHash.includes('?') ? fullHash.split('?')[1] : '';
      const urlParams = new URLSearchParams(queryString);
      const username = urlParams.get('user');
      
      if (!username) {
        window.location.href = createPageUrl('Feed');
        return;
      }

      // Load posts by this user (publicly readable)
      const userPosts = await base44.entities.Post.filter({
        author_name: username
      }, '-created_date', 100);

      setPosts(userPosts.filter(p => !p.parent_post_id));

      // Load reels by this user (publicly readable)
      try {
        const userReels = await base44.entities.ProofOfBullish.filter({}, '-created_date', 50);
        const filteredReels = userReels.filter(r => 
          (r.kasware_address && userPosts[0]?.author_wallet_address === r.kasware_address)
        );
        setReels(filteredReels);
      } catch (err) {
        console.log('No reels found');
        setReels([]);
      }

      // Get profile user info from first post
      if (userPosts.length > 0) {
        setProfileUser({
          username: userPosts[0].author_name,
          wallet_address: userPosts[0].author_wallet_address,
          agent_zk_id: userPosts[0].author_agent_zk_id
        });

        // Load followers/following (publicly readable)
        try {
          const followersList = await base44.entities.TTTFollow.filter({
            following_wallet: userPosts[0].author_wallet_address
          });
          setFollowers(followersList);

          const followingList = await base44.entities.TTTFollow.filter({
            follower_wallet: userPosts[0].author_wallet_address
          });
          setFollowing(followingList);

          // Check if current user is following
          if (currentUser?.created_wallet_address) {
            const isFollowingCheck = followersList.some(
              f => f.follower_wallet === currentUser.created_wallet_address
            );
            setIsFollowing(isFollowingCheck);
          }
        } catch (err) {
          console.log('Error loading followers:', err);
        }
      } else {
        setProfileUser({ username });
      }

    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUser?.created_wallet_address) {
      alert('Please create a TTT wallet to follow users');
      return;
    }

    if (!profileUser?.wallet_address) {
      alert('Cannot follow this user');
      return;
    }

    setIsFollowLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        const existingFollow = await base44.entities.TTTFollow.filter({
          follower_wallet: currentUser.created_wallet_address,
          following_wallet: profileUser.wallet_address
        });

        if (existingFollow.length > 0) {
          await base44.entities.TTTFollow.delete(existingFollow[0].id);
        }
        setIsFollowing(false);
      } else {
        // Follow
        await base44.entities.TTTFollow.create({
          follower_wallet: currentUser.created_wallet_address,
          following_wallet: profileUser.wallet_address,
          follower_name: currentUser.username || currentUser.created_wallet_address.slice(0, 8),
          following_name: profileUser.username
        });
        setIsFollowing(true);
      }
      await loadProfile();
    } catch (err) {
      console.error('Failed to follow/unfollow:', err);
    } finally {
      setIsFollowLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="relative z-10 p-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Button
              onClick={() => navigate(createPageUrl('Feed'))}
              variant="ghost"
              size="sm"
              className="text-white/60 hover:text-white mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Feed
            </Button>

            <Card className="bg-white/5 backdrop-blur-xl border-white/10">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border-2 border-cyan-500/30 rounded-full flex items-center justify-center text-2xl font-bold text-white">
                      {profileUser?.username?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-white mb-1">
                        {profileUser?.username || 'Unknown User'}
                      </h1>
                      {profileUser?.agent_zk_id && (
                        <Badge className="bg-white/5 text-white/60 border-white/20 text-xs mb-2">
                          {profileUser.agent_zk_id}
                        </Badge>
                      )}
                      {profileUser?.wallet_address && (
                        <p className="text-xs text-white/40 font-mono">
                          {profileUser.wallet_address.slice(0, 10)}...{profileUser.wallet_address.slice(-8)}
                        </p>
                      )}
                    </div>
                  </div>

                  {currentUser && profileUser?.wallet_address !== currentUser.created_wallet_address && (
                    <Button
                      onClick={handleFollow}
                      disabled={isFollowLoading}
                      size="sm"
                      className={isFollowing 
                        ? "bg-white/10 border border-white/20 text-white hover:bg-white/20"
                        : "bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600"
                      }
                    >
                      {isFollowLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : isFollowing ? (
                        <>
                          <UserMinus className="w-4 h-4 mr-2" />
                          Unfollow
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Follow
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {/* Stats */}
                <div className="flex gap-6 pt-4 border-t border-white/10">
                  <div className="text-center">
                    <div className="text-xl font-bold text-white">{posts.length}</div>
                    <div className="text-xs text-white/60">Posts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-white">{followers.length}</div>
                    <div className="text-xs text-white/60">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-white">{following.length}</div>
                    <div className="text-xs text-white/60">Following</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-white">{reels.length}</div>
                    <div className="text-xs text-white/60">Reels</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <Button
              onClick={() => setActiveTab('posts')}
              variant={activeTab === 'posts' ? 'default' : 'ghost'}
              className={activeTab === 'posts' 
                ? 'bg-white text-black hover:bg-white/90' 
                : 'text-white/60 hover:text-white'
              }
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Posts
            </Button>
            <Button
              onClick={() => setActiveTab('reels')}
              variant={activeTab === 'reels' ? 'default' : 'ghost'}
              className={activeTab === 'reels' 
                ? 'bg-white text-black hover:bg-white/90' 
                : 'text-white/60 hover:text-white'
              }
            >
              <Flame className="w-4 h-4 mr-2" />
              Reels
            </Button>
          </div>

          {/* Content */}
          {activeTab === 'posts' && (
            <div className="space-y-4">
              {posts.length === 0 ? (
                <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                  <CardContent className="p-12 text-center">
                    <MessageCircle className="w-12 h-12 text-white/20 mx-auto mb-4" />
                    <p className="text-white/40">No posts yet</p>
                  </CardContent>
                </Card>
              ) : (
                posts.map((post) => (
                  <Card key={post.id} className="bg-white/5 backdrop-blur-xl border-white/10">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-10 h-10 bg-white/10 border border-white/20 rounded-full flex items-center justify-center text-sm font-bold text-white">
                          {post.author_name[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="text-white font-semibold">{post.author_name}</div>
                          <div className="text-xs text-white/40">
                            {format(new Date(post.created_date), 'MMM d, yyyy HH:mm')} UTC
                          </div>
                        </div>
                      </div>

                      <p className="text-white mb-4 whitespace-pre-wrap">{post.content}</p>

                      {post.media_files && post.media_files.length > 0 && (
                        <div className="mb-4">
                          {post.media_files.map((media, idx) => (
                            <div key={idx}>
                              {media.type === 'image' && (
                                <img src={media.url} alt="Post media" className="w-full max-h-96 object-contain rounded-lg border border-white/10 bg-black" />
                              )}
                              {media.type === 'video' && (
                                <video src={media.url} controls className="w-full max-h-96 rounded-lg border border-white/10 bg-black" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-6 pt-4 border-t border-white/10">
                        <div className="flex items-center gap-2 text-white/60">
                          <Heart className="w-5 h-5" />
                          <span className="text-sm">{post.likes || 0}</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/60">
                          <MessageCircle className="w-5 h-5" />
                          <span className="text-sm">{post.comments_count || 0}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {activeTab === 'reels' && (
            <div className="space-y-4">
              {reels.length === 0 ? (
                <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                  <CardContent className="p-12 text-center">
                    <Flame className="w-12 h-12 text-white/20 mx-auto mb-4" />
                    <p className="text-white/40">No reels yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {reels.map((reel) => (
                    <Card key={reel.id} className="bg-white/5 backdrop-blur-xl border-white/10 overflow-hidden">
                      <CardContent className="p-0">
                        {reel.media_type === 'video' ? (
                          <video
                            src={reel.media_url}
                            className="w-full aspect-[9/16] object-cover"
                            controls
                          />
                        ) : (
                          <img
                            src={reel.media_url}
                            alt="Reel"
                            className="w-full aspect-[9/16] object-cover"
                          />
                        )}
                        {reel.message && (
                          <div className="p-3">
                            <p className="text-white text-sm line-clamp-2">{reel.message}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}