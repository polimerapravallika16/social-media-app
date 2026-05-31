import { useState } from "react";
import axios from "axios";

function Register() {

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {

    try {

      const res = await axios.post(
        "https://://social-media-app-production-ef17.up.railway.app/api/auth/register",
        {
          username,
          email,
          password,
        }
      );

      alert("Registration Successful");

      console.log(res.data);

    } catch (err) {

      console.log(err);

      alert("Registration Failed");
    }
  };

  return (

    <div className="container mt-5">

      <div className="card p-5 shadow">

        <h2 className="mb-4">Register</h2>

        <input
          type="text"
          placeholder="Username"
          className="form-control mb-3"
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="email"
          placeholder="Email"
          className="form-control mb-3"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="form-control mb-3"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          className="btn btn-primary"
          onClick={handleRegister}
        >
          Register
        </button>

      </div>

    </div>
  );
}

export default Register;