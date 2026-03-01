"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [loginMethod, setLoginMethod] = useState<"email" | "mobile">("email");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");

  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);


  const handleEmailLogin = async () => {
    if (!email || !password) {
      alert("Enter email and password");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    const { data: userRow } = await supabase
      .from("users")
      .select("role")
      .eq("email", email)
      .single();

    router.push(`/dashboard/${userRow?.role}`);
  };


  const handleSendOtp = async () => {
    if (!mobile || mobile.length !== 10) {
      alert("Enter valid mobile number");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      phone: `+91${mobile}`, 
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    setOtpSent(true);
    alert("OTP sent to your mobile number");
  };


  const handleVerifyOtp = async () => {
    if (!otp) {
      alert("Enter OTP");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.verifyOtp({
      phone: `+91${mobile}`,
      token: otp,
      type: "sms",
    });

    setLoading(false);

    if (error) {
      alert("Invalid OTP");
      return;
    }

    const { data: userRow } = await supabase
      .from("users")
      .select("role")
      .eq("mobile", mobile)
      .single();

    router.push(`/dashboard/${userRow?.role}`);
  };

  return (
    <div className="min-h-screen bg-gray-300 flex justify-center items-center p-6">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl text-center font-bold mb-6">Login</h1>

        <div className="mb-4">
          <h1 className="text-xl text-center font-bold mb-4">Login Using</h1>
          <div className="flex gap-6 items-center justify-center">
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name="loginmethod"
                checked={loginMethod === "email"}
                onChange={() => setLoginMethod("email")}
              />
              Email
            </label>

            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name="loginmethod"
                checked={loginMethod === "mobile"}
                onChange={() => setLoginMethod("mobile")}
              />
              Mobile Number
            </label>
          </div>
        </div>

        {loginMethod === "email" && (
          <div className="space-y-3">
            <div>
              <label>Email</label>
              <input
                className="w-full border p-2 rounded"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label>Password</label>
              <input
                type="password"
                className="w-full border p-2 rounded"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              onClick={handleEmailLogin}
              disabled={loading}
              className="w-full bg-black text-white py-2 rounded mt-4"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </div>
        )}

        {loginMethod === "mobile" && (
          <div className="space-y-3">
            <div>
              <label>Mobile Number</label>
              <input
                className="w-full border p-2 rounded"
                placeholder="Enter mobile number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
              />
            </div>

            {otpSent && (
              <div>
                <label>OTP</label>
                <input
                  className="w-full border p-2 rounded"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>
            )}

            {!otpSent ? (
              <button
                onClick={handleSendOtp}
                disabled={loading}
                className="w-full bg-black text-white py-2 rounded mt-4"
              >
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>
            ) : (
              <button
                onClick={handleVerifyOtp}
                disabled={loading}
                className="w-full bg-black text-white py-2 rounded mt-4"
              >
                {loading ? "Verifying..." : "Verify & Login"}
              </button>
            )}
          </div>
        )}

        <div className="text-center mt-4">
          <a className="text-blue-500 cursor-pointer" href="/password/forgot-password">Forgot Password?</a>
        </div>

        <p className="text-sm text-center mt-4">
          Don't have an account?{" "}
          <a href="/signup" className="text-blue-500">
            Sign Up
          </a>
        </p>
      </div>
    </div>
  );
}
