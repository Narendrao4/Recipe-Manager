import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';

const Layout = () => {
  const { user, logout } = useAuthStore();
  const { isDark, toggle } = useThemeStore();
  const location = useLocation();

  const navLinks = [
    { path: '/', label: 'Dashboard', icon: '🏠' },
    { path: '/recipes', label: 'Recipes', icon: '📖' },
    { path: '/ingredient-matcher', label: 'Ingredient Matcher', icon: '🎯' },
    { path: '/meal-planner', label: 'Meal Planner', icon: '📅' },
    { path: '/pantry', label: 'Pantry', icon: '🏪' },
    { path: '/stats', label: 'Stats', icon: '📊' },
  ];

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-forest text-cream shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link to="/" className="text-2xl font-display font-bold">
                🍳 Recipe Manager
              </Link>
              <div className="hidden md:flex space-x-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      location.pathname === link.path
                        ? 'bg-terracotta text-white'
                        : 'hover:bg-forest-light'
                    }`}
                  >
                    <span className="mr-2">{link.icon}</span>
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={toggle}
                className="p-2 rounded-md hover:bg-forest-light transition-colors"
                aria-label="Toggle theme"
              >
                {isDark ? '☀️' : '🌙'}
              </button>
              <div className="text-sm">
                <span className="font-medium">{user?.name}</span>
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 bg-terracotta rounded-md hover:bg-terracotta-dark transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-forest text-cream mt-16 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm">© 2026 Recipe Manager. Made with ❤️ and Claude AI.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
