import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Toast, { useToast } from '../components/Toast';
import './Auth.css';

const Register = () => {
    const [step, setStep] = useState(1); // 1: Enter details, 2: Verify OTP
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
        otp: ''
    });
    const [loading, setLoading] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otpExpiresAt, setOtpExpiresAt] = useState(null);
    const [timeRemaining, setTimeRemaining] = useState(null);
    const navigate = useNavigate();
    const { toasts, showToast } = useToast();

    // Countdown timer for OTP expiration
    useEffect(() => {
        if (!otpExpiresAt) return;

        const interval = setInterval(() => {
            const now = new Date().getTime();
            const distance = otpExpiresAt - now;

            if (distance < 0) {
                setTimeRemaining(null);
                clearInterval(interval);
            } else {
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                setTimeRemaining({ minutes, seconds });
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [otpExpiresAt]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleRequestOTP = async (e) => {
        e.preventDefault();

        // Note: Domain validation is now handled by the backend
        if (!formData.email || !formData.email.includes('@')) {
            showToast('Please enter a valid email address', 'error');
            return;
        }

        // Validate phone number
        if (!formData.phoneNumber || formData.phoneNumber.trim() === '') {
            showToast('Phone number is required', 'error');
            return;
        }

        // Validate password match
        if (formData.password !== formData.confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }

        // Validate password length
        if (formData.password.length < 6) {
            showToast('Password must be at least 6 characters', 'error');
            return;
        }

        setLoading(true);

        try {
            await api.post('/auth/register/request-otp', {
                email: formData.email,
                fullName: formData.fullName
            });

            showToast('OTP sent to your email! Please check your inbox.', 'success');
            setOtpSent(true);
            // Set OTP expiration time (5 minutes from now)
            setOtpExpiresAt(new Date().getTime() + 5 * 60 * 1000);
            setStep(2);
        } catch (error) {
            showToast(error.response?.data?.error || 'Failed to send OTP', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();

        if (!formData.otp || formData.otp.length !== 6) {
            showToast('Please enter a valid 6-digit OTP', 'error');
            return;
        }

        setLoading(true);

        try {
            const response = await api.post('/auth/register/verify-otp', {
                email: formData.email,
                otp: formData.otp,
                password: formData.password,
                fullName: formData.fullName,
                phoneNumber: formData.phoneNumber
            });

            // Store token and user data
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            showToast('Registration successful!', 'success');

            // Reload page to update auth context
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
        } catch (error) {
            showToast(error.response?.data?.error || 'Invalid OTP', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setLoading(true);
        try {
            await api.post('/auth/register/request-otp', {
                email: formData.email,
                fullName: formData.fullName
            });
            showToast('New OTP sent to your email!', 'success');
            // Reset OTP expiration time (5 minutes from now)
            setOtpExpiresAt(new Date().getTime() + 5 * 60 * 1000);
        } catch (error) {
            showToast('Failed to resend OTP', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <h1>{step === 1 ? 'Create Account' : 'Verify Email'}</h1>
                        <p>
                            {step === 1
                                ? 'Join the FAST-NUCES Lost & Found community'
                                : `Enter the OTP sent to ${formData.email}`
                            }
                        </p>
                    </div>

                    {step === 1 ? (
                        <form onSubmit={handleRequestOTP} className="auth-form">
                            <div className="form-group">
                                <label className="form-label">Full Name</label>
                                <input
                                    type="text"
                                    name="fullName"
                                    className="form-input"
                                    placeholder="Enter your full name"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">University Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    className="form-input"
                                    placeholder="your.name@nu.edu.pk"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                                <small style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-size-xs)' }}>
                                    Please use your authorized email domain
                                </small>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Phone Number</label>
                                <input
                                    type="tel"
                                    name="phoneNumber"
                                    className="form-input"
                                    placeholder="+92 300 1234567"
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    className="form-input"
                                    placeholder="Create a password (min 6 characters)"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Confirm Password</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    className="form-input"
                                    placeholder="Confirm your password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
                                {loading ? 'Sending OTP...' : 'Continue'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOTP} className="auth-form">
                            <div className="form-group">
                                <label className="form-label">Enter OTP</label>
                                <input
                                    type="text"
                                    name="otp"
                                    className="form-input"
                                    placeholder="Enter 6-digit OTP"
                                    value={formData.otp}
                                    onChange={handleChange}
                                    maxLength="6"
                                    pattern="[0-9]{6}"
                                    required
                                    style={{
                                        fontSize: '1.5rem',
                                        letterSpacing: '0.5rem',
                                        textAlign: 'center',
                                        fontWeight: 'bold'
                                    }}
                                />
                                {timeRemaining !== null ? (
                                    <small style={{
                                        color: timeRemaining.minutes === 0 && timeRemaining.seconds <= 30
                                            ? 'var(--color-danger)'
                                            : 'var(--text-tertiary)',
                                        fontSize: 'var(--font-size-xs)',
                                        fontWeight: timeRemaining.minutes === 0 && timeRemaining.seconds <= 30 ? 'bold' : 'normal'
                                    }}>
                                        ⏱️ OTP expires in {timeRemaining.minutes}:{timeRemaining.seconds.toString().padStart(2, '0')}
                                    </small>
                                ) : (
                                    <small style={{ color: 'var(--color-danger)', fontSize: 'var(--font-size-xs)', fontWeight: 'bold' }}>
                                        ⚠️ OTP has expired. Please request a new one.
                                    </small>
                                )}
                            </div>

                            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginBottom: '1rem' }}>
                                {loading ? 'Verifying...' : 'Verify & Register'}
                            </button>

                            <button
                                type="button"
                                className="btn btn-outline"
                                onClick={handleResendOTP}
                                disabled={loading}
                                style={{ width: '100%', marginBottom: '1rem' }}
                            >
                                Resend OTP
                            </button>

                            <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() => setStep(1)}
                                disabled={loading}
                                style={{ width: '100%' }}
                            >
                                ← Back to Registration
                            </button>
                        </form>
                    )}

                    <div className="auth-footer">
                        <p>Already have an account? <Link to="/login">Sign in</Link></p>
                    </div>
                </div>
            </div>
            <Toast toasts={toasts} />
        </div>
    );
};

export default Register;
