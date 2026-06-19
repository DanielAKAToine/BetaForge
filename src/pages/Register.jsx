import { useState } from 'react';
import styles from './Register.module.css';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, signOut, sendEmailVerification } from 'firebase/auth';
import { auth } from '../firebase/config';
import { toast } from 'react-toastify';


export default function Register() {
    const navigate = useNavigate();

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [birthdate, setBirthdate] = useState('');
    const [profileType, setProfileType] = useState('player');
    const [loading, setLoading] = useState(false);

    const [devType, setDevType] = useState('independent');
    const [mainProject, setMainProject] = useState('');
    const [studioName, setStudioName] = useState('');

    const [error, setError] = useState('');

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');

        if (!firstName || !lastName || !email || !password || !confirmPassword || !birthdate) {
            setError('Please fill in all fields.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(password)) {
            setError('Password must be at least 8 characters long, contain at least one uppercase letter and one number.');
            return;
        }

        if (profileType === 'developer' && (!mainProject)) {
            setError("Please specify your main project name.");
            return;
        }


        const today = new Date();
        const dob = new Date(birthdate);
        let age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
            age--;
        }

        if (age < 18) {
            setError('You must be at least 18 years old to register in BetaForge.');
            return;
        }

        if (age > 120) {
            setError('Are you still alive? Please enter a valid birthdate.');
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await sendEmailVerification(userCredential.user);
            await signOut(auth);
            toast.success('Account created successfully! Please check your email to verify your account.')
            navigate('/login');

        } catch (err) {
            console.error(err.code);
            if (err.code === 'auth/email-already-in-use') {
                setError('This email is already registered.');
            } else if (err.code === 'auth/invalid-email') {
                setError('Please enter a valid email address.');
            } else {
                setError('An error occurred during registration.');
            }
        }
        finally {
            setLoading(false);
        }

    };

    return (
        <div className={styles.registerContainer}>
            <h2>Create New Account</h2>
            {error && <p className={styles.error}>{error}</p>}

            <form onSubmit={handleRegister}>
                <div className={styles.row}>
                    <div className={styles.formGroup}>
                        <label>First Name *</label>
                        <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="Enter your first name"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Last Name *</label>
                        <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Enter your last name"
                        />
                    </div>
                </div>

                <div className={styles.formGroup}>
                    <label>Email Address *</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="example@mail.com"
                    />
                </div>

                <div className={styles.row}>
                    <div className={styles.formGroup}>
                        <label>Password *</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Minimum 8 characters, 1 uppercase, 1 number"
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Confirm Password *</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter your password"
                        />
                    </div>
                </div>

                <div className={styles.formGroup}>
                    <label>Birthdate *</label>
                    <input
                        type="date"
                        value={birthdate}
                        onChange={(e) => setBirthdate(e.target.value)}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label>Profile Type *</label>
                    <select value={profileType} onChange={(e) => setProfileType(e.target.value)}>
                        <option value="player">Player/Tester</option>
                        <option value="developer">Developer</option>
                    </select>
                </div>

                {profileType === 'developer' && (
                    <div className={styles.formGroup}>
                        <h3>Developer Details</h3>
                        <div className={styles.formGroup}>
                            <label>Developer Type *</label>
                            <select value={devType} onChange={(e) => setDevType(e.target.value)}>
                                <option value="independent">Independent</option>
                                <option value="studio">Studio</option>
                            </select>
                        </div>

                        {devType === 'studio' && (
                            <div className={styles.formGroup}>
                                <label>Studio Name (Optional)</label>
                                <input
                                    type="text"
                                    value={studioName}
                                    onChange={(e) => setStudioName(e.target.value)}
                                    placeholder="Enter your studio name"
                                />
                            </div>
                        )}

                        <div className={styles.formGroup}>
                            <label>Main Project Name *</label>
                            <input
                                type="text"
                                value={mainProject}
                                onChange={(e) => setMainProject(e.target.value)}
                                placeholder="Enter your main project name" />
                        </div>
                    </div>
                )}
                <button type="submit" className={styles.submitButton} disabçed={loading}>
                    {loading ? 'Creating Account...' : 'Register Account'}
                </button>
            </form>
        </div>
    );
}   
