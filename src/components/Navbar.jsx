import { Link } from 'react-router-dom';
import styles from './Navbar.module.css';

export default function Navbar() {
    return (
        <nav className={styles.navbar}>
            <Link to="/" className={styles.navLink}>Home</Link>
            <Link to="/login" className={styles.navLink}>Login</Link>
            <Link to="/register" className={styles.navLink}>Register</Link>
        </nav>
    );
}