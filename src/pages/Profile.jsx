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
    const [newProjectName, setNewProjectName] = useState('');
    const [projects, setProjects] = useState([]);
    const [updatingMainRef, setUpdatingMainRef] = useState(false);

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
                    }
                }
                catch (error) {
                    console.error("Could'nt load the profile data", error);

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
                devType: 'individual' // Altera o tipo de dev para individual/indie
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

    const handleCreateProject = async (e) => {
        e.preventDefault();

        if (!newProjectName.trim())
            return;

        try {
            const user = auth.currentUser;
            const docRef = await addDoc(collection(db, "projects"), {
                name: newProjectName.trim(),
                developerId: user.uid,
                studioName: userData.studioName || "Independent Developer",
                createAt: new Date()
            });

            const newProjectData = {
                id: docRef.id,
                name: newProjectName.trim(),
                developerId: user.uid,
                studioName: userData.studioName || "Independent Developer",
            };

            setProjects(prev => [...prev, newProjectData]);
            toast.success("Project created successfully!");
            setNewProjectName('');
            setIsProjectModalOpen(false);
        }

        catch (error) {
            console.error("Error creating project", error);
            toast.error("Failed to create project. Try again later.");
        }
        finally {
            setLoading(false);
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
                                                    {isMain && <span className={styles.mainBadge}>👑 Main Project</span>}
                                                </div>
                                                {!isMain && (
                                                    <button
                                                        onClick={() => handleSetMainProject(project.name)}
                                                        className={styles.setMainBtn}> Set as Main </button>
                                                )}
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
                                    <h3>Create New Project</h3>
                                    <form onSubmit={handleCreateProject}>
                                        <div className={styles.modalInputGroup}>
                                            <label>Project Name:</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. SuperCars Extreme Racing"
                                                value={newProjectName}
                                                onChange={(e) => setNewProjectName(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className={styles.modalActions}>
                                            <button type="submit" className={styles.saveBtn}>Create</button>
                                            <button type="button" onClick={() => setIsProjectModalOpen(false)} className={styles.cancelBtn}>Cancel</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div >
    );
}





