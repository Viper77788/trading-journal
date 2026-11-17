import { Variants, Transition } from 'framer-motion';

export const SPRING_SNAPPY: Transition = {
  type: 'spring',
  stiffness: 380,
  damping: 28,
};

export const SPRING_SMOOTH: Transition = {
  type: 'spring',
  stiffness: 260,
  damping: 26,
};

export const EASE_OUT_FAST: Transition = {
  duration: 0.28,
  ease: [0.16, 1, 0.3, 1],
};

export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.03,
    },
  },
};

export const fadeInUpVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export const pageTransitionVariants: Variants = {
  initial: { opacity: 0, x: 14 },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    opacity: 0,
    x: -14,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
};

export const dateSlideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 32 : -32,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.28,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 32 : -32,
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  }),
};

export const shakeVariants: Variants = {
  idle: { x: 0 },
  shake: {
    x: [0, -8, 8, -6, 6, -3, 3, 0],
    transition: { duration: 0.42, ease: 'easeInOut' },
  },
};
