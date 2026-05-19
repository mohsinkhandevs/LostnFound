import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import './ForgotPassword.css';

const ForgotPassword = () => {
    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [showRegisterLink, setShowRegisterLink] = useState(false);
    const [otpTimer, setOtpTimer] = useState(0);

    const navigate = useNavigate();
    const { login } = useAuth();

    // OTP Timer countdown
    useEffect(() => {
        if (otpTimer > 0) {
            const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [otpTimer]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Step 1: Request OTP
    const handleRequestOTP = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setShowRegisterLink(false);
        setLoading(true);

        try {
            const response = await api.post('/auth/forgot-password/request-otp', { email });
            setSuccessMessage(response.data.message);
            setStep(2);
            setOtpTimer(600); // 10 minutes
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to send OTP. Please try again.');
            if (err.response?.data?.showRegisterLink) {
                setShowRegisterLink(true);
            }
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify OTP
    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setLoading(true);

        try {
            const response = await api.post('/auth/forgot-password/verify-otp', { email, otp });
            setSuccessMessage(response.data.message);
            setStep(3);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to verify OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Reset Password
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        setLoading(true);

        try {
            const response = await api.post('/auth/forgot-password/reset', { email, otp, newPassword });
            setSuccessMessage(response.data.message);
            // Auto-login user
            login(response.data.token, response.data.user);
            setTimeout(() => {
                navigate('/');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to reset password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setError('');
        setSuccessMessage('');
        setLoading(true);

        try {
            await api.post('/auth/forgot-password/request-otp', { email });
            setSuccessMessage('New OTP sent to your email!');
            setOtpTimer(600);
            setOtp('');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to resend OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <div className="auth-icon">🔒</div>
                        <h1>Forgot Password</h1>
                        <p>Reset your password in a few simple steps</p>
                    </div>

                    {/* Progress Indicator */}
                    <div className="progress-steps">
                        <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
                            <div className="step-circle">1</div>
                            <span>Email</span>
                        </div>
                        <div className={`progress-line ${step >= 2 ? 'active' : ''}`}></div>
                        <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
                            <div className="step-circle">2</div>
                            <span>Verify OTP</span>
                        </div>
                        <div className={`progress-line ${step >= 3 ? 'active' : ''}`}></div>
                        <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
                            <div className="step-circle">3</div>
                            <span>New Password</span>
                        </div>
                    </div>

                    {error && (
                        <div className="error-message">
                            <span>⚠️ {error}</span>
                            {showRegisterLink && (
                                <Link to="/register" className="register-link-inline">
                                    Create an account
                                </Link>
                            )}
                        </div>
                    )}
                    {successMessage && <div className="success-message">✓ {successMessage}</div>}

                    {/* Step 1: Enter Email */}
                    {step === 1 && (
                        <form onSubmit={handleRequestOTP} className="auth-form">
                            <div className="form-group">
                                <label htmlFor="email" className="form-label">Email Address</label>
                                <input
                                    type="email"
                                    id="email"
                                    className="form-input"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your.email@isb.nu.edu.pk"
                                    required
                                />
                                <p className="form-hint">Enter the email address associated with your account</p>
                            </div>

                            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                                {loading ? 'Sending OTP...' : 'Send OTP'}
                            </button>

                            <div className="auth-footer">
                                <p>Remember your password? <Link to="/login">Login</Link></p>
                            </div>
                        </form>
                    )}

                    {/* Step 2: Verify OTP */}
                    {step === 2 && (
                        <form onSubmit={handleVerifyOTP} className="auth-form">
                            <div className="otp-info">
                                <p>We've sent a 6-digit OTP to <strong>{email}</strong></p>
                                {otpTimer > 0 && (
                                    <p className="otp-timer">
                                        ⏱️ OTP expires in: <strong>{formatTime(otpTimer)}</strong>
                                    </p>
                                )}
                            </div>

                            <div className="form-group">
                                <label htmlFor="otp" className="form-label">Enter OTP</label>
                                <input
                                    type="text"
                                    id="otp"
                                    className="form-input otp-input"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="000000"
                                    maxLength="6"
                                    required
                                />
                            </div>

                            <button type="submit" className="btn btn-primary btn-block" disabled={loading || otp.length !== 6}>
                                {loading ? 'Verifying...' : 'Verify OTP'}
                            </button>

                            <div className="resend-section">
                                <p>Didn't receive the OTP?</p>
                                <button
                                    type="button"
                                    onClick={handleResendOTP}
                                    className="btn btn-ghost btn-sm"
                                    disabled={loading || otpTimer > 540}
                                >
                                    Resend OTP
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="btn btn-secondary btn-block"
                            >
                                ← Back to Email
                            </button>
                        </form>
                    )}

                    {/* Step 3: Reset Password */}
                    {step === 3 && (
                        <form onSubmit={handleResetPassword} className="auth-form">
                            <div className="form-group">
                                <label htmlFor="newPassword" className="form-label">New Password</label>
                                <input
                                    type="password"
                                    id="newPassword"
                                    className="form-input"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    className="form-input"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                    required
                                />
                            </div>

                            <div className="password-requirements">
                                <p>Password must be at least 6 characters long</p>
                            </div>

                            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                                {loading ? 'Resetting Password...' : 'Reset Password'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
