import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase/config';
import { sendPasswordResetEmail } from 'firebase/auth';
import { toast } from 'react-toastify';
import loginStyles from './Login.module.css';
import forgotStyles from './ForgotPassword.module.css';


export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleResetSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim()) return;

        setLoading(true);
        try {
            await sendPasswordResetEmail(auth, email.trim());
            toast.success("Password reset email sent! Check your inbox.");
            navigate('/login');
        }

        catch (error) {
            console.error("Error sending recovery email:", error);
            if (error.code === 'auth/user-not-found') {
                toast.error("No account found with this email address.");
            } else if (error.code === 'auth/invalid-email') {
                toast.error("Please enter a valid email address.");
            } else {
                toast.error("Failed to send reset email. Try again later.");
            }
        }

        finally {
            setLoading(false);
        }
    }

    return (
        <div className={loginStyles.loginContainer}>
            <div className={`${loginStyles.loginCard} ${forgotStyles.forgotCard}`}>
                <h2>Reset Your Password</h2>
                <p className={forgotStyles.forgotSubtext}>Enter your registered email below. We will send you a secure link to choose a new password.</p>

                <form onSubmit={handleResetSubmit}>
                    <div className={forgotStyles.forgotInputGroup}>
                        <label>Email Address:</label>
                        <input
                            type="email"
                            placeholder="e.g., daniel@gmail.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`${loginStyles.submitBtn} ${forgotStyles.submitBtnFull}`}>
                        {loading ? "Sending Link..." : "Send Recovery Link"}
                    </button>
                </form>

                <div className={forgotStyles.backToLoginContainer}>
                    <button
                        type="button"
                        onClick={() => navigate('/login')}
                        className={forgotStyles.backToLoginBtn}>
                        ← Back to Login </button>
                </div>
            </div>
        </div>
    );
}