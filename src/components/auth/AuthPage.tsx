import { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, ArrowLeft, User, Lock, Mail, UserCircle } from 'lucide-react';
import { api } from '../../lib/api';
import { toast } from 'sonner';

interface AuthPageProps {
  onAuth: (role: 'user' | 'compliance', userData?: any) => void;
  onBack: () => void;
  isDeveloper?: boolean;
}

export function AuthPage({ onAuth, onBack, isDeveloper = false }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState(''); // Store the server-side OTP
  const [showOTP, setShowOTP] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ phone?: string; email?: string; fullName?: string }>({});

  const validatePhone = (phoneNumber: string): boolean => {
    // Relaxed validation for Demo purposes (allows 0123456789, 1234567890 etc)
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phoneNumber.replace(/\D/g, ''));
  };

  const validateEmail = (emailAddress: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailAddress);
  };

  const validateFullName = (name: string): boolean => {
    return name.trim().length >= 3 && /^[a-zA-Z\s]+$/.test(name);
  };

  const handleSendOTP = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { phone?: string; email?: string; fullName?: string } = {};

    const cleanPhone = phone.replace(/\D/g, '');
    if (!validatePhone(cleanPhone)) {
      newErrors.phone = 'Enter a valid 10-digit Indian phone number';
    }

    // Validate Email if not using Demo Phone numbers
    const isDemoPhone = cleanPhone === '1234567890' || cleanPhone === '9999999999';
    if (!isDemoPhone) {
      if (!validateEmail(email)) {
        newErrors.email = 'Enter a valid email address';
      }
    }

    if (!isLogin) {
      if (!validateFullName(fullName)) {
        newErrors.fullName = 'Enter a valid full name (min 3 characters, letters only)';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Generate Mock OTP
    const mockOtp = isDemoPhone ? (cleanPhone === '1234567890' ? '123456' : '999999') : Math.floor(100000 + Math.random() * 900000).toString();

    // Show OTP to User
    toast.success(`OTP Sent! Your code is: ${mockOtp}`, {
      duration: 10000,
      action: {
        label: 'Copy',
        onClick: () => navigator.clipboard.writeText(mockOtp)
      }
    });

    setGeneratedOtp(mockOtp); // Store for verification
    setErrors({});
    setShowOTP(true);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // STRICT OTP CHECK
    if (otp !== generatedOtp) {
      toast.error("Invalid OTP. Please check the code and try again.");
      setIsLoading(false);
      return;
    }

    try {
      // 1. Check for Demo Users
      if (phone === '1234567890') {
        const data = await api.login('demo@sentinel.com', 'demo123');
        toast.success("Authentication Successful");
        onAuth('user', data.user);
        return;
      }

      if (phone === '9999999999') {
        const data = await api.login('officer@trustshield.com', 'admin123');
        toast.success("Authentication Successful");
        onAuth('compliance', data.user);
        return;
      }

      // 2. Handle Custom Users
      if (!isLogin) {
        // Registration Flow
        const data = await api.register({
          email,
          name: fullName,
          password: 'password123', // Default for prototype
          phone
        });
        toast.success("Account Created Successfully");
        onAuth('user', data.user);
      } else {
        // Login Flow (Custom User)
        // Authenticate using Email and Default Password
        console.log("Attempting Custom Login with:", email);
        const data = await api.login(email, 'password123');
        toast.success("Authentication Successful");
        onAuth('user', data.user);
      }

    } catch (err: any) {
      console.error("Auth Failed", err);
      // Detailed error reporting for debugging
      const errorMessage = err.error || err.message || (typeof err === 'string' ? err : JSON.stringify(err));
      toast.error(errorMessage || "Authentication Failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoUser = () => {
    setPhone('1234567890');
    setOtp('123456');
    setGeneratedOtp('123456'); // Allow verify to pass
    setShowOTP(true);
  };

  const handleDemoCompliance = () => {
    setPhone('9999999999');
    setOtp('999999');
    setGeneratedOtp('999999'); // Allow verify to pass
    setShowOTP(true);
    setTimeout(() => {
      onAuth('compliance');
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      {/* ... existing back button ... */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onBack}
        className="absolute top-6 left-6 flex items-center gap-2 text-[#888888] hover:text-white transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </motion.button>

      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-12 h-12 rounded border border-[#222222] bg-[#050505] mb-4">
            {isDeveloper ? (
              <div className="text-white font-mono text-xl">{`{ }`}</div>
            ) : (
              <Shield className="w-6 h-6 text-white" strokeWidth={1.5} />
            )}
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-2 text-[#EDEDED]">
            {isDeveloper
              ? 'Developer Portal'
              : (isLogin ? 'Welcome Back' : 'Get Started')
            }
          </h2>
          <p className="text-sm text-[#888888]">
            {isDeveloper
              ? 'Log in to manage your API keys and webhooks'
              : (isLogin ? 'Sign in to your account' : 'Create your account')
            }
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="border border-[#222222] bg-[#050505]/80 backdrop-blur-md p-8 rounded"
        >
          {!showOTP ? (
            <form onSubmit={handleSendOTP} className="space-y-6">
              {/* Full Name Field (Sign up only) */}
              {!isLogin && (
                <div>
                  <label className="block text-xs mb-2 text-[#888888]">Full Name</label>
                  <div className="relative">
                    <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888888]" strokeWidth={1.5} />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (errors.fullName) setErrors({ ...errors, fullName: undefined });
                      }}
                      placeholder="John Doe"
                      className={`w-full bg-black border ${errors.fullName ? 'border-red-500' : 'border-[#222222]'} rounded px-10 py-3 text-sm focus:outline-none focus:border-white transition-colors text-[#EDEDED]`}
                      required
                    />
                  </div>
                  {errors.fullName && (
                    <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>
                  )}
                </div>
              )}

              {/* Email Field (Always visible for Custom Auth) */}
              <div>
                <label className="block text-xs mb-2 text-[#888888]">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888888]" strokeWidth={1.5} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors({ ...errors, email: undefined });
                    }}
                    placeholder="john@example.com"
                    className={`w-full bg-black border ${errors.email ? 'border-red-500' : 'border-[#222222]'} rounded px-10 py-3 text-sm focus:outline-none focus:border-white transition-colors text-[#EDEDED]`}
                    required
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                )}
              </div>

              {/* Phone Number Field */}
              <div>
                <label className="block text-xs mb-2 text-[#888888]">Phone Number</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888888]" strokeWidth={1.5} />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (errors.phone) setErrors({ ...errors, phone: undefined });
                    }}
                    placeholder="+91 9876543210"
                    className={`w-full bg-black border ${errors.phone ? 'border-red-500' : 'border-[#222222]'} rounded px-10 py-3 text-sm focus:outline-none focus:border-white transition-colors text-[#EDEDED]`}
                    required
                  />
                </div>
                {errors.phone && (
                  <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
                )}
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                className="w-full bg-white text-black py-3 rounded text-sm hover:bg-[#EDEDED] transition-colors"
              >
                Send OTP
              </motion.button>

              {/* Demo Buttons */}
              <div className="pt-4 border-t border-[#222222] space-y-3">
                <p className="text-xs text-[#888888] text-center mb-3">Quick Demo Access</p>
                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={handleDemoUser}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-[#050505] border border-[#222222] rounded text-xs hover:border-white transition-colors"
                  >
                    <User className="w-3 h-3" />
                    Demo User
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={handleDemoCompliance}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-[#050505] border border-[#222222] rounded text-xs hover:border-white transition-colors"
                  >
                    <Shield className="w-3 h-3" />
                    Compliance
                  </motion.button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div>
                <label className="block text-xs mb-2 text-[#888888]">Enter OTP</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888888]" strokeWidth={1.5} />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    maxLength={6}
                    className="w-full bg-black border border-[#222222] rounded px-10 py-3 text-sm focus:outline-none focus:border-white transition-colors text-[#EDEDED]"
                    required
                  />
                </div>
                <p className="text-xs text-[#888888] mt-2">
                  OTP sent to {phone}
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                className="w-full bg-white text-black py-3 rounded text-sm hover:bg-[#EDEDED] transition-colors"
              >
                Verify & Continue
              </motion.button>

              <button
                type="button"
                onClick={() => setShowOTP(false)}
                className="w-full text-xs text-[#888888] hover:text-white transition-colors"
              >
                Change Phone Number
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs text-[#888888] hover:text-white transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 text-center text-xs text-[#888888]"
        >
          <p>By continuing, you agree to our Terms of Service and Privacy Policy</p>
        </motion.div>
      </div>
    </div>
  );
}