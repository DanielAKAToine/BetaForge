import { useEffect, useState } from 'react';
import imagem1 from '../assets/imagem1.jpg';
import imagem2 from '../assets/imagem2.jpg';
import imagem3 from '../assets/imagem3.jpg';
import imagem4 from '../assets/imagem4.jpg';
import imagem5 from '../assets/imagem5.jpg';
import imagem6 from '../assets/imagem6.jpg';

const backgroundImages = [imagem1, imagem2, imagem3, imagem4, imagem5, imagem6];

export default function BackgroundSlider() {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex((prevIndex) => (prevIndex + 1) % backgroundImages.length);
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: -1,
                backgroundColor: '#121214',
            }}>
            {backgroundImages.map((image, index) => (
                <div
                    key={index}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundImage: `url(${image})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        filter: 'brightness(0.20) contrast(1.05) saturate(1.1)',
                        opacity: index === currentImageIndex ? 1 : 0,
                        transition: 'opacity 2.0s ease-in-out',
                    }}
                />
            ))}
        </div>
    );
}
