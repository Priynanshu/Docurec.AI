import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Upload, MessageSquare, Users } from 'lucide-react';

const items = [
  { icon: LayoutDashboard, label: 'Home', path: '/dashboard' },
  { icon: FileText, label: 'Docs', path: '/documents' },
  { icon: Upload, label: 'Upload', path: '/upload' },
  { icon: MessageSquare, label: 'Chat', path: '/chat' },
  { icon: Users, label: 'Citizens', path: '/citizens' },
];

export default function MobileNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-bg-secondary border-t border-border flex z-30">
      {items.map(({ icon: Icon, label, path }) => {
        const active = location.pathname === path || location.pathname.startsWith(path + '/');
        return (
          <Link key={path} to={path} className="flex-1">
            <div className={`flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${active ? 'text-sky' : 'text-text-tertiary'}`}>
              <Icon className="w-5 h-5" />
              <span className="text-[10px]">{label}</span>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
