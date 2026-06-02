import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";

const API_BASE = "https://social-media-app-production-ef17.up.railway.app";
const POSTS_PER_PAGE = 5;

export default function Home() {
  const [post, setPost] = useState("");
  const [posts, setPosts] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [commentText, setCommentText] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [followingSet, setFollowingSet] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const username = localStorage.getItem("username");
  const token = localStorage.getItem("token");
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    if (!token) {
      window.location.href = "/login";
    }
  }, [token]);

  const handleUnauthorized = async (res) => {
    if (res.status === 401) {
      alert("Session expired or invalid token. Please login again.");
      localStorage.clear();
      window.location.href = "/login";
      return true;
    }
    return false;
  };

  const getImageUrl = (src) => {
    if (!src) return null;
    return src.startsWith("http") ? src : `${API_BASE}${src}`;
  };

  useEffect(() => {
    const loadFeed = async () => {
      setLoading(true);
      try {
        const [postsRes, usersRes] = await Promise.all([
          fetch(`${API_BASE}/api/posts/all?page=1&limit=${POSTS_PER_PAGE}`),
          fetch(`${API_BASE}/api/users/all`),
        ]);

        const [postsData, usersData] = await Promise.all([postsRes.json(), usersRes.json()]);

        setPosts(postsData);
        setSuggestions(usersData.filter((user) => user.username !== username).slice(0, 6));
        setHasMore(postsData.length === POSTS_PER_PAGE);
        // load who the current user is following so we can show toggle state
        const currentUserId = localStorage.getItem("userId");
        if (currentUserId) {
          try {
            const follRes = await fetch(`${API_BASE}/api/users/following/${currentUserId}`);
            const follList = await follRes.json();
            const ids = new Set(follList.map((f) => f._id || f.id));
            setFollowingSet(ids);
          } catch (e) {
            console.error("Could not load following list", e);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadFeed();
  }, [username]);

  const refreshPost = (updatedPost) => {
    setPosts((prev) => prev.map((item) => (item._id === updatedPost._id ? updatedPost : item)));
  };

  const addPost = async () => {
    if (!token) return alert("Please login to post.");
    if (!post.trim() && !imageFile) return;

    try {
      const formData = new FormData();
      formData.append("caption", post);
      if (imageFile) formData.append("image", imageFile);

      const res = await fetch(`${API_BASE}/api/posts/create`, {
        method: "POST",
        headers: authHeader,
        body: formData,
      });

      const data = await res.json();
      if (await handleUnauthorized(res)) return;
      if (!res.ok) {
        alert(data?.message || data || "Could not create post");
        return;
      }

      setPosts((prev) => [data.post, ...prev]);
      setPost("");
      setImageFile(null);
    } catch (err) {
      console.error(err);
      alert("Post failed. Please try again.");
    }
  };

  const handleLike = async (postId) => {
    if (!token) return alert("Please login to like posts.");
    try {
      const res = await fetch(`${API_BASE}/api/posts/like/${postId}`, {
        method: "PUT",
        headers: authHeader,
      });
      if (await handleUnauthorized(res)) return;
      if (!res.ok) return;
      const data = await res.json();
      refreshPost(data.post);
    } catch (err) {
      console.error(err);
    }
  };

  const handleComment = async (postId) => {
    if (!token) return alert("Please login to comment.");
    const text = commentText[postId]?.trim();
    if (!text) return;

    try {
      const res = await fetch(`${API_BASE}/api/posts/comment/${postId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
        body: JSON.stringify({ text }),
      });
      if (await handleUnauthorized(res)) return;
      if (!res.ok) return;
      const data = await res.json();
      refreshPost(data.post || data);
      setCommentText((prev) => ({ ...prev, [postId]: "" }));
    } catch (err) {
      console.error(err);
    }
  };

  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3200);
  };

  const handleDeleteComment = async (postId, commentId) => {
    if (!token) return alert("Please login to delete comments.");
    try {
      const res = await fetch(`${API_BASE}/api/posts/comment/${postId}/${commentId}`, {
        method: "DELETE",
        headers: authHeader,
      });
      if (await handleUnauthorized(res)) return;
      if (!res.ok) return;
      const data = await res.json();
      refreshPost(data.post);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFollowUser = async (userId) => {
    if (!token) return alert("Please login to follow users.");
    // optimistic update
    setFollowingSet((s) => new Set([...s, userId]));
    setSuggestions((prev) => prev.map((u) => (u._id === userId ? { ...u, followers: (u.followers || 0) + 1 } : u)));
    try {
      const res = await fetch(`${API_BASE}/api/users/follow/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
      });
      if (await handleUnauthorized(res)) return;
      if (!res.ok) {
        // revert optimistic update
        setFollowingSet((s) => {
          const next = new Set(s);
          next.delete(userId);
          return next;
        });
        setSuggestions((prev) => prev.map((u) => (u._id === userId ? { ...u, followers: Math.max((u.followers || 1) - 1, 0) } : u)));
        const data = await res.json();
        notify(data?.message || data || "Could not follow user");
        return;
      }
     notify("Followed successfully!");
    } catch (err) {
      console.error(err);
      // revert optimistic update on error
      setFollowingSet((s) => {
        const next = new Set(s);
        next.delete(userId);
        return next;
      });
      setSuggestions((prev) => prev.map((u) => (u._id === userId ? { ...u, followers: Math.max((u.followers || 1) - 1, 0) } : u)));
      notify("Could not follow user");
    }
  };

  const handleUnfollowUser = async (userId) => {
    if (!token) return alert("Please login to unfollow users.");
    // optimistic update
    const prevFollowing = new Set(followingSet);
    setFollowingSet((s) => {
      const next = new Set(s);
      next.delete(userId);
      return next;
    });
    setSuggestions((prev) => prev.map((u) => (u._id === userId ? { ...u, followers: Math.max((u.followers || 1) - 1, 0) } : u)));
    try {
      const res = await fetch(`${API_BASE}/api/users/unfollow/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
      });
      if (await handleUnauthorized(res)) return;
      if (!res.ok) {
        // revert
        setFollowingSet(prevFollowing);
        setSuggestions((prev) => prev.map((u) => (u._id === userId ? { ...u, followers: (u.followers || 0) + 1 } : u)));
        const data = await res.json();
        notify(data?.message || data || "Could not unfollow user");
        return;
      }
   notify("Unfollowed successfully!");
    } catch (err) {
      console.error(err);
      setFollowingSet(prevFollowing);
      setSuggestions((prev) => prev.map((u) => (u._id === userId ? { ...u, followers: (u.followers || 0) + 1 } : u)));
      notify("Could not unfollow user");
    }
  };

  const loadMore = async () => {
    if (!hasMore) return;
    const nextPage = page + 1;
    try {
      const res = await fetch(`${API_BASE}/api/posts/all?page=${nextPage}&limit=${POSTS_PER_PAGE}`);
      const data = await res.json();
      setPosts((prev) => [...prev, ...data]);
      setPage(nextPage);
      if (!data.length || data.length < POSTS_PER_PAGE) setHasMore(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-3xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-2xl shadow-slate-950/20">
          {toast}
        </div>
      )}
      <div className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-sky-500">VIBEUP</p>
            <h1 className="text-2xl font-semibold text-slate-900">Welcome back, {username || "Friend"}</h1>
          </div>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = "/login";
            }}
            className="rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-rose-200/50 transition hover:bg-rose-600"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)_320px] lg:px-8">
        <Sidebar />

        <main className="space-y-6">
          <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/40">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Create a new post</h2>
                <p className="mt-2 text-sm text-slate-500">Share an update, image, or quick mood with your followers.</p>
              </div>
              <div className="rounded-3xl bg-slate-100 px-4 py-3 text-sm text-slate-600">Logged in as {username}</div>
            </div>

            <div className="mt-6 space-y-4">
              <textarea
                value={post}
                onChange={(e) => setPost(e.target.value)}
                placeholder="Write something inspiring..."
                className="w-full min-h-[140px] rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              />

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600 transition hover:border-slate-400 hover:bg-slate-100">
                  <span>Select image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files[0])}
                    className="hidden"
                  />
                </label>
                <div className="flex flex-1 flex-col gap-2 text-sm text-slate-600 sm:text-right">
                  {imageFile && <span className="text-slate-900">Selected: {imageFile.name}</span>}
                  <button
                    onClick={addPost}
                    className="inline-flex items-center justify-center rounded-3xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-sky-200/50 transition hover:bg-sky-700"
                  >
                    Post update
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4 rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Feed</p>
                <h2 className="text-xl font-semibold text-slate-900">Latest posts</h2>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">{posts.length} posts</span>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <article key={i} className="overflow-hidden rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/30">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-200/70 animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-1/3 rounded bg-slate-200/70 animate-pulse" />
                        <div className="h-2 w-1/4 rounded bg-slate-200/70 animate-pulse" />
                      </div>
                    </div>
                    <div className="mt-4 h-40 w-full rounded bg-slate-200/70 animate-pulse" />
                    <div className="mt-4 flex items-center gap-3">
                      <div className="h-8 w-20 rounded bg-slate-200/70 animate-pulse" />
                      <div className="h-8 w-16 rounded bg-slate-200/70 animate-pulse" />
                    </div>
                  </article>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="rounded-[32px] border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm shadow-slate-200/40">
                <h3 className="text-lg font-semibold text-slate-900">No posts yet</h3>
                <p className="mt-2">Follow suggested accounts or create your first post to populate the feed.</p>
                <div className="mt-4">
                  <button onClick={() => document.querySelector('textarea')?.focus()} className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700">
                    Create a post
                  </button>
                </div>
              </div>
            ) : (
              posts.map((p) => (
                <article key={p._id} className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm shadow-slate-200/40">
                  <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
                    <a href={`/profile?id=${p.user?._id || localStorage.getItem("userId")}`} className="flex items-center gap-3">
                      <img src={getImageUrl(p.user?._id ? `https://i.pravatar.cc/150?u=${p.user._id}` : "/dummy.jpg")} alt="user" className="h-12 w-12 rounded-full object-cover" />
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">{p.user?.username || username}</h3>
                        <p className="text-xs text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</p>
                      </div>
                    </a>
                  </div>

                  <img
                    src={getImageUrl(p.image || `https://picsum.photos/seed/${p._id}/800/400`)}
                    alt="post"
                    className="w-full max-h-[420px] object-cover"
                  />

                  <div className="space-y-4 p-5">
                    <p className="text-sm leading-6 text-slate-700">{p.caption || p.text}</p>

                    <div className="flex flex-wrap items-center gap-3 border-y border-slate-200 py-3 text-sm text-slate-600">
                      <button onClick={() => handleLike(p._id)} className="rounded-full bg-slate-100 px-4 py-2 transition hover:bg-pink-100 hover:text-pink-500">
                        ❤️ {p.likes?.length || 0}
                      </button>
                      <span className="rounded-full bg-slate-100 px-4 py-2">💬 {p.comments?.length || 0}</span>
                    </div>

                    <div className="space-y-3">
                      {p.comments?.length > 0 && (
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                          {p.comments.map((c) => (
                            <div key={c._id || c.text} className="rounded-3xl bg-slate-50 p-3">
                              <div className="flex items-center justify-between gap-3 text-sm">
                                <span className="font-semibold text-slate-900">{c.user?.username || "Anonymous"}</span>
                                {c.user?._id === localStorage.getItem("userId") && (
                                  <button onClick={() => handleDeleteComment(p._id, c._id)} className="text-xs font-semibold text-rose-500 hover:text-rose-700">
                                    Delete
                                  </button>
                                )}
                              </div>
                              <p className="mt-2 text-slate-600">{c.text}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-3">
                        <input
                          value={commentText[p._id] || ""}
                          onChange={(e) => setCommentText((prev) => ({ ...prev, [p._id]: e.target.value }))}
                          placeholder="Write a comment..."
                          className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                        />
                        <button onClick={() => handleComment(p._id)} className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                          Post
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))
            )}

            {hasMore && posts.length > 0 && (
              <div className="text-center">
                <button onClick={loadMore} className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                  Load more
                </button>
              </div>
            )}
          </section>
        </main>

        <aside className="hidden xl:block">
          <div className="space-y-6">
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/40">
              <h2 className="text-lg font-semibold text-slate-900">Suggested accounts</h2>
              <p className="mt-2 text-sm text-slate-500">Follow more people to fill your feed with fresh posts.</p>
              <div className="mt-5 space-y-4">
                {suggestions.map((user) => (
                  <div key={user._id} className="flex items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-3">
                      <a href={`/profile?id=${user._id}`} className="flex items-center gap-3">
                        <img src={`https://i.pravatar.cc/40?u=${user._id}`} alt="avatar" className="h-10 w-10 rounded-full object-cover" />
                        <div>
                          <p className="font-semibold text-slate-900">{user.username}</p>
                          <p className="text-xs text-slate-500">{user.followers || 0} followers</p>
                        </div>
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      {followingSet.has(user._id) ? (
                        <button onClick={() => handleUnfollowUser(user._id)} className="rounded-full bg-white border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-900 transition hover:bg-slate-50">
                          Following
                        </button>
                      ) : (
                        <button onClick={() => handleFollowUser(user._id)} className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800">
                          Follow
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/40">
              <h2 className="text-lg font-semibold text-slate-900">Pro tip</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">Like posts, add comments, and follow more users to keep the feed active and show more content.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
