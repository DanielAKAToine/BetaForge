import { useEffect, useState } from 'react';
import { db, auth } from '../firebase/config';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { toast } from 'react-toastify';
import styles from './ExploreProjects.module.css';

export default function ExploreProjects() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                try {
                    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                    if (userDoc.exists()) {
                        setUserRole(userDoc.data().profileType);
                    }
                } catch (error) {
                    console.error("Error fetching user role:", error);
                }
            } else {
                setUserRole(null);
            }
        });
        return () => unsubscribe()
    }, []);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "projects"));
                const list = [];

                // Log útil para veres na consola se o Firebase está a responder
                console.log("Projetos encontrados no Firestore:", querySnapshot.size);

                querySnapshot.forEach((doc) => {
                    list.push({ id: doc.id, ...doc.data() });
                });
                setProjects(list);
            } catch (error) {
                console.error("Error fetching projects:", error);
                toast.error("Failed to load projects.");
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, []);

    const handleApply = async (projectId, projectName) => {
        toast.info(`Application sent for ${projectName}`);
    };

    if (loading) {
        return <div className={styles.loader}>Loading Beta Projects...</div>;
    }

    return (
        <div className={styles.exploreContainer}>
            <h2 className={styles.title}>Explore Available Projects</h2>
            <p className={styles.subtitle}>Discover upcoming games, check requirements, and apply for playtests.</p>

            {projects.length === 0 ? (
                <p className={styles.noProjects}>No projects available for testing right now.</p>
            ) : (
                <div className={styles.projectsGrid}>
                    {projects.map((project) => (
                        <div key={project.id} className={styles.projectCard}>
                            <div className={styles.cardHeader}>
                                <h3>{project.name}</h3>
                                <span className={styles.platformBadge}>🎮 {project.platform}</span>
                            </div>

                            <p className={styles.studioName}>Developed by: <span>{project.studioName}</span></p>

                            <div className={styles.cardBody}>
                                <div className={styles.infoSection}>
                                    <strong>🖥️ System Requirements:</strong>
                                    <p>{project.systemRequirements}</p>
                                </div>

                                <div className={styles.infoSection}>
                                    <strong>🎁 Tester Rewards:</strong>
                                    <p>{project.rewards}</p>
                                </div>

                                <div className={styles.metadataGrid}>
                                    <div>
                                        <strong>🔑 Keys Left:</strong>
                                        <span className={styles.keysCount}>{project.keysAvailable}</span>
                                    </div>
                                    <div>
                                        <strong>📅 End Date:</strong>
                                        <span>{project.endDate}</span>
                                    </div>
                                    {project.version && (
                                        <div>
                                            <strong>📦 Version:</strong>
                                            <span>{project.version}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className={styles.cardActions}>
                                {userRole === 'player' ? (
                                    <button
                                        className={styles.applyBtn}
                                        onClick={() => handleApply(project.id, project.name)}
                                        disabled={project.keysAvailable <= 0}
                                    >
                                        {project.keysAvailable > 0 ? "⚡ Apply for Playtest" : "❌ Out of Keys"}
                                    </button>
                                ) : userRole === 'developer' ? (
                                    <span className={styles.devNotice}>🔒 View Only (Developer Account)</span>
                                ) : (
                                    <span className={styles.visitorNotice}>🔑 Login as Player to Apply</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}