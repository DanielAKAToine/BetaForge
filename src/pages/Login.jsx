import { useState } from "react";
import styles from "./Login.module.css";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../firebase/config";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";



export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        if (!email || !password) {
            setError("Please fill in all fields.");
            setLoading(false);
            return;
        }
        setLoading(true);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            if (!user.emailVerified) {
                setError("Please verify your email before logging in.");
                toast.warn("Please verify your email before logging in.");
                await signOut(auth);
                setLoading(false);
                return;
            }
            toast.success("Login successful! Welcome to BetaForge!");
            navigate("/");
        }
        catch (err) {
            console.error(err);

            if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found") {
                setError("Invalid email or password.");
            } else if (err.code === "auth/too-many-requests") {
                setError("Too many failed login attempts. Account temporarily locked.");
            } else {
                setError("Failed to login. Please try again.");
            }
        }

        finally {
            setLoading(false);

        }
    }



    return (
        <div className={styles.loginContainer}>
            <h2>Login to BetaForge</h2>
            {error && <p className={styles.error}>{error}</p>}

            <form onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                    <label>Email:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                    />
                </div>
                <div className={styles.formGroup}>
                    <label>Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        disabled={loading}
                    />
                </div>
                <div className={styles.forgotPasswordContainer}>
                    <button
                        type="button"
                        onClick={() => navigate('/forgot-password')}
                        className={styles.forgotBtn}> Forgot Password?</button>
                </div>
                <button type="submit" className={styles.submitBtn} disabled={loading}>
                    {loading ? "Signing In..." : "Sign In"}
                </button>
            </form>
        </div>
    )
}