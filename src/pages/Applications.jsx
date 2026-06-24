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
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [selectedReview, setSelectedReview] = useState(null);
    const [checkingReviewId, setCheckingReviewId] = useState(null);

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
                keyAssigned: generatedKey,
                approvedAt: newStatus === 'approved' ? new Date() : null
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

    const handleCheckPlayerReview = async (app) => {
        setCheckingReviewId(app.id);
        try {
            const q = query(
                collection(db, "reviews"),
                where("projectId", "==", app.projectId),
                where("playerUid", "==", app.playerUid)
            );

            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                let reviewData = null;
                querySnapshot.forEach((doc) => {
                    reviewData = { id: doc.id, ...doc.data() };
                });
                setSelectedReview(reviewData);
                setIsReviewModalOpen(true);
            } else {
                toast.info("This tester has not submitted their playtest report yet. (Review Pending)");
            }
        } catch (error) {
            console.error("Error fetching review:", error);
            toast.error("Failed to check playtest report.");
        } finally {
            setCheckingReviewId(null);
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

                            <div style={{
                                background: 'rgba(0, 0, 0, 0.2)',
                                padding: '12px',
                                borderRadius: '6px',
                                margin: '12px 0',
                                fontSize: '0.9rem',
                                borderLeft: '3px solid #ffaa00'
                            }}>
                                <strong style={{ color: '#ffaa00', display: 'block', marginBottom: '4px', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                                    💬 Tester Motivation / Specs:
                                </strong>
                                <p style={{ margin: 0, color: '#e4e4e7', lineHeight: '1.4' }}>
                                    {app.conteudo || "No motivation provided."}
                                </p>
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
                                    <div style={{ width: '100%' }}>
                                        <div className={styles.keyBox}>
                                            <span><strong>🔑 Assigned Beta Key:</strong></span>
                                            <code>{app.keyAssigned}</code>
                                        </div>

                                        <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => handleCheckPlayerReview(app)}
                                                disabled={checkingReviewId === app.id}
                                                style={{
                                                    background: 'transparent',
                                                    border: '1px solid #00ffaa',
                                                    color: '#00ffaa',
                                                    padding: '6px 14px',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontWeight: '600',
                                                    fontSize: '0.85rem',
                                                    transition: 'all 0.2s ease',
                                                    boxShadow: '0 0 5px rgba(0, 255, 170, 0.1)'
                                                }}
                                                onMouseOver={(e) => {
                                                    e.target.style.background = 'rgba(0, 255, 170, 0.1)';
                                                    e.target.style.boxShadow = '0 0 10px rgba(0, 255, 170, 0.3)';
                                                }}
                                                onMouseOut={(e) => {
                                                    e.target.style.background = 'transparent';
                                                    e.target.style.boxShadow = '0 0 5px rgba(0, 255, 170, 0.1)';
                                                }}
                                            >
                                                {checkingReviewId === app.id ? '⌛ Checking...' : '🔍 View Playtest Report'}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <span className={styles.rejectedText}>This application was rejected.</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isReviewModalOpen && selectedReview && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.85)', display: 'flex', justifyContent: 'center',
                    alignItems: 'center', zIndex: 9999, padding: '20px'
                }}>
                    <div style={{
                        background: '#121225', border: '2px solid #00ffaa', borderRadius: '12px',
                        padding: '25px', width: '100%', maxWidth: '500px', color: '#fff',
                        boxShadow: '0 0 25px rgba(0, 255, 170, 0.25)', position: 'relative'
                    }}>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                            <h3 style={{ margin: 0, color: '#00ffaa', fontSize: '1.3rem' }}>📋 Playtest Report</h3>
                            <button
                                onClick={() => { setIsReviewModalOpen(false); setSelectedReview(null); }}
                                style={{ background: 'none', border: 'none', color: '#ff0055', fontSize: '24px', cursor: 'pointer', lineHeight: '1' }}
                            >
                                &times;
                            </button>
                        </div>

                        <div style={{ marginBottom: '12px', fontSize: '0.9rem', color: '#aaa' }}>
                            <strong>Tester:</strong> <span style={{ color: '#00bcff' }}>{selectedReview.playerEmail}</span>
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <strong>Score:</strong> <span style={{ letterSpacing: '2px', marginLeft: '5px' }}>{"⭐".repeat(selectedReview.rating)}</span>
                        </div>

                        <hr style={{ borderColor: '#232343', margin: '15px 0' }} />

                        <div style={{ marginBottom: '15px' }}>
                            <h4 style={{ margin: '0 0 6px 0', color: '#00bcff', fontSize: '0.95rem' }}>💬 Feedback & Impressions:</h4>
                            <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '12px', borderRadius: '6px', fontSize: '0.9rem', lineHeight: '1.45', color: '#eee' }}>
                                {selectedReview.feedback}
                            </div>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <h4 style={{ margin: '0 0 6px 0', color: '#ff0055', fontSize: '0.95rem' }}>🪲 Bugs & Issues:</h4>
                            <div style={{
                                background: 'rgba(0, 0, 0, 0.3)', padding: '12px', borderRadius: '6px', fontSize: '0.9rem', color: '#eee',
                                borderLeft: selectedReview.bugsReport?.toLowerCase()?.includes('no bugs') ? 'none' : '3px solid #ff0055'
                            }}>
                                {selectedReview.bugsReport}
                            </div>
                        </div>

                        <div style={{ background: '#0a0a16', padding: '12px', borderRadius: '8px', border: '1px solid #1a1a3a' }}>
                            <h5 style={{ margin: '0 0 8px 0', color: '#94a3b8', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                                💻 Hardware Specifications ({selectedReview.platform})
                            </h5>
                            {selectedReview.platform?.toLowerCase()?.includes('consol') ? (
                                <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1' }}>
                                    <strong>Model:</strong> {selectedReview.hardwareSpecs?.deviceModel || 'N/A'}
                                    {selectedReview.hardwareSpecs?.os ? ` (Firmware: ${selectedReview.hardwareSpecs.os})` : ''}
                                </p>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px', fontSize: '0.85rem', color: '#cbd5e1' }}>
                                    <div><strong>CPU:</strong> {selectedReview.hardwareSpecs?.cpu || 'N/A'}</div>
                                    <div><strong>GPU:</strong> {selectedReview.hardwareSpecs?.gpu || 'N/A'}</div>
                                    <div><strong>RAM:</strong> {selectedReview.hardwareSpecs?.ram || 'N/A'}</div>
                                    <div><strong>OS:</strong> {selectedReview.hardwareSpecs?.os || 'N/A'}</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}