
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Upload, MessageSquare, GitCompare, BarChart3, Settings, LogOut, ChevronLeft, ChevronRight, Zap, Users } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleSidebar } from '../../store/uiSlice';
import { logout } from '../../store/authSlice';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: FileText, label: 'Documents', path: '/documents' },
  { icon: Users, label: 'Citizens', path: '/citizens' },
  { icon: Upload, label: 'Upload', path: '/upload' },
  { icon: MessageSquare, label: 'AI Chat', path: '/chat' },
  { icon: GitCompare, label: 'Compare', path: '/compare' },
];

export default function Sidebar() {
  const dispatch = useDispatch();
  const collapsed = useSelector((state) => state.ui.sidebarCollapsed);
  const location = useLocation();

  const handleLogout = async () => {
    try { await authAPI.logout(); } catch {}
    dispatch(logout());
    toast.success('Logged out');
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="fixed top-0 left-0 h-full bg-bg-primary border-r border-border flex flex-col z-30 overflow-hidden"
    >
      {}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-border flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-sky-muted border border-sky/30 flex items-center justify-center flex-shrink-0">
          <Zap className="w-4 h-4 text-sky" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="font-semibold text-text-primary text-sm whitespace-nowrap"
            >
              DocuRec <span className="text-sky">AI</span>
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {}
      <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ icon: Icon, label, path }) => {
          const active = isActive(path);
          return (
            <Link key={path} to={path}>
              <motion.div
                whileHover={{ x: 2 }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-btn cursor-pointer transition-colors duration-150 relative group
                  ${active ? 'bg-sky-muted text-sky border-l-2 border-sky pl-[10px]' : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'}`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm font-medium whitespace-nowrap"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {}
                {collapsed && (
                  <div className="absolute left-full ml-2 bg-bg-elevated border border-border text-text-primary text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                    {label}
                  </div>
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {}
      <div className="py-4 px-2 border-t border-border space-y-0.5">

        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-btn text-text-secondary hover:text-error hover:bg-[rgba(248,113,113,0.1)] transition-colors">
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span className="text-sm">Logout</span>}
        </button>

        <button onClick={() => dispatch(toggleSidebar())} className="w-full flex items-center justify-center py-2 text-text-tertiary hover:text-text-secondary hover:bg-bg-elevated rounded-btn transition-colors">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </motion.aside>
  );
}
