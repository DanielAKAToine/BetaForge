import { useEffect, useState } from 'react';
import { db, auth } from '../firebase/config';
import { addDoc, collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { toast } from 'react-toastify';
import styles from './ExploreProjects.module.css';

export default function ExploreProjects() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState(null);
    const [favorites, setFavorites] = useState([]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                try {
                    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setUserRole(userData.profileType);
                        setFavorites(userData.favoriteProjects || []);
                    }
                } catch (error) {
                    console.error("Error fetching user role/favorites:", error);
                }
            } else {
                setUserRole(null);
                setFavorites([]);
            }
        });
        return () => unsubscribe()
    }, []);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "projects"));
                const list = [];

                console.log("Projects found on Firestore:", querySnapshot.size);

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

    const handleToggleFavorite = async (projectId) => {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            toast.error("You must be logged in to favorite projects.");
            return;
        }

        let updatedFavorites = [];

        if (favorites.includes(projectId)) {
            updatedFavorites = favorites.filter(id => id !== projectId);
            toast.info("Removed from favorites.");
        } else {
            updatedFavorites = [...favorites, projectId];
            toast.success("Added to favorites! ⭐");
        }

        setFavorites(updatedFavorites);

        try {
            const userRef = doc(db, "users", currentUser.uid);
            await updateDoc(userRef, {
                favoriteProjects: updatedFavorites
            });
        } catch (error) {
            console.error("Error updating favorites in DB:", error);
            toast.error("Failed to sync favorites with database.");
        }
    };

    const handleApply = async (projectId, projectName, developerId) => {
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                toast.error("You must be logged in to apply.");
                return;
            }

            const q = query(
                collection(db, "applications"),
                where("projectId", "==", projectId),
                where("playerUid", "==", currentUser.uid)
            );

            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                toast.warn("You have already applied for this project!");
                return;
            }
            await addDoc(collection(db, "applications"), {
                projectId: projectId,
                projectName: projectName,
                developerId: developerId || "",
                playerUid: currentUser.uid,
                playerEmail: currentUser.email,
                status: "pending",
                appliedAt: new Date(),
                keyAssigned: ""
            });

            toast.success(`⚡ Application sent for ${projectName}!`);
        } catch (error) {
            console.error("Error saving application:", error);
            toast.error("Failed to submit application.");
        }
    };

    if (loading) {
        return <div className={styles.loader}>Loading Beta Projects...</div>;
    }

    const sortedProjects = [...projects].sort((a, b) => {
        const aFav = favorites.includes(a.id);
        const bFav = favorites.includes(b.id);
        if (aFav && !bFav) return -1;
        if (!aFav && bFav) return 1;
        return 0;
    });

    return (
        <div className={styles.exploreContainer}>
            <h2 className={styles.title}>Explore Available Projects</h2>
            <p className={styles.subtitle}>Discover upcoming games, check requirements, and apply for playtests.</p>

            {sortedProjects.length === 0 ? (
                <p className={styles.noProjects}>No projects available for testing right now.</p>
            ) : (
                <div className={styles.projectsGrid}>
                    {sortedProjects.map((project) => {
                        const isFavorite = favorites.includes(project.id);

                        return (
                            <div key={project.id} className={`${styles.projectCard} ${isFavorite ? styles.favoritedCard : ''}`}>
                                <div className={styles.cardHeader}>
                                    <div className={styles.titleContainer}>
                                        <h3>{project.name}</h3>

                                        {userRole === 'player' && (
                                            <button
                                                onClick={() => handleToggleFavorite(project.id)}
                                                className={`${styles.favoriteBtn} ${isFavorite ? styles.activeFavorite : ''}`}
                                                title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                                            >
                                                {isFavorite ? '★' : '☆'}
                                            </button>
                                        )}
                                    </div>
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
                                            onClick={() => handleApply(project.id, project.name, project.developerId)}
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
                        );
                    })}
                </div>
            )}
        </div>
    );
}