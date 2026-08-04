import { useState } from "react";
import { Eye, EyeOff, Check, X } from "lucide-react";
import "./Auth.css"; // We will update this file with the new styles
import { useNavigate, Link } from "react-router-dom";
import { API_BASE_URL } from "../App/config";

import { FaScroll, FaLock } from "react-icons/fa";

// --- All your component logic remains the same. The only change is in the returned JSX. ---
function SignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const passwordRules = {
  length: {
    test: (pwd) => pwd.length >= 5,
    message: "At least 5 characters",
  },
  uppercase: {
    test: (pwd) => /[A-Z]/.test(pwd),
    message: "One uppercase letter",
  },
  specialChar: {
    test: (pwd) => /[^A-Za-z0-9]/.test(pwd),
    message: "One special character",
  },
  number: {
    test: (pwd) => /\d/.test(pwd),
    message: "One number",
  },
};

  const checkPasswordStrength = (password) => {
  return Object.values(passwordRules).filter((rule) => rule.test(password)).length;
};

  const getPasswordStrength = (password) => {
  const strength = checkPasswordStrength(password);

  // If length rule fails, it’s always "Too Short"
  if (!passwordRules.length.test(password)) {
    return { label: "Too Short", color: "#ef4444", percent: 10 };
  }

  switch (strength) {
    case 0:
    case 1:
      return { label: "Weak", color: "#ef4444", percent: 25 };
    case 2:
      return { label: "Fair", color: "#f59e0b", percent: 50 };
    case 3:
      return { label: "Good", color: "#3b82f6", percent: 75 };
    case 4:
      return { label: "Strong", color: "#10b981", percent: 100 };
    default:
      return { label: "Too Short", color: "#ef4444", percent: 10 };
  }
};

  const isPasswordAcceptable = (password) => {
    if (!passwordRules.length.test(password)) return false;
    const strength = checkPasswordStrength(password);
    return strength >= 2;
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const { name, email, password, confirmPassword } = formData;
    if (!isPasswordAcceptable(password))
      return setError("Password must be 'Fair' or stronger.");
    if (password !== confirmPassword)
      return setError("Passwords do not match.");
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: name, email, password }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Something went wrong.");
      setSuccess("Account created successfully! Redirecting...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      console.log("hello");
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const isFormSubmittable =
    isPasswordAcceptable(formData.password) &&
    formData.password === formData.confirmPassword;

  // UPDATED JSX STRUCTURE
  return (
    <div className="signup-container">
      <div className="form-wrapper">
        <FaScroll
          className={`auth-logo ${isFormSubmittable ? "active" : ""}`}
        />
        <h2 className="title">Welcome to ScrollCraft</h2>
        <p className="subtitle">Your observations await.</p>

        {error && <div className="alert error-alert">{error}</div>}
        {success && <div className="alert success-alert">{success}</div>}

        <form onSubmit={handleSubmit}>
          {/* All form groups remain the same */}
          <div className="form-group">
            <label htmlFor="name" className="label">
              Username
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="email" className="label">
              Email address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
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
                required
                value={formData.password}
                onChange={handleChange}
                className={`input ${formData.password && !isPasswordAcceptable(formData.password) ? "input-error" : ""}
                    ${formData.password && isPasswordAcceptable(formData.password) ? "input-success" : ""}`}
              />
              <button
                type="button"
                className="eye-button"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {formData.password && (
              <div className="strength-container">
                <div className="strength-header">
                  <span className="strength-label">Password Strength:</span>
                  <span
                    className="strength-value"
                    style={{ color: passwordStrength.color }}
                  >
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${passwordStrength.percent}%`,
                      backgroundColor: passwordStrength.color,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword" className="label">
              Confirm Password
            </label>
            <div className="input-container">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`input ${formData.confirmPassword && formData.password !== formData.confirmPassword ? "input-error" : ""}
                    ${formData.confirmPassword && formData.password === formData.confirmPassword && formData.confirmPassword.length > 0 ? "input-success" : ""}`}
              />
              <button
                type="button"
                className="eye-button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {formData.confirmPassword &&
              formData.password !== formData.confirmPassword && (
                <div className="validation-message error-message">
                  <X size={16} className="validation-icon" />
                  <span>Passwords do not match</span>
                </div>
              )}
            {formData.confirmPassword &&
              formData.password === formData.confirmPassword &&
              formData.confirmPassword.length > 0 && (
                <div className="validation-message success-message">
                  <Check size={16} className="validation-icon" />
                  <span>Passwords match</span>
                </div>
              )}
          </div>
          <button
            type="submit"
            disabled={!isFormSubmittable || submitting}
            className={`submit-button ${
              !isFormSubmittable || submitting
                ? "button-disabled"
                : "button-enabled"
            }`}
          >
            {submitting && <span className="nb-spinner" />}
            {!submitting && !isFormSubmittable && (
              <FaLock className="nb-lock-icon" />
            )}
            {submitting ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="login-link">
          Already have an account?{" "}
          <Link to="/login" className="link">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default SignUp;
