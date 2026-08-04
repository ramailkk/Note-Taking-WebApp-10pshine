import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "./AuthContext";
import "./Auth.css";
import { API_BASE_URL } from "../App/config";
import { FaScroll } from "react-icons/fa";

function Login() {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    usernameOrEmail: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Login failed.");

      setSuccess("Login successful!");
      if (result.token) login(result.token);

      navigate("/home");
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="login-background-container">
    <div className="signup-container">
      <div className="form-wrapper">
        <FaScroll className='auth-logo active login' />
        <h2 className="title mb-3">Login to your account</h2>
        {/*<p className="subtitle mb-3">Get to Grinding.</p>*/}
        {error && <div className="alert error-alert">{error}</div>}
        {success && <div className="alert success-alert">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="usernameOrEmail" className="label">
              Username or Email
            </label>
            <input
              type="text"
              id="usernameOrEmail"
              name="usernameOrEmail"
              value={formData.usernameOrEmail}
              onChange={handleChange}
              required
              className="input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="label">
              Password
            </label>
            <div className="input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="input"
                style={{ paddingRight: "40px" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="eye-button"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="submit-button button-enabled"
            disabled={submitting}
          >
            {submitting && <span className="nb-spinner" />}
            {submitting ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <p className="login-link">
          Don’t have an account?{" "}
          <Link to="/signup" className="link">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  </div>
  );
}

export default Login;