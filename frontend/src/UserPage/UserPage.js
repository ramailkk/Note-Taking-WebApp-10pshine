import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { User, Lock, Eye, EyeOff, Save, Check, X } from "lucide-react";
import "./UserPage.css";

function UserPage() {
  const initialFormData = {
    name: "",
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  };

  const [formData, setFormData] = useState({ ...initialFormData });
  const [isPasswordMode, setIsPasswordMode] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const hasChanges = () => {
    const nameChanged =
      formData.name.trim() !== initialFormData.name &&
      formData.name.trim() !== "";
    const passwordChanged =
      isPasswordMode &&
      formData.oldPassword.trim() !== "" &&
      formData.newPassword.trim() !== "" &&
      formData.confirmPassword.trim() !== "";
    return nameChanged || passwordChanged;
  };

  const passwordRules = {
    length: {
      test: (pwd) => pwd.length >= 6,
      message: "At least 6 characters",
    },
    uppercase: { test: (pwd) => /[A-Z]/.test(pwd), message: "One uppercase" },
    lowercase: { test: (pwd) => /[a-z]/.test(pwd), message: "One lowercase" },
    number: { test: (pwd) => /\d/.test(pwd), message: "One number" },
  };

  const checkPasswordStrength = (password) =>
    Object.values(passwordRules).filter((rule) => rule.test(password)).length;

  const getPasswordStrength = (password) => {
    const strength = checkPasswordStrength(password);
    if (!passwordRules.length.test(password))
      return { label: "Too Short", color: "#ef4444", percent: 10 };
    if (strength <= 1) return { label: "Weak", color: "#ef4444", percent: 25 };
    if (strength === 2) return { label: "Fair", color: "#f59e0b", percent: 50 };
    if (strength === 3) return { label: "Good", color: "#3b82f6", percent: 75 };
    if (strength === 4)
      return { label: "Strong", color: "#10b981", percent: 100 };
    return { label: "Very Weak", color: "#dc2626", percent: 10 };
  };

  const isPasswordAcceptable = (password) =>
    passwordRules.length.test(password) && checkPasswordStrength(password) >= 2;

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.trim() === initialFormData.name) {
      if (!isPasswordMode || !formData.oldPassword || !formData.newPassword) {
        newErrors.name = "No changes detected";
      }
    }

    if (isPasswordMode) {
      if (!formData.oldPassword)
        newErrors.oldPassword = "Current password is required";
      if (!formData.newPassword) {
        newErrors.newPassword = "New password is required";
      } else if (!isPasswordAcceptable(formData.newPassword)) {
        newErrors.newPassword = "Password must be Fair or stronger";
      }
      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!hasChanges()) {
      setErrors({ general: "No changes to save" });
      return;
    }

    if (!validateForm()) return;

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);

    if (isPasswordMode) {
      setFormData((prev) => ({
        ...prev,
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
      setIsPasswordMode(false);
    }

    alert("Profile updated successfully!");
  };

  const togglePasswordMode = () => {
    setIsPasswordMode(!isPasswordMode);
    if (!isPasswordMode) {
      setFormData((prev) => ({
        ...prev,
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
      setErrors((prev) => {
        const { oldPassword, newPassword, confirmPassword, ...rest } = prev;
        return rest;
      });
    }
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);

  return (
    <div className="userpage-container">

      <div className={`userpage-card ${!hasChanges() ? "disabled" : ""}`}>
        <div className="userpage-header">
          <h2 className="userpage-title">Profile Settings</h2>
          <p className="userpage-subtitle">Update your personal information</p>
        </div>

        <form onSubmit={handleSubmit} className="userpage-form">
          {errors.general && (
            <div className="userpage-error-message">
              <X size={14} />
              {errors.general}
            </div>
          )}

          {/* Name */}
          <div className="userpage-form-group">
            <label htmlFor="name" className="userpage-form-label">
              <User size={16} className="userpage-label-icon" />
              Full Name
            </label>
            <input
              type="text"
              className={`userpage-form-input ${errors.name ? "userpage-input-error" : ""}`}
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
            />
            {errors.name && (
              <div className="userpage-error-message">
                <X size={14} />
                {errors.name}
              </div>
            )}
          </div>

          {/* Toggle Password */}
          <div className="userpage-password-toggle-section">
            <div className="userpage-toggle-content">
              <div className="userpage-toggle-info">
                <Lock size={18} className="userpage-toggle-icon" />
                <div>
                  <div className="userpage-toggle-title">Change Password</div>
                  <small className="userpage-toggle-subtitle">
                    Update your account password
                  </small>
                </div>
              </div>
              <label className="userpage-toggle-switch">
                <input
                  type="checkbox"
                  checked={isPasswordMode}
                  onChange={togglePasswordMode}
                />
                <span className="userpage-toggle-slider"></span>
              </label>
            </div>
          </div>

          {/* Password Fields */}
          <div
            className={`userpage-password-section ${!isPasswordMode ? "userpage-disabled" : ""}`}
          >
            {["oldPassword", "newPassword", "confirmPassword"].map(
              (fieldKey) => {
                const fieldMap = {
                  oldPassword: "Current Password",
                  newPassword: "New Password",
                  confirmPassword: "Confirm New Password",
                };

                const icon = <Lock size={16} className="userpage-label-icon" />;
                const show = showPasswords[fieldKey];
                const toggleField = fieldKey;

                return (
                  <div className="userpage-form-group" key={fieldKey}>
                    <label htmlFor={fieldKey} className="userpage-form-label">
                      {icon}
                      {fieldMap[fieldKey]}
                    </label>
                    <div className="userpage-input-container">
                      <input
                        type={show ? "text" : "password"}
                        id={fieldKey}
                        className={`userpage-form-input ${
                          errors[fieldKey] ? "userpage-input-error" : ""
                        } ${
                          fieldKey === "newPassword" &&
                          formData.newPassword &&
                          isPasswordAcceptable(formData.newPassword)
                            ? "userpage-input-success"
                            : ""
                        } ${
                          fieldKey === "confirmPassword" &&
                          formData.confirmPassword &&
                          formData.newPassword === formData.confirmPassword
                            ? "userpage-input-success"
                            : ""
                        }`}
                        value={formData[fieldKey]}
                        onChange={(e) =>
                          handleInputChange(fieldKey, e.target.value)
                        }
                        disabled={!isPasswordMode}
                      />
                      <button
                        type="button"
                        className="userpage-eye-button"
                        onClick={() => togglePasswordVisibility(toggleField)}
                        disabled={!isPasswordMode}
                      >
                        {show ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>

                    {/* Password Strength */}
                    {fieldKey === "newPassword" &&
                      formData.newPassword &&
                      isPasswordMode && (
                        <div className="userpage-strength-container">
                          <div className="userpage-strength-header">
                            <span className="userpage-strength-label">
                              Password Strength:
                            </span>
                            <span
                              className="userpage-strength-value"
                              style={{ color: passwordStrength.color }}
                            >
                              {passwordStrength.label}
                            </span>
                          </div>
                          <div className="userpage-progress-bar">
                            <div
                              className="userpage-progress-fill"
                              style={{
                                width: `${passwordStrength.percent}%`,
                                backgroundColor: passwordStrength.color,
                              }}
                            />
                          </div>
                        </div>
                      )}

                    {/* Match indicator */}
                    {fieldKey === "confirmPassword" &&
                      formData.confirmPassword &&
                      isPasswordMode &&
                      (formData.newPassword === formData.confirmPassword ? (
                        <div className="userpage-success-message">
                          <Check size={14} />
                          Passwords match
                        </div>
                      ) : (
                        <div className="userpage-error-message">
                          <X size={14} />
                          Passwords do not match
                        </div>
                      ))}

                    {errors[fieldKey] && (
                      <div className="userpage-error-message">
                        <X size={14} />
                        {errors[fieldKey]}
                      </div>
                    )}
                  </div>
                );
              },
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className={`userpage-submit-button ${isLoading ? "userpage-loading" : ""} ${
              !hasChanges() ? "userpage-disabled" : ""
            }`}
            disabled={isLoading || !hasChanges()}
          >
            {isLoading ? (
              <>
                <div className="userpage-spinner"></div> Updating...
              </>
            ) : (
              <>
                <Save size={18} /> Update Profile
              </>
            )}
          </button>
        </form>
      </div>


      {/*Profile on right */}
      <div className="userpage-avatar-circle">
        <User size={128} className="text-white" />
      </div>

    </div>
  );
}

export default UserPage;
