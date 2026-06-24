import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Navbar from './components/Navbar';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import BackgroundSlider from './components/Background';
import Profile from './pages/Profile';
import ForgotPassword from './pages/ForgotPassword';
import ExploreProjects from './pages/ExploreProjects';
import Applications from './pages/Applications';
import PlayerKeys from './pages/PlayerKeys';
import SessionTimeout from './components/SessionTImeOut';

export default function App() {
    return (
        <BrowserRouter>
            <SessionTimeout />
            <BackgroundSlider />
            <Navbar />
            <div style={{ padding: '20px' }}>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/explore" element={<ExploreProjects />} />
                    <Route path="/applications" element={<Applications />} />
                    <Route path="/myapplications" element={<PlayerKeys />} />
                </Routes>
            </div>
            <ToastContainer position="top-center" autoClose={3000} theme="dark" />
        </BrowserRouter>
    );
}