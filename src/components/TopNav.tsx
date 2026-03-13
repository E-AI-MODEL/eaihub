import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, User, UserPlus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import RoleRequestForm from '@/components/RoleRequestForm';

const TopNav = () => {
  const location = useLocation();
  const { user, roles, signOut } = useAuth();
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const isHidden = location.pathname === '/' || location.pathname === '/concept' || location.pathname === '/leren' || location.pathname === '/student' || location.pathname === '/auth' || location.pathname === '/reset-password';

  if (isHidden) return null;

  // Show role request button if user can request something they don't have
  const canRequestRole = user && (
    (!roles.includes('DOCENT') && !roles.includes('ADMIN') && !roles.includes('SUPERUSER')) ||
    (roles.includes('DOCENT') && !roles.includes('ADMIN') && !roles.includes('SUPERUSER'))
  );

  const navItems = [
    { path: '/student', label: 'Leerling', show: true },
    { path: '/teacher', label: 'Docent', show: roles.includes('DOCENT') || roles.includes('ADMIN') },
    { path: '/admin', label: 'Admin', show: roles.includes('ADMIN') },
  ];

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center justify-between px-4 py-3 bg-background/80 border-b border-border text-xs uppercase tracking-widest text-muted-foreground backdrop-blur-sm">
          <Link to="/" className="font-semibold hover:text-foreground transition-colors">
            EAI Hub 15.0
          </Link>
          <div className="flex items-center gap-4">
            <nav className="flex gap-4" aria-label="Hoofdnavigatie">
              {navItems.filter(i => i.show).map((item) => (
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
            {user && (
              <div className="flex items-center gap-2 pl-3 border-l border-border">
                {canRequestRole && (
                  <button
                    onClick={() => setShowRoleDialog(true)}
                    className="p-1 hover:text-foreground transition-colors"
                    title="Rol aanvragen"
                  >
                    <UserPlus className="w-3 h-3" />
                  </button>
                )}
                <User className="w-3 h-3" />
                <span className="text-[9px] normal-case tracking-normal text-muted-foreground truncate max-w-[120px]">
                  {user.email}
                </span>
                <button onClick={signOut} className="p-1 hover:text-foreground transition-colors" title="Uitloggen">
                  <LogOut className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rol aanvragen</DialogTitle>
            <DialogDescription>
              Vraag een extra rol aan. Een beheerder beoordeelt je aanvraag.
            </DialogDescription>
          </DialogHeader>
          <RoleRequestForm />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TopNav;
