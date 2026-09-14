import { motion } from 'framer-motion';

export default function Skeleton({ className = '', style }) {
  return (
    <motion.div
      className={`skeleton rounded-md ${className}`}
      style={style}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    />
  );
}