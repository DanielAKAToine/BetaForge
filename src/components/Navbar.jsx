import { Link, useNavigate } from 'react-router-dom';
import styles from './Navbar.module.css';
import { useEffect, useState } from 'react';
import { auth } from '../firebase/config';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { toast } from 'react-toastify';



export default function Navbar() {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });

        return () => unsubscribe();
    }, []);

    const handleLogout = async (e) => {
        e.preventDefault();
        try {
            await signOut(auth);
            toast.success("Logged out Successfully!");
            navigate('/');
        }
        catch (error) {
            console.error("Error", error);

        }
    };

    return (
        <nav className={styles.navbar}>
            <div className={styles.logo}>
                <Link to="/" className={styles.logo}>BetaForge</Link>
            </div>
            <ul className={styles.navLinks}>
                <li>
                    <Link to="/" className={styles.navLink}>Home</Link>
                </li>
                {user && (
                    <li>
                        <Link to="/profile" className={styles.navLink}>Profile</Link>
                    </li>
                )}
                {user && (

                    <li>
                        <span href="#logout" onClick={handleLogout} className={styles.logoutBtn}>
                            Logout
                        </span>
                    </li>
                )}
                {!user && (

                    <li>
                        <Link to="/login" className={styles.navLink}>Login</Link>
                    </li>
                )}
                {!user && (
                    <li><Link to="/register" className={styles.navLink}>Register</Link></li>

                )}
            </ul>
        </nav>
    );
}