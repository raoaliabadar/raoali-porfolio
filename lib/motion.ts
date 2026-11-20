export const ease = [0.22, 1, 0.36, 1] as const;

export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease } },
};

export const stagger = (delay = 0.06, delayChildren = 0) => ({
  hidden: {},
  show: { transition: { staggerChildren: delay, delayChildren } },
});
