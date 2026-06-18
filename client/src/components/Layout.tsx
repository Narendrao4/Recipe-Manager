import { Outlet, Link, useLocation } from 'react-router-dom';
import { BarChart3, BookOpen, CalendarDays, Heart, Home, LogOut, Moon, Package, Sun, Target } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import Button from './ui/button';
import { useToast } from './ui/toast';
import { cn } from '../lib/utils';

const Layout = () => {
  const { user, logout } = useAuthStore();
  const { isDark, toggle } = useThemeStore();
  const { toast } = useToast();
  const location = useLocation();

  const navLinks = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/recipes', label: 'Recipes', icon: BookOpen },
    { path: '/favorites', label: 'Favorites', icon: Heart },
    { path: '/ingredient-matcher', label: 'Matcher', icon: Target },
    { path: '/meal-planner', label: 'Planner', icon: CalendarDays },
    { path: '/pantry', label: 'Pantry', icon: Package },
    { path: '/stats', label: 'Stats', icon: BarChart3 },
  ];

  const handleLogout = () => {
    logout();
    toast({
      title: 'Logged out',
      description: 'You have been signed out successfully.',
      tone: 'success',
    });
  };

  const handleThemeToggle = () => {
    const nextDark = !isDark;
    toggle();
    toast({
      title: nextDark ? 'Dark mode enabled' : 'Light mode enabled',
      description: nextDark ? 'The application has switched to dark colors.' : 'The application has switched to light colors.',
      tone: 'info',
    });
  };

  return (
    <div className="min-h-screen bg-cream text-forest dark:bg-forest dark:text-cream">
      <nav className="sticky top-0 z-40 border-b border-forest/10 bg-cream-light/90 shadow-sm backdrop-blur-xl dark:border-cream/10 dark:bg-forest-dark/90">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-16 flex-col gap-3 py-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center justify-between gap-4">
              <Link to="/" className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-terracotta text-sm font-bold text-white shadow-lg">
                  RM
                </div>
                <div>
                  <div className="font-display text-2xl font-bold leading-none">Recipe Manager</div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">Cookbook and API imports</div>
                </div>
              </Link>

              <div className="flex items-center gap-2 lg:hidden">
                <Button variant="ghost" size="icon" onClick={handleThemeToggle} aria-label="Toggle theme">
                  {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </Button>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;

                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={cn(
                      'inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                      isActive
                        ? 'bg-forest text-cream shadow-sm dark:bg-cream dark:text-forest'
                        : 'text-forest/75 hover:bg-forest/5 hover:text-forest dark:text-cream/75 dark:hover:bg-cream/10 dark:hover:text-cream'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
            </div>

            <div className="hidden items-center gap-3 lg:flex">
              <Button variant="ghost" size="icon" onClick={handleThemeToggle} aria-label="Toggle theme">
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <div className="rounded-lg border border-forest/10 bg-white/60 px-3 py-2 text-sm dark:border-cream/10 dark:bg-cream/5">
                <div className="font-semibold">{user?.name}</div>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
