import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const TopNav = () => {
  const location = useLocation();
  const isLanding = location.pathname === '/' || location.pathname === '/concept' || location.pathname === '/student';

  // Hide generic nav on landing and concept page
  if (isLanding) return null;

  const navItems = [
    { path: '/student', label: 'Student' },
    { path: '/teacher', label: 'Docent' },
    { path: '/admin', label: 'Admin' },
  ];

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center justify-between px-4 py-3 bg-background/80 border-b border-border text-xs uppercase tracking-widest text-muted-foreground backdrop-blur-sm">
        <Link to="/" className="font-semibold hover:text-foreground transition-colors">
          EAI Hub 15.0
        </Link>
        <nav className="flex gap-4" aria-label="Hoofdnavigatie">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "hover:text-foreground transition-colors",
                location.pathname.startsWith(item.path) && "text-primary"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default TopNav;
