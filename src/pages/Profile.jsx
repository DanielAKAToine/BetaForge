import { useEffect, useState } from 'react';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, updateDoc, collection, addDoc, where, query, getDocs } from 'firebase/firestore';
import { toast } from 'react-toastify';
import styles from './Profile.module.css';

export default function Profile() {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [studioName, setStudioName] = useState('');
    const [editingStudio, setEditingStudio] = useState(false);
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [editingProjectId, setEditingProjectId] = useState(null);
    const [newProjectName, setNewProjectName] = useState('');
    const [projects, setProjects] = useState([]);
    const [projectPlatform, setProjectPlatform] = useState('');
    const [projectKeysAmount, setProjectKeysAmount] = useState('');
    const [systemRequirements, setSystemRequirements] = useState('');
    const [rewards, setRewards] = useState('');
    const [endDate, setEndDate] = useState('');
    const [projectVersion, setProjectVersion] = useState('');
    const [playerApps, setPlayerApps] = useState([]);
    const [discord, setDiscord] = useState('');
    const [os, setOs] = useState('');
    const [cpu, setCpu] = useState('');
    const [gpu, setGpu] = useState('');
    const [ram, setRam] = useState('');
    const [isSavingHardware, setIsSavingHardware] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                try {
                    const docRef = doc(db, "users", currentUser.uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setUserData(data);

                        if (data.studioName)
                            setStudioName(data.studioName);

                        if (data.profileType === 'developer') {
                            const q = query(collection(db, "projects"), where("developerId", "==", currentUser.uid));
                            const querySnapshot = await getDocs(q);
                            const projectsList = [];
                            querySnapshot.forEach((doc) => {
                                projectsList.push({ id: doc.id, ...doc.data() });
                            });
                            setProjects(projectsList);
                        }

                        if (data.profileType === 'player' || data.profileType === 'tester') {
                            setDiscord(data.discord || '');
                            setOs(data.hardware?.os || '');
                            setCpu(data.hardware?.cpu || '');
                            setGpu(data.hardware?.gpu || '');
                            setRam(data.hardware?.ram || '');


                            const qApps = query(collection(db, "applications"), where("playerUid", "==", currentUser.uid));
                            const querySnapshotApps = await getDocs(qApps);
                            const appsList = [];
                            querySnapshotApps.forEach((doc) => {
                                const appData = doc.data();
                                appsList.push({
                                    id: doc.id,
                                    projectName: appData.projectName,
                                    status: appData.status
                                });
                            });
                            setPlayerApps(appsList);
                        }
                    }
                }
                catch (error) {
                    console.error("Couldn't load the profile data", error);
                }
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleResetPassword = async () => {
        try {
            const user = auth.currentUser;
            if (!user || !user.email) {
                toast.error("User email not found");
                return;
            }
            await sendPasswordResetEmail(auth, user.email);
            toast.success("Password reset email sent! Check your inbox.");
        }
        catch (error) {
            console.error("Error sending reset email", error);
            toast.error("Failed to send reset email. Try again later.");
        }
    };

    const handleUpdateHardware = async (e) => {
        e.preventDefault();
        setIsSavingHardware(true);
        try {
            const user = auth.currentUser;
            const docRef = doc(db, "users", user.uid);

            const hardwareData = {
                discord: discord.trim(),
                hardware: {
                    os: os.trim(),
                    cpu: cpu.trim(),
                    gpu: gpu.trim(),
                    ram: ram.trim()
                }
            };

            await updateDoc(docRef, hardwareData);

            setUserData(prev => ({ ...prev, ...hardwareData }));
            toast.success("Gaming profile updated successfully!");
        } catch (error) {
            console.error("Error updating hardware:", error);
            toast.error("Failed to update gaming profile.");
        } finally {
            setIsSavingHardware(false);
        }
    };

    const handleUpdateStudio = async (e) => {
        e.preventDefault();
        try {
            const user = auth.currentUser;
            const docRef = doc(db, "users", user.uid);

            await updateDoc(docRef, {
                studioName: studioName,
                devType: 'studio'
            });

            setUserData(prev => ({ ...prev, studioName, devType: 'studio' }));
            setEditingStudio(false);
            toast.success("Studio details update successfully!");
        }
        catch (error) {
            toast.error("Failed to update, try again later.");
        }
    };

    const handleRemoveStudio = async () => {
        if (!window.confirm("Are you sure you want to remove this studio? You will be listed as an independent developer.")) return;

        try {
            const user = auth.currentUser;
            const docRef = doc(db, "users", user.uid);

            await updateDoc(docRef, {
                studioName: "",
                devType: 'individual'
            });

            setUserData(prev => ({ ...prev, studioName: "", devType: 'individual' }));
            setStudioName('');
            setEditingStudio(false);
            toast.success("Studio removed successfully!");
        }
        catch (error) {
            toast.error("Failed to remove studio, try again later.");
        }
    };

    const handleOpenEditModal = (project) => {
        setEditingProjectId(project.id);
        setNewProjectName(project.name);
        setProjectPlatform(project.platform || '');
        setProjectKeysAmount(project.keysAvailable ?? '');
        setSystemRequirements(project.systemRequirements || '');
        setRewards(project.rewards || '');
        setEndDate(project.endDate || '');
        setProjectVersion(project.version || '');
        setIsProjectModalOpen(true);
    };

    const handleCloseProjectModal = () => {
        setIsProjectModalOpen(false);
        setEditingProjectId(null);
        setNewProjectName('');
        setProjectPlatform('');
        setProjectKeysAmount('');
        setSystemRequirements('');
        setRewards('');
        setEndDate('');
        setProjectVersion('');
    };

    const handleSaveProject = async (e) => {
        e.preventDefault();

        if (!newProjectName.trim() || !projectPlatform || !projectKeysAmount || !systemRequirements.trim() || !rewards.trim() || !endDate) {
            toast.error("Please fill in all required fields.");
            return;
        }

        try {
            const user = auth.currentUser;
            const projectData = {
                name: newProjectName.trim(),
                platform: projectPlatform,
                keysAvailable: Number(projectKeysAmount),
                systemRequirements: systemRequirements.trim(),
                rewards: rewards.trim(),
                endDate: endDate,
                version: projectVersion.trim() || "Alpha/Beta",
                developerId: user.uid,
                studioName: userData.studioName || "Independent Developer",
            };

            if (editingProjectId) {
                const projectDocRef = doc(db, "projects", editingProjectId);
                await updateDoc(projectDocRef, projectData);

                setProjects(prev => prev.map(proj =>
                    proj.id === editingProjectId ? { id: editingProjectId, ...projectData } : proj
                ));
                toast.success("Project updated successfully!");
            } else {
                const docRef = await addDoc(collection(db, "projects"), {
                    ...projectData,
                    createdAt: new Date()
                });

                setProjects(prev => [...prev, { id: docRef.id, ...projectData }]);
                toast.success("Project published successfully!");
            }

            handleCloseProjectModal();
        }
        catch (error) {
            console.error("Error saving project", error);
            toast.error("Failed to save project. Try again later.");
        }
    };

    const handleSetMainProject = async (projectName) => {
        try {
            const user = auth.currentUser;
            const docRef = doc(db, "users", user.uid);

            await updateDoc(docRef, {
                mainProject: projectName
            });

            setUserData(prev => ({ ...prev, mainProject: projectName }));
            toast.success(`"${projectName}" set as Main Project!`);
        } catch (error) {
            console.error("Error updating main project:", error);
            toast.error("Failed to update Main Project.");
        }
    };

    if (loading) return <div className={styles.loading}>Loading Profile...</div>;
    if (!userData) return <div className={styles.error}>Please log in to view your profile.</div>;

    return (
        <div className={styles.profileContainer}>
            <div className={styles.profileCard}>
                <h2> Welcome, {userData.firstName} {userData.lastName}!</h2>
                <p className={styles.badge}>{userData.profileType.toUpperCase()}</p>

                <div className={styles.infoSection}>
                    <h3>Personal Information</h3>
                    <p><strong>Email: </strong> {userData.email}</p>
                    <p><strong>Birthdate: </strong> {userData.birthdate}</p>
                    <button onClick={handleResetPassword} className={styles.passwordBtn}>🔒 Change Password</button>
                </div>

                {(userData.profileType === 'player' || userData.profileType === 'tester') && (
                    <div className={styles.playerSection}>
                        <hr className={styles.divider} />

                        <div className={styles.hardwareSection}>
                            <h3>🖥️ Gaming Profile & Specs</h3>
                            <form onSubmit={handleUpdateHardware} className={styles.hardwareForm}>
                                <div className={styles.formRow}>
                                    <div className={styles.inputGroup}>
                                        <label>Discord Tag</label>
                                        <input type="text" value={discord} onChange={(e) => setDiscord(e.target.value)} placeholder="e.g. daniel_dev" />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label>Operating System</label>
                                        <input type="text" value={os} onChange={(e) => setOs(e.target.value)} placeholder="e.g. Windows 11 / macOS" />
                                    </div>
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.inputGroup}>
                                        <label>Processor (CPU)</label>
                                        <input type="text" value={cpu} onChange={(e) => setCpu(e.target.value)} placeholder="e.g. AMD Ryzen 5 5600X" />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label>Graphics Card (GPU)</label>
                                        <input type="text" value={gpu} onChange={(e) => setGpu(e.target.value)} placeholder="e.g. NVIDIA RTX 4060" />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label>RAM Memory</label>
                                        <input type="text" value={ram} onChange={(e) => setRam(e.target.value)} placeholder="e.g. 16GB / 32GB" />
                                    </div>
                                </div>

                                <button type="submit" className={styles.saveHardwareBtn} disabled={isSavingHardware}>
                                    {isSavingHardware ? "Saving..." : "💾 Save Specs"}
                                </button>
                            </form>
                        </div>

                        <hr className={styles.divider} />

                        <div className={styles.gamingHubSection}>
                            <h3>🎮 My Testing Games</h3>
                            {playerApps.length === 0 ? (
                                <p className={styles.noProjects}>You haven't applied to any playtests yet.</p>
                            ) : (
                                <div className={styles.miniAppsGrid}>
                                    {playerApps.map((app) => (
                                        <div key={app.id} className={styles.miniAppCard}>
                                            <span className={styles.miniAppName}>{app.projectName}</span>
                                            <span className={`${styles.miniStatusBadge} ${styles[app.status?.toLowerCase()] || ''}`}>
                                                {app.status || 'Pending'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {userData.profileType === 'developer' && (
                    <div className={styles.devSection}>
                        <h3>Developer Management</h3>
                        <p><strong>Studio/Company: </strong> {userData.studioName || <em>No studio linked yet</em>}

                            {userData.studioName && !editingStudio && (
                                <button onClick={() => {
                                    setStudioName(userData.studioName);
                                    setEditingStudio(true);
                                }}
                                    className={styles.editIconBtn}>✏️Edit</button>
                            )}
                        </p>

                        {!userData.studioName && !editingStudio && (
                            <button onClick={() => setEditingStudio(true)} className={styles.actionBtn}> Add Studio/Company </button>
                        )}

                        {editingStudio && (
                            <form onSubmit={handleUpdateStudio} className={styles.studioForm}>
                                <input
                                    type="text"
                                    value={studioName}
                                    onChange={(e) => setStudioName(e.target.value)}
                                    placeholder="Enter company or studio name"
                                    required
                                />
                                <div className={styles.formActions}>
                                    <button type="submit" className={styles.saveBtn}>Save</button>

                                    {userData.studioName && (
                                        <button type="button" onClick={handleRemoveStudio} className={styles.removeBtn}> Delete Studio </button>
                                    )}

                                    <button type="button" onClick={() => setEditingStudio(false)} className={styles.cancelBtn}>Cancel</button>
                                </div>
                            </form>
                        )}
                        <div className={styles.myProjectsSection}>
                            <h3>My Projects</h3>
                            {projects.length === 0 ? (
                                <p className={styles.noProjects}>No projects registered yet.</p>
                            ) : (
                                <div className={styles.projectsGrid}>
                                    {projects.map((project) => {
                                        const isMain = userData.mainProject === project.name;

                                        return (
                                            <div key={project.id} className={`${styles.projectCardItem} ${isMain ? styles.mainProjectCard : ''}`}>
                                                <div className={styles.projectInfoText}>
                                                    <h4>{project.name}</h4>
                                                    <div className={styles.projectMetadata}>
                                                        <span className={styles.platformTag}>🎮 {project.platform || "N/A"}</span>
                                                        <span className={styles.keysTag}>🔑 {project.keysAvailable ?? 0} keys left</span>
                                                    </div>
                                                    {isMain && <span className={styles.mainBadge}>👑 Main Project</span>}
                                                </div>
                                                <div className={styles.projectActionsGrid}>
                                                    <button
                                                        onClick={() => handleOpenEditModal(project)}
                                                        className={styles.editProjectIconBtn}>✏️ Edit</button>

                                                    {!isMain && (
                                                        <button
                                                            onClick={() => handleSetMainProject(project.name)}
                                                            className={styles.setMainBtn}> Set as Main </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <hr className={styles.divider} />
                        <button onClick={() => setIsProjectModalOpen(true)} className={styles.createProjectBtn}>➕ Create New Project </button>

                        {isProjectModalOpen && (
                            <div className={styles.modalOverlay}>
                                <div className={styles.modalContent}>
                                    <h3>{editingProjectId ? "Edit Project" : "Create New Project"}</h3>
                                    <form onSubmit={handleSaveProject}>

                                        <div className={styles.modalInputGroup}>
                                            <label>Project Name *</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. SuperCars Extreme Racing"
                                                value={newProjectName}
                                                onChange={(e) => setNewProjectName(e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div className={styles.modalInputGroup}>
                                            <label>Testing Platform *</label>
                                            <select
                                                value={projectPlatform}
                                                onChange={(e) => setProjectPlatform(e.target.value)}
                                                required
                                                className={styles.modalSelect}
                                            >
                                                <option value="">Select platform...</option>
                                                <option value="PC">PC</option>
                                                <option value="Consola">Console</option>
                                                <option value="Android">Android</option>
                                                <option value="iOS">iOS</option>
                                            </select>
                                        </div>

                                        <div className={styles.modalInputGroup}>
                                            <label>Available Keys *</label>
                                            <input
                                                type="number"
                                                min="0"
                                                placeholder="e.g. 100"
                                                value={projectKeysAmount}
                                                onChange={(e) => setProjectKeysAmount(e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div className={styles.modalInputGroup}>
                                            <label>System Requirements *</label>
                                            <textarea
                                                placeholder="e.g. GTX 1060, 16GB RAM, 20GB Storage"
                                                value={systemRequirements}
                                                onChange={(e) => setSystemRequirements(e.target.value)}
                                                required
                                                className={styles.modalTextarea}
                                            />
                                        </div>

                                        <div className={styles.modalInputGroup}>
                                            <label>Tester Rewards / Payment *</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. In-game exclusive skin / 10€ Gift Card"
                                                value={rewards}
                                                onChange={(e) => setRewards(e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div className={styles.modalInputGroup}>
                                            <label>Testing End Date *</label>
                                            <input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                required
                                                className={styles.modalDateInput}
                                            />
                                        </div>

                                        <div className={styles.modalInputGroup}>
                                            <label>Project Version (Optional)</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Beta v1.0.4"
                                                value={projectVersion}
                                                onChange={(e) => setProjectVersion(e.target.value)}
                                            />
                                        </div>

                                        <div className={styles.modalActions}>
                                            <button type="submit" className={styles.saveBtn}>
                                                {editingProjectId ? "Save Changes" : "Create"}
                                            </button>
                                            <button type="button" onClick={handleCloseProjectModal} className={styles.cancelBtn}>Cancel</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}