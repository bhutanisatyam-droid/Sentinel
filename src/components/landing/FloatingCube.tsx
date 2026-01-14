import { motion, MotionValue } from 'motion/react';
import { useEffect, useState } from 'react';

interface FloatingCubeProps {
  size?: number;
  rotation?: MotionValue<number>;
}

export function FloatingCube({ size = 400, rotation }: FloatingCubeProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      setMousePosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="flex items-center justify-center" style={{ height: size }}>
      <motion.div
        className="relative"
        style={{
          width: size * 0.6,
          height: size * 0.6,
          perspective: '1000px',
        }}
        animate={{
          rotateX: mousePosition.y * 0.5,
          rotateY: mousePosition.x * 0.5,
        }}
        transition={{ type: 'spring', stiffness: 100, damping: 30 }}
      >
        <motion.div
          className="relative w-full h-full"
          style={{
            transformStyle: 'preserve-3d',
          }}
          animate={{
            rotateY: [0, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          {/* Front Face */}
          <div
            className="absolute w-full h-full border border-[#333333] bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] backdrop-blur-xl"
            style={{
              transform: `translateZ(${size * 0.3}px)`,
              boxShadow: '0 0 40px rgba(255, 255, 255, 0.05)',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
            <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 100">
              <line x1="50" y1="0" x2="50" y2="100" stroke="#EDEDED" strokeWidth="0.5" />
              <line x1="0" y1="50" x2="100" y2="50" stroke="#EDEDED" strokeWidth="0.5" />
              <circle cx="50" cy="50" r="30" fill="none" stroke="#EDEDED" strokeWidth="0.5" />
            </svg>
          </div>

          {/* Back Face */}
          <div
            className="absolute w-full h-full border border-[#333333] bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] backdrop-blur-xl"
            style={{
              transform: `translateZ(${-size * 0.3}px) rotateY(180deg)`,
              boxShadow: '0 0 40px rgba(255, 255, 255, 0.05)',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
          </div>

          {/* Right Face */}
          <div
            className="absolute w-full h-full border border-[#333333] bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] backdrop-blur-xl"
            style={{
              transform: `rotateY(90deg) translateZ(${size * 0.3}px)`,
              boxShadow: '0 0 40px rgba(255, 255, 255, 0.05)',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
          </div>

          {/* Left Face */}
          <div
            className="absolute w-full h-full border border-[#333333] bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] backdrop-blur-xl"
            style={{
              transform: `rotateY(-90deg) translateZ(${size * 0.3}px)`,
              boxShadow: '0 0 40px rgba(255, 255, 255, 0.05)',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
          </div>

          {/* Top Face */}
          <div
            className="absolute w-full h-full border border-[#333333] bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] backdrop-blur-xl"
            style={{
              transform: `rotateX(90deg) translateZ(${size * 0.3}px)`,
              boxShadow: '0 0 40px rgba(255, 255, 255, 0.05)',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
          </div>

          {/* Bottom Face */}
          <div
            className="absolute w-full h-full border border-[#333333] bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] backdrop-blur-xl"
            style={{
              transform: `rotateX(-90deg) translateZ(${size * 0.3}px)`,
              boxShadow: '0 0 40px rgba(255, 255, 255, 0.05)',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
          </div>
        </motion.div>

        {/* Ambient Glow */}
        <div
          className="absolute inset-0 blur-3xl opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(237, 237, 237, 0.3) 0%, transparent 70%)',
          }}
        />
      </motion.div>
    </div>
  );
}
