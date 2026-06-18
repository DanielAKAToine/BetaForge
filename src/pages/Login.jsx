import { useState } from "react";
import styles from "./Login.module.css";


export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        setError("");

        if (!email || !password) {
            setError("Please fill in all fields.");
            return;
        }

        alert(`Trying to log in with ${email}`);
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
                    />
                </div>
                <button type="submit" className={styles.submitBtn}>Sign In</button>
            </form>
        </div>
    )
}