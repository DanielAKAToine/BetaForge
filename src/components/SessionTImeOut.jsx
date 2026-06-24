import { useEffect } from 'react';
import { auth } from '../firebase/config';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function SessionTimeout() {
    const navigate = useNavigate();

    useEffect(() => {
        const TIMEOUT_LIMIT = 60 * 60 * 1000;
        const handleLogout = async () => {
            try {
                await signOut(auth);
                localStorage.removeItem('login_time');
                toast.warning("Sua sessão expirou após 1 hora. Por favor, faça login novamente.");
                navigate('/login');
            } catch (error) {
                console.error("Erro ao fazer logout por timeout:", error);
            }
        };
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                if (!localStorage.getItem('login_time')) {
                    localStorage.setItem('login_time', Date.now().toString());
                }
                const loginTime = parseInt(localStorage.getItem('login_time') || '0', 10);
                const timePassed = Date.now() - loginTime;

                if (timePassed >= TIMEOUT_LIMIT) {
                    handleLogout();
                } else {
                    const timeLeft = TIMEOUT_LIMIT - timePassed;
                    const timer = setTimeout(() => {
                        handleLogout();
                    }, timeLeft);
                    return () => clearTimeout(timer);
                }
            } else {
                localStorage.removeItem('login_time');
            }
        });

        return () => unsubscribe();
    }, [navigate]);

    return null;
}