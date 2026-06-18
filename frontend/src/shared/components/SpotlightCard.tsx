"use client";

import { useRef, useState, type ReactNode, type MouseEvent } from "react";
import { motion } from "framer-motion";

interface SpotlightCardProps {
    children: ReactNode;
    className?: string;
    spotlightColor?: string;
    borderColor?: string;
}

export function SpotlightCard({
    children,
    className = "",
    spotlightColor = "rgba(0, 212, 255, 0.06)",
    borderColor = "rgba(0, 212, 255, 0.15)",
}: SpotlightCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        setMousePosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    };

    return (
        <motion.div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`relative rounded-2xl overflow-hidden ${className}`}
            style={{
                background: "#0A0A0A",
                border: `1px solid ${isHovered ? borderColor : "rgba(255,255,255,0.06)"}`,
                transition: "border-color 0.3s ease",
            }}
        >
            {/* Spotlight gradient that follows the mouse */}
            <div
                className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-500"
                style={{
                    opacity: isHovered ? 1 : 0,
                    background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, ${spotlightColor}, transparent 60%)`,
                }}
            />
            {/* Content */}
            <div className="relative z-10">{children}</div>
        </motion.div>
    );
}
