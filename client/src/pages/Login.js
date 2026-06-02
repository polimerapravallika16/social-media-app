import { useEffect, useState } from "react";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sampleUsers, setSampleUsers] = useState([]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await fetch("https://social-media-app-production-ef17.up.railway.app/api/users/all");
        if (!res.ok) return;
        const users = await res.json();
        setSampleUsers(users);
      } catch (err) {
        console.error("Could not load sample users", err);
      }
    };

    loadUsers();
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      return alert("Please enter email and password.");
    }

    try {
      const res = await fetch("https://social-media-app-production-ef17.up.railway.app/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data?.message || data || "Login failed.");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.user.id);
      localStorage.setItem("username", data.user.username);

      alert("Login Successful ✅");
      window.location.href = "/";
    } catch (err) {
      alert("Server not working ❌");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0f1a]">
      <div className="w-[950px] h-[550px] rounded-3xl overflow-hidden flex shadow-2xl">
        <div className="w-1/2 flex flex-col justify-center px-12 text-white bg-gradient-to-br from-pink-500 via-purple-600 to-blue-500">
          <h1 className="text-6xl font-extrabold mb-6">VIBEUP</h1>
          <p>Connect with friends 🚀</p>
        </div>

        <div className="w-1/2 bg-[#0f172a] flex flex-col justify-center px-12 text-white">
          <h2 className="text-3xl font-bold mb-8">Login</h2>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-5 px-4 py-3 rounded-xl bg-[#1e293b]"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-6 px-4 py-3 rounded-xl bg-[#1e293b]"
          />

          <button
            onClick={handleLogin}
            className="py-3 rounded-xl bg-gradient-to-r from-pink-500 to-blue-500"
          >
            Login 🚀
          </button>

          <div className="mt-6 rounded-3xl border border-slate-700 bg-slate-900/95 px-5 py-5 text-sm text-slate-200 shadow-xl shadow-slate-950/20">
            <p className="font-semibold text-white">Sample accounts</p>
            <p className="mt-2 text-slate-300">Login using any email currently stored in the app. Default password for every account is <strong>password</strong>.</p>
            <div className="mt-4 grid gap-2 text-slate-100 sm:grid-cols-2">
              {sampleUsers.length > 0 ? (
                sampleUsers.map((user) => (
                  <div key={user.email} className="rounded-2xl bg-slate-800/80 p-3">
                    {user.email}
                    {user.email === "pravalli@example.com" ? <span className="text-sky-300"> (your personal account)</span> : null}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl bg-slate-800/80 p-3">
  Use your registered email and password to log in.
</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
