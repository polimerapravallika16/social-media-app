import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

export default function Profile() {
  const [data, setData] = useState(null);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [searchParams] = useSearchParams();

  const userId = searchParams.get("id") || localStorage.getItem("userId");
  const currentUserId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
  const [isFollowing, setIsFollowing] = useState(false);
  const [toast] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`http://https://social-media-app-production-ef17.up.railway.app/api/users/${userId}`);
        const userData = await res.json();
        setData(userData);
        setIsOwnProfile(userId === currentUserId);

        const [followersRes, followingRes] = await Promise.all([
          fetch(`http://https://social-media-app-production-ef17.up.railway.app/api/users/followers/${userId}`),
          fetch(`http://https://social-media-app-production-ef17.up.railway.app/api/users/following/${userId}`),
        ]);

        const [followersList, followingList] = await Promise.all([
          followersRes.json(),
          followingRes.json(),
        ]);

        setFollowers(followersList);
        setFollowing(followingList);

        // determine whether current user is following this profile
        if (currentUserId && currentUserId !== userId) {
          try {
            const myFollowingRes = await fetch(`http://https://social-media-app-production-ef17.up.railway.app/api/users/following/${currentUserId}`);
            const myFollowing = await myFollowingRes.json();
            setIsFollowing(myFollowing.some((f) => (f._id || f.id) === userId));
          } catch (e) {
            console.error("Could not load current user's following", e);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchProfile();
  }, [userId, currentUserId]);

  if (!data)
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Loading profile…</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-3xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-2xl shadow-slate-950/20">
          {toast}
        </div>
      )}
      <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-sky-500">VIBEUP</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">Profile</h1>
          </div>
          <div className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700">{data.username}</div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-8">
        <aside className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/40">
          <div className="flex flex-col items-center gap-4 text-center">
            <img src={`https://i.pravatar.cc/180?u=${userId}`} alt="profile" className="h-36 w-36 rounded-full object-cover shadow-lg" />
            <div>
              <p className="text-xl font-semibold text-slate-900">{data.username}</p>
              <p className="text-sm text-slate-500">{isOwnProfile ? "Your profile" : "Social account"}</p>
            </div>
            {!isOwnProfile && (
              <button
                onClick={async () => {
                  if (!token) return alert("Please login to follow users.");
                  // optimistic toggle
                  const prev = isFollowing;
                  setIsFollowing(!prev);
                  if (!prev) {
                    // add current user to followers list
                    setFollowers((f) => [
                      ...f,
                      { _id: currentUserId, username: localStorage.getItem("username") || "You" },
                    ]);
                  } else {
                    setFollowers((f) => f.filter((x) => (x._id || x.id) !== currentUserId));
                  }

                  try {
                    const res = await fetch(`http://https://social-media-app-production-ef17.up.railway.app/api/users/${prev ? 'unfollow' : 'follow'}/${userId}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json", ...authHeader },
                    });
                    if (res.status === 401) {
                      alert("Session expired. Please login again.");
                      localStorage.clear();
                      window.location.href = "/login";
                      return;
                    }
                    if (!res.ok) {
                      // revert
                      setIsFollowing(prev);
                      if (!prev) {
                        setFollowers((f) => f.filter((x) => (x._id || x.id) !== currentUserId));
                      } else {
                        setFollowers((f) => [
                          ...f,
                          { _id: currentUserId, username: localStorage.getItem("username") || "You" },
                        ]);
                      }
                      const data = await res.json();
                      return alert(data?.message || "Could not update follow status");
                    }
                  } catch (e) {
                    console.error(e);
                    // revert on error
                    setIsFollowing(prev);
                    if (!prev) {
                      setFollowers((f) => f.filter((x) => (x._id || x.id) !== currentUserId));
                    } else {
                      setFollowers((f) => [
                        ...f,
                        { _id: currentUserId, username: localStorage.getItem("username") || "You" },
                      ]);
                    }
                    alert("Could not update follow status");
                  }
                }}
                className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                {isFollowing ? "Following" : "Follow"}
              </button>
            )}
          </div>

          <div className="mt-7 grid gap-3 rounded-3xl bg-slate-50 p-4 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <span>Posts</span>
              <span className="font-semibold text-slate-900">{data.posts || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Followers</span>
              <span className="font-semibold text-slate-900">{data.followers || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Following</span>
              <span className="font-semibold text-slate-900">{data.following || 0}</span>
            </div>
          </div>

          <div className="mt-6 rounded-3xl bg-slate-100 p-4 text-slate-600">
            <p className="text-sm font-semibold text-slate-900">Profile tip</p>
            <p className="mt-2 text-sm">Share more posts and follow new people to brighten your feed.</p>
          </div>
        </aside>

        <main className="space-y-6">
          <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/40">
            <h2 className="text-xl font-semibold text-slate-900">About</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">This profile page shows the counts for posts, followers, and following for your account or a connected user.</p>
          </section>

          <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/40">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Followers</h3>
                <p className="text-sm text-slate-500">People who follow {data.username}.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">{followers.length}</span>
            </div>
            {followers.length > 0 ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {followers.map((f) => (
                  <a key={f._id} href={`/profile?id=${f._id}`} className="block">
                    <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <img src={`https://i.pravatar.cc/80?u=${f._id}`} alt={f.username} className="h-12 w-12 rounded-full object-cover" />
                      <div>
                        <p className="font-semibold text-slate-900">{f.username}</p>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">No followers yet.</p>
            )}
          </section>

          <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/40">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Following</h3>
                <p className="text-sm text-slate-500">Accounts {data.username} is following.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">{following.length}</span>
            </div>
            {following.length > 0 ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {following.map((f) => (
                  <a key={f._id} href={`/profile?id=${f._id}`} className="block">
                    <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <img src={`https://i.pravatar.cc/80?u=${f._id}`} alt={f.username} className="h-12 w-12 rounded-full object-cover" />
                      <div>
                        <p className="font-semibold text-slate-900">{f.username}</p>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">Not following anyone yet.</p>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
