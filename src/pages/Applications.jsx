import { useEffect, useState } from 'react';
import { db, auth } from '../firebase/config';
import { collection, query, where, getDocs, doc, updateDoc, increment } from 'firebase/firestore';
import { toast } from 'react-toastify';
import styles from './Applications.module.css';

const generateSegment = (length = 5) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};


export default function Applications() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchApplications = async () => {
            try {
                const currentUser = auth.currentUser;
                if (!currentUser) return;

                const q = query(
                    collection(db, "applications"),
                    where("developerId", "==", currentUser.uid)
                );

                const querySnapshot = await getDocs(q);
                const list = [];
                querySnapshot.forEach((doc) => {
                    list.push({ id: doc.id, ...doc.data() });
                });

                list.sort((a, b) => b.appliedAt?.toDate() - a.appliedAt?.toDate());
                setApplications(list);
            } catch (error) {
                console.error("Error fetching applications:", error);
                toast.error("Failed to load applications.");
            } finally {
                setLoading(false);
            }
        };

        fetchApplications();
    }, []);

    const handleStatusUpdate = async (appId, projectId, newStatus) => {
        try {
            const generatedKey = newStatus === 'approved'
                ? `BFORGE-${generateSegment()}-${generateSegment()}`
                : "";

            const appRef = doc(db, "applications", appId);
            await updateDoc(appRef, {
                status: newStatus,
                keyAssigned: generatedKey
            });

            if (newStatus === 'approved') {
                const projectRef = doc(db, "projects", projectId);
                await updateDoc(projectRef, {
                    keysAvailable: increment(-1)
                });
            }

            setApplications(prev => prev.map(app =>
                app.id === appId ? { ...app, status: newStatus, keyAssigned: generatedKey } : app
            ));

            toast.success(`Application marked as ${newStatus}!`);
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error("Failed to update application status.");
        }
    };

    if (loading) return <div className={styles.loader}>Loading incoming requests...</div>;

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Tester Applications</h2>
            <p className={styles.subtitle}>Review playtest requests and distribute access keys to game testers.</p>

            {applications.length === 0 ? (
                <p className={styles.noData}>No applications received for your projects yet.</p>
            ) : (
                <div className={styles.list}>
                    {applications.map((app) => (
                        <div key={app.id} className={`${styles.card} ${styles[app.status]}`}>
                            <div className={styles.cardHeader}>
                                <div>
                                    <h3>{app.projectName}</h3>
                                    <p className={styles.testerEmail}>From: <span>{app.playerEmail}</span></p>
                                </div>
                                <span className={`${styles.statusBadge} ${styles[app.status]}`}>
                                    {app.status.toUpperCase()}
                                </span>
                            </div>

                            <div className={styles.cardActions}>
                                {app.status === 'pending' ? (
                                    <>
                                        <button
                                            className={styles.approveBtn}
                                            onClick={() => handleStatusUpdate(app.id, app.projectId, 'approved')}
                                        >
                                            ✅ Approve & Send Key
                                        </button>
                                        <button
                                            className={styles.rejectBtn}
                                            onClick={() => handleStatusUpdate(app.id, app.projectId, 'rejected')}
                                        >
                                            ❌ Reject
                                        </button>
                                    </>
                                ) : app.status === 'approved' ? (
                                    <div className={styles.keyBox}>
                                        <span><strong>🔑 Assigned Beta Key:</strong></span>
                                        <code>{app.keyAssigned}</code>
                                    </div>
                                ) : (
                                    <span className={styles.rejectedText}>This application was rejected.</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}