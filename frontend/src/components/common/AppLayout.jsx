import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export default function AppLayout({ children }) {
  const collapsed = useSelector((state) => state.ui.sidebarCollapsed);

  return (
    <div className="flex h-screen bg-bg-primary overflow-hidden">
      {}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {}
      <motion.main
        animate={{ marginLeft: collapsed ? 64 : 240 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="flex-1 overflow-y-auto overflow-x-hidden hidden md:block"
      >
        <motion.div
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.25 }}
          className="min-h-screen p-6"
        >
          {children}
        </motion.div>
      </motion.main>

      {}
      <div className="flex flex-col flex-1 md:hidden overflow-hidden">
        <motion.div
          variants={pageVariants}
          initial="initial"
          animate="animate"
          className="flex-1 overflow-y-auto p-4 pb-20"
        >
          {children}
        </motion.div>
        <MobileNav />
      </div>
    </div>
  );
}
