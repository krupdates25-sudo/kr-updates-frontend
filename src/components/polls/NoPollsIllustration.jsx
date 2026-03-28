import { motion } from 'framer-motion';
import { BarChart2 } from 'lucide-react';

const BAR_WIDTH = 28;
const BASE = [0.35, 0.7, 0.45, 0.9, 0.55];

/**
 * Animated empty state when there are no active polls.
 */
export default function NoPollsIllustration() {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 sm:py-16 px-6 text-center"
      role="status"
      aria-live="polite"
    >
      <div className="relative mb-8">
        <motion.div
          className="absolute inset-0 rounded-full bg-[var(--color-primary)]/10 blur-2xl"
          animate={{ scale: [1, 1.08, 1], opacity: [0.35, 0.55, 0.35] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative flex items-end justify-center gap-[10px] h-36 px-4">
          {BASE.map((base, i) => (
            <motion.div
              key={i}
              className="rounded-t-md bg-gradient-to-t from-blue-200 to-blue-100 shadow-sm"
              style={{ width: BAR_WIDTH }}
              initial={{ height: 8 }}
              animate={{
                height: [16, base * 120 + 24, base * 80 + 20, base * 110 + 22, 16],
              }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                delay: i * 0.18,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
        <motion.div
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-md border border-gray-200 text-[var(--color-primary)]"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <BarChart2 className="w-6 h-6" strokeWidth={2} />
        </motion.div>
      </div>
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900">No polls for now</h2>
    </div>
  );
}
