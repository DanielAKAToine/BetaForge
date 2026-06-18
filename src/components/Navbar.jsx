import { Link } from 'react-router-dom';
import styles from './Navbar.module.css';

export default function Navbar() {
    const isLoggedIn = false;

    return (
        <nav className={styles.navbar}>
            <Link to="/" className={styles.logo}>BetaForge</Link>
            <div className={styles.navLinks}>
                <Link to="/" className={styles.navLink}>Home</Link>
                {!isLoggedIn ? (
                    <>
                        <Link to="/login" className={styles.navLink}>Login</Link>
                        <Link to="/register" className={styles.navLink}>Register</Link>
                    </>
                ) : (
                    <button className={styles.logoutBtn} onClick={() => alert('Logging out...')}>Logout</button>
                )}
            </div>
        </nav>
    );
}