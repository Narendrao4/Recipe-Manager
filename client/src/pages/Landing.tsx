import { Link } from 'react-router-dom';
import { ChefHat, BookOpen, Calendar, ShoppingBag, Sparkles, ArrowRight } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-white dark:from-forest dark:to-forest-dark dark:text-cream">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="w-24 h-24 bg-terracotta rounded-full flex items-center justify-center shadow-xl">
                <ChefHat className="w-12 h-12 text-white" />
              </div>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-serif font-bold text-forest dark:text-cream mb-6 tracking-tight">
              Recipe Manager
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Your culinary companion for discovering, organizing, and mastering exceptional recipes with AI-powered features
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/register"
                className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-4"
              >
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/login"
                className="btn-outline inline-flex items-center gap-2 text-lg px-8 py-4"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path className="fill-white dark:fill-forest-dark" d="M0 0L60 10C120 20 240 40 360 46.7C480 53 600 47 720 43.3C840 40 960 40 1080 46.7C1200 53 1320 67 1380 73.3L1440 80V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z"/>
          </svg>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white dark:bg-forest-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-semibold text-forest dark:text-cream mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Powerful features to elevate your cooking experience
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: BookOpen,
                title: 'Recipe Library',
                description: 'Save and organize your favorite recipes with photos, tags, and notes'
              },
              {
                icon: Sparkles,
                title: 'AI Recipe Remix',
                description: 'Transform recipes with AI for healthier, budget-friendly, or gourmet variations'
              },
              {
                icon: Calendar,
                title: 'Meal Planning',
                description: 'Drag-and-drop weekly calendar with automatic grocery list generation'
              },
              {
                icon: ShoppingBag,
                title: 'Pantry Tracker',
                description: 'Track ingredients with expiry monitoring and smart recipe matching'
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-cream p-8 rounded-xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1 dark:bg-forest-light"
              >
                <div className="w-14 h-14 bg-terracotta rounded-full flex items-center justify-center mb-6">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-forest dark:text-cream mb-3">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-forest text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-serif font-semibold mb-6">
            Ready to Transform Your Cooking?
          </h2>
          <p className="text-xl mb-10 text-cream">
            Join thousands of home chefs who have elevated their culinary journey
          </p>
          <Link
            to="/register"
            className="inline-block bg-terracotta hover:bg-terracotta-dark text-white px-10 py-4 rounded-lg font-medium text-lg transition-colors"
          >
            Start Free Today
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white py-8 border-t border-gray-200 dark:border-cream/10 dark:bg-forest-dark">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-600 dark:text-gray-300">
          <p>&copy; 2026 Recipe Manager. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
