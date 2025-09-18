"use client";

import { useState } from "react";
import MainLayout from "@/components/MainLayout";

export default function ForgotPasswordPage() {
  const [resetKey, setResetKey] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetKey, newPassword }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setMessage(
          "Password reset successful! You can now log in with your new password."
        );
        setResetKey("");
        setNewPassword("");
      } else {
        setError(data.message || "Failed to reset password");
      }
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Forgot/Reset Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your reset key and new password below.
            <br />
            <span className="font-semibold">Reset key format:</span>{" "}
            <span className="text-primary-700">
              &lt;mobile&gt;-&lt;email&gt;
            </span>
            <br />
            Example:{" "}
            <span className="text-xs">
              9817677742-dineshkumar9817677742@gmail.com
            </span>
          </p>
        </div>
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {message && (
              <div className="mb-4 bg-green-50 text-green-700 p-3 rounded">
                {message}
              </div>
            )}
            {error && (
              <div className="mb-4 bg-red-50 text-red-700 p-3 rounded">
                {error}
              </div>
            )}
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="resetKey"
                  className="block text-sm font-medium text-gray-700"
                >
                  Reset Key
                </label>
                <div className="mt-1">
                  <input
                    id="resetKey"
                    name="resetKey"
                    type="text"
                    required
                    value={resetKey}
                    onChange={(e) => setResetKey(e.target.value)}
                    className="input-field w-full"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  New Password
                </label>
                <div className="mt-1">
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input-field w-full"
                  />
                </div>
              </div>
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
