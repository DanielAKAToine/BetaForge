import { useEffect, useState } from 'react';
import { db, auth } from '../firebase/config';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import styles from './PlayerKeys.module.css';

function CountdownTimer({ approvedAtMillis }) {
    const fifteenDaysInMs = 15 * 24 * 60 * 60 * 1000;
    const expirationTime = approvedAtMillis + fifteenDaysInMs;
    const [timeLeft, setTimeLeft] = useState(expirationTime - Date.now());

    useEffect(() => {
        if (timeLeft <= 0) return;

        const interval = setInterval(() => {
            const remaining = expirationTime - Date.now();
            setTimeLeft(remaining);
            if (remaining <= 0) {
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [expirationTime]);

    if (timeLeft <= 0) {
        return <span style={{ color: '#ff0055', fontWeight: 'bold' }}>❌ Expired (15 days ended)</span>;
    }

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    return (
        <span style={{ color: '#00ffaa', fontFamily: 'monospace' }}>
            ⏳ {days}d {hours}h {minutes}m {seconds}s left
        </span>
    );
}

export default function PlayerKeys() {
    const [myApps, setMyApps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeApp, setActiveApp] = useState(null);
    const [rating, setRating] = useState(5);
    const [feedback, setFeedback] = useState('');
    const [bugsReport, setBugsReport] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [specs, setSpecs] = useState({ cpu: '', gpu: '', ram: '', os: '', deviceModel: '' });
    const [reviewedProjectIds, setReviewedProjectIds] = useState([]);


    const fetchMyApplications = async () => {
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) return;

            const qApps = query(
                collection(db, "applications"),
                where("playerUid", "==", currentUser.uid)
            );

            const querySnapshot = await getDocs(qApps);
            const list = [];
            querySnapshot.forEach((doc) => {
                list.push({ id: doc.id, ...doc.data() });
            });

            setMyApps(list);

            const qReviews = query(
                collection(db, "reviews"),
                where("playerUid", "==", currentUser.uid)
            );
            const querySnapshotReviews = await getDocs(qReviews);
            const reviewedIds = [];
            querySnapshotReviews.forEach((doc) => {
                reviewedIds.push(doc.data().projectId);
            });
            setReviewedProjectIds(reviewedIds);

        } catch (error) {
            console.error(error);
            toast.error("Failed to load dashboard.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyApplications();
    }, []);

    const openReviewModal = (app) => {
        setActiveApp(app);
        setIsModalOpen(true);
    };

    const closeReviewModal = () => {
        setIsModalOpen(false);
        setActiveApp(null);
        setRating(5);
        setFeedback('');
        setBugsReport('');
        setSpecs({ cpu: '', gpu: '', ram: '', os: '', deviceModel: '' });
    };

    const checkIsConsole = (app) => {
        if (!app) return false;

        if (app.platform) {
            return app.platform.toLowerCase().includes('consol');
        }

        if (app.projectName?.toLowerCase() === 'tetris') return true;

        return false;
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();

        const isConsole = checkIsConsole(activeApp);

        if (isConsole && !specs.deviceModel) {
            toast.error("Please specify your Console Model!");
            return;
        }
        if (!isConsole && (!specs.cpu || !specs.gpu || !specs.ram || !specs.os)) {
            toast.error("Please fill in all mandatory PC hardware fields!");
            return;
        }
        if (!feedback) {
            toast.error("Please fill in your general feedback!");
            return;
        }

        setSubmitting(true);
        try {
            await addDoc(collection(db, "reviews"), {
                projectId: activeApp.projectId,
                projectName: activeApp.projectName,
                developerId: activeApp.developerId,
                playerUid: auth.currentUser.uid,
                playerEmail: auth.currentUser.email,
                rating: Number(rating),
                feedback: feedback.trim(),
                bugsReport: bugsReport.trim() || "No bugs reported.",
                hardwareSpecs: specs,
                platform: activeApp.platform || (isConsole ? "Consola" : "PC"),
                createdAt: new Date()
            });

            toast.success("Review and technical specs transmitted successfully!");
            setReviewedProjectIds(prev => [...prev, activeApp.projectId]);
            closeReviewModal();
        } catch (error) {
            console.error("Error submitting review:", error);
            toast.error("Failed to submit feedback.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className={styles.loader}>Loading your access dashboard...</div>;

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>My Testing Dashboard</h2>
            <p className={styles.subtitle}>Track your application status, access beta keys, and submit feedback.</p>

            {myApps.length === 0 ? (
                <p className={styles.noData}>You haven't applied for any playtests yet.</p>
            ) : (
                <div className={styles.list}>
                    {myApps.map((app) => {
                        const approvedTime = app.approvedAt?.toMillis() || app.appliedAt?.toMillis() || Date.now();
                        const isExpired = (approvedTime + 15 * 24 * 60 * 60 * 1000) - Date.now() <= 0;

                        return (
                            <div key={app.id} className={`${styles.card} ${styles[app.status]}`}>
                                <div className={styles.cardHeader}>
                                    <h3>{app.projectName}</h3>
                                    <span className={`${styles.statusBadge} ${styles[app.status]}`}>{app.status}</span>
                                </div>
                                <div className={styles.cardBody}>
                                    {app.status === 'pending' && <p className={styles.infoText}>⏳ The developer is reviewing your profile.</p>}
                                    {app.status === 'rejected' && <p className={styles.infoText}>❌ This application was not accepted.</p>}
                                    {app.status === 'approved' && (
                                        <div className={styles.approvedSection}>
                                            <div className={styles.keyBox}>
                                                <strong>🔑 Beta Key:</strong>
                                                <code>{app.keyAssigned}</code>
                                            </div>
                                            <div className={styles.timerRow}>
                                                <CountdownTimer approvedAtMillis={approvedTime} />
                                            </div>
                                            <button
                                                className={styles.reviewBtn}
                                                disabled={isExpired || reviewedProjectIds.includes(app.projectId)}
                                                onClick={() => openReviewModal(app)}
                                            >
                                                {reviewedProjectIds.includes(app.projectId)
                                                    ? "✅ Review already submitted"
                                                    : "✍️ Submit Review & Bugs"
                                                }
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}


            {isModalOpen && activeApp && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h3>Submit Playtest Report: <span className={styles.gameHighlight}>{activeApp.projectName}</span></h3>
                            <button className={styles.closeBtn} onClick={closeReviewModal}>&times;</button>
                        </div>

                        <form onSubmit={handleReviewSubmit} className={styles.modalForm}>
                            <div className={styles.formGroup}>
                                <label>Score / Rating (1-5 Stars):</label>
                                <select value={rating} onChange={(e) => setRating(e.target.value)} className={styles.selectInput}>
                                    <option value="5">⭐⭐⭐⭐⭐ (Excellent)</option>
                                    <option value="4">⭐⭐⭐⭐ (Good)</option>
                                    <option value="3">⭐⭐⭐ (Average)</option>
                                    <option value="2">⭐⭐ (Bad)</option>
                                    <option value="1">⭐ (Unplayable)</option>
                                </select>
                            </div>

                            <div className={styles.specsSection}>
                                <h4>🖥️ Platform Specifications (Mandatory)</h4>

                                {checkIsConsole(activeApp) ? (
                                    <div className={styles.specsGridFull}>
                                        <input
                                            type="text"
                                            placeholder="Console Model (ex: PlayStation 5, Xbox Series S, Nintendo Switch)"
                                            value={specs.deviceModel}
                                            onChange={(e) => setSpecs({ ...specs, deviceModel: e.target.value })}
                                            required
                                        />
                                        <input
                                            type="text"
                                            placeholder="System Firmware Version - Optional (ex: v11.50)"
                                            value={specs.os}
                                            onChange={(e) => setSpecs({ ...specs, os: e.target.value })}
                                        />
                                    </div>
                                ) : (
                                    <div className={styles.specsGrid}>
                                        <input type="text" placeholder="CPU (ex: Ryzen 5 5600X)" value={specs.cpu} onChange={(e) => setSpecs({ ...specs, cpu: e.target.value })} required />
                                        <input type="text" placeholder="GPU (ex: RTX 3060 Ti)" value={specs.gpu} onChange={(e) => setSpecs({ ...specs, gpu: e.target.value })} required />
                                        <input type="text" placeholder="RAM Amount (ex: 16GB)" value={specs.ram} onChange={(e) => setSpecs({ ...specs, ram: e.target.value })} required />
                                        <input type="text" placeholder="Operating System (ex: Windows 11)" value={specs.os} onChange={(e) => setSpecs({ ...specs, os: e.target.value })} required />
                                    </div>
                                )}
                            </div>

                            <div className={styles.formGroup}>
                                <label>General Feedback & Gameplay Impressions *</label>
                                <textarea rows="3" placeholder="What did you think of the mechanics, controls, art and overall fun?" value={feedback} onChange={(e) => setFeedback(e.target.value)} required></textarea>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Bugs & Technical Issues Found (Optional)</label>
                                <textarea rows="3" placeholder="Describe crashes, glitches, frame drops or UI clipping errors..." value={bugsReport} onChange={(e) => setBugsReport(e.target.value)}></textarea>
                            </div>

                            <div className={styles.modalActions}>
                                <button type="button" className={styles.cancelBtn} onClick={closeReviewModal}>Cancel</button>
                                <button type="submit" className={styles.submitReportBtn} disabled={submitting}>
                                    {submitting ? "Sending Report..." : "🚀 Transmit Report to Developer"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}