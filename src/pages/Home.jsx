import styles from './Home.module.css';
import { useNavigate } from 'react-router-dom';

export default function Home() {
    const navigate = useNavigate();
    return (
        <div className={styles.homeContainer}>
            <section className={styles.heroContainer}>
                <h1>Welcome to BetaForge</h1>
                <p>The ultimate forge for game developers and passionate testers.
                    Publish your projects, gather feedback, and forge the future of gaming.</p>

                <button
                    className={styles.ctaBtn}
                    onClick={() => navigate('/explore')}>
                    Explore Projects
                </button>
            </section>

            <div className={styles.featuresGrid}>
                <div className={styles.featureCard}>
                    <h3>Explore the Games</h3>
                    <p>Discover independent games fresh out of the forge. Play, test, and find hidden gems before anyone else.</p>
                </div>
                <div className={styles.featureCard}>
                    <h3>Submit Feedback</h3>
                    <p>Help developers squash bugs and improve gameplay mechanics with structured reports and community reviews.</p>
                </div>
                <div className={styles.featureCard}>
                    <h3>Level Up Your Project</h3>
                    <p>Are you a developer? Upload your build, build your community, and turn your prototype into a polished masterpiece.</p>
                </div>
            </div>
        </div>
    );
}

