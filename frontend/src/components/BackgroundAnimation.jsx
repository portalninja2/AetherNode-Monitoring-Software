import React, { useEffect } from 'react';
import './BackgroundAnimation.css';

const BackgroundAnimation = () => {
    useEffect(() => {
        const handleMouseMove = (e) => {
            const x = e.clientX / window.innerWidth;
            const y = e.clientY / window.innerHeight;

            document.documentElement.style.setProperty('--mouse-x', x.toString());
            document.documentElement.style.setProperty('--mouse-y', y.toString());
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div className="background-animation">
            <div className="orb orb-1"></div>
            <div className="orb orb-2"></div>
            <div className="grid-overlay"></div>
        </div>
    );
};

export default BackgroundAnimation;
