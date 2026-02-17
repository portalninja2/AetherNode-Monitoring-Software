import React from 'react';
import './Hero.css';

const Hero = ({ title, subtitle }) => {
    return (
        <section className="hero-section">
            <div className="hero-content">
                <h1 className="hero-title">{title || 'AETHERNODE'}</h1>
                <p className="hero-subtitle">{subtitle || 'SYSTEM MONITORING & DIAGNOSTICS'}</p>
            </div>
        </section>
    );
};

export default Hero;
