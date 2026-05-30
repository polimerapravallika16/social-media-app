import { useEffect, useState } from "react";

export default function Following() {
  const [users, setUsers] = useState([]);
  const myId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!myId) return;

    const fetchFollowing = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/users/following/${myId}`);
        const data = await res.json();
        setUsers(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchFollowing();
  }, [myId]);

  const handleUnfollow = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/users/unfollow/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
      });

      if (!res.ok) {
        const text = await res.text();
        alert(text || "Could not unfollow");
        return;
      }

      setUsers((u) => u.filter((item) => item._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/40">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Following</p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-900">People you follow</h1>
            </div>
            <p className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700">{users.length} accounts</p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {users.map((u) => (
              <div key={u._id} className="flex items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <img src={`https://i.pravatar.cc/80?u=${u._id}`} alt={u.username} className="h-12 w-12 rounded-full object-cover" />
                  <div>
                    <p className="font-semibold text-slate-900">{u.username}</p>
                    <p className="text-sm text-slate-500">Following</p>
                  </div>
                </div>
                <button
                  onClick={() => handleUnfollow(u._id)}
                  className="rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600"
                >
                  Unfollow
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
