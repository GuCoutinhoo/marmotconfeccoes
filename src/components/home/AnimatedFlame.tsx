import React, { useId } from 'react';
import { motion } from 'motion/react';

interface AnimatedFlameProps {
  isTriggered: boolean;
  className?: string;
}

export const AnimatedFlame: React.FC<AnimatedFlameProps> = ({ isTriggered, className = '' }) => {
  const gradientId = useId();

  // Floating spark embers rising and drifting organically
  const embers = [
    { id: 1, x: 3, yEnd: -22, scale: 0.8, delay: 0.1, duration: 1.6 },
    { id: 2, x: -5, yEnd: -28, scale: 1.0, delay: 0.45, duration: 2.0 },
    { id: 3, x: 7, yEnd: -26, scale: 0.7, delay: 0.85, duration: 1.8 },
    { id: 4, x: -3, yEnd: -32, scale: 0.85, delay: 1.25, duration: 2.2 },
    { id: 5, x: 4, yEnd: -20, scale: 0.6, delay: 1.65, duration: 1.5 },
  ];

  return (
    <div className={`relative inline-flex items-center justify-center select-none ${className}`}>
      {/* Radiant warm glow behind the flame (soft and atmospheric) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={
          isTriggered
            ? {
                opacity: [0.45, 0.8, 0.55],
                scale: [0.85, 1.15, 0.95],
              }
            : { opacity: 0, scale: 0.6 }
        }
        transition={{
          duration: 2.2,
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'easeInOut',
          delay: 0.2,
        }}
        className="absolute w-10 h-12 rounded-full bg-[#FF5500]/30 blur-lg pointer-events-none"
      />

      {/* Main Vector Flame with layered energetic tongues */}
      <motion.div
        initial={{ scale: 0, opacity: 0, y: 4 }}
        animate={
          isTriggered
            ? {
                scale: [0, 1.15, 0.96, 1],
                opacity: [0, 1, 1, 1],
                y: [4, -1, 0],
              }
            : { scale: 0, opacity: 0, y: 4 }
        }
        transition={{
          duration: 0.5,
          delay: 0.2,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="relative z-10"
      >
        <motion.svg
          width="32"
          height="38"
          viewBox="0 0 32 38"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          animate={
            isTriggered
              ? {
                  scaleY: [1, 1.06, 0.96, 1.04, 1],
                  scaleX: [1, 0.96, 1.04, 0.97, 1],
                  rotate: [0, -1.5, 2, -1, 0],
                }
              : {}
          }
          transition={{
            duration: 2.0,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.6,
          }}
          className="origin-bottom filter drop-shadow-[0_0_10px_rgba(255,107,0,0.85)] drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
        >
          <defs>
            {/* Outer flame gradient: Deep crimson to vibrant flame orange to golden tip */}
            <linearGradient id={`outer-${gradientId}`} x1="16" y1="36" x2="16" y2="2" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#D81B00" />
              <stop offset="35%" stopColor="#FF4500" />
              <stop offset="70%" stopColor="#FF8C00" />
              <stop offset="100%" stopColor="#FFC800" />
            </linearGradient>

            {/* Mid flame gradient: High-energy orange-yellow */}
            <linearGradient id={`mid-${gradientId}`} x1="16" y1="33" x2="16" y2="10" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FF3D00" />
              <stop offset="50%" stopColor="#FFAA00" />
              <stop offset="100%" stopColor="#FFE066" />
            </linearGradient>

            {/* Core incandescent pulse: White-hot luminous core */}
            <linearGradient id={`core-${gradientId}`} x1="16" y1="31" x2="16" y2="18" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFA000" />
              <stop offset="50%" stopColor="#FFF1AA" />
              <stop offset="100%" stopColor="#FFFFFF" />
            </linearGradient>
          </defs>

          {/* Outer Main Flame Tongue (Refined silhouette with dynamic flick) */}
          <path
            d="M16 2C16 2 17.8 7 15.2 11C12.8 14.6 9.4 15.2 7.6 19.4C5.4 24.2 6.8 29.5 10.4 33C14 36.5 19.5 36.8 23.5 33.6C27.5 30.4 28.6 25 26.5 20.4C24.5 16 20.2 14.5 19.2 9.8C18.4 5.8 19 3.5 16 2Z"
            fill={`url(#outer-${gradientId})`}
          />

          {/* Dynamic flame lick on right edge for streetwear energy */}
          <path
            d="M16.5 7.5C16.5 7.5 12.5 13.5 12.5 18C12.5 20.8 13.8 22.8 15.6 24C14.8 22 15.2 20.2 16.5 18.8C17.8 17.5 19.2 18.4 20.2 20.2C21.2 22 20.6 24 19.2 25.2C22.6 24.8 24.6 21.6 23.6 18.2C22.6 15 19.2 12.2 16.5 7.5Z"
            fill="#FF7700"
            opacity="0.9"
          />

          {/* Mid Flame Layer */}
          <path
            d="M16 13C14.2 16.5 11.6 19.5 11.6 23.5C11.6 27.5 14.2 31 17.4 31C20.6 31 22.4 28 22.4 24.6C22.4 20.8 19.5 17.8 17.5 15.2C16.8 14.4 16.3 13.6 16 13Z"
            fill={`url(#mid-${gradientId})`}
          />

          {/* White-Hot Intense Core */}
          <path
            d="M16 20C14.8 22.2 13.5 24.2 13.5 26.5C13.5 29 15 31 16.8 31C18.6 31 20 29 20 26.8C20 24.5 18 22.5 16.8 21C16.4 20.5 16.2 20.2 16 20Z"
            fill={`url(#core-${gradientId})`}
          />
        </motion.svg>
      </motion.div>

      {/* Floating Spark Embers */}
      {isTriggered && (
        <div className="absolute inset-0 pointer-events-none overflow-visible">
          {embers.map((ember) => (
            <motion.span
              key={ember.id}
              initial={{
                opacity: 0,
                x: 0,
                y: 0,
                scale: 0,
              }}
              animate={{
                opacity: [0, 0.95, 0.85, 0],
                x: [0, ember.x, ember.x * 1.6],
                y: [0, ember.yEnd * 0.5, ember.yEnd],
                scale: [0, ember.scale, ember.scale * 0.6, 0],
              }}
              transition={{
                duration: ember.duration,
                repeat: Infinity,
                delay: 0.4 + ember.delay,
                ease: 'easeOut',
              }}
              className="absolute left-1/2 top-1/3 w-1.5 h-1.5 -ml-0.75 -mt-0.75 rounded-full bg-gradient-to-t from-[#FF4500] to-[#FFE580] shadow-[0_0_8px_#FFAA00]"
            />
          ))}
        </div>
      )}
    </div>
  );
};
