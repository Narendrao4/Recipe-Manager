import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import Button from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import Input from '../components/ui/input';
import { useToast } from '../components/ui/toast';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { toast } = useToast();

  const registerMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/auth/register', { name, email, password });
      return data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.token);
      toast({
        title: `Welcome, ${data.user.name}`,
        description: 'Your recipe workspace has been created.',
        tone: 'success',
      });
      navigate('/dashboard');
    },
    onError: (error: any) => {
      setError(error.response?.data?.error || 'Registration failed');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    registerMutation.mutate();
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-forest px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(196,98,45,0.36),transparent_30%),radial-gradient(circle_at_85%_10%,rgba(245,237,214,0.24),transparent_28%),linear-gradient(135deg,#0f1f1a,#1b3a2d_55%,#2d5a45)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cream/60 to-transparent" />

      <Card className="relative w-full max-w-md border-cream/20 bg-white/95 shadow-2xl backdrop-blur">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-terracotta text-lg font-bold text-white shadow-lg">
            RM
          </div>
          <CardTitle className="text-4xl text-forest">Create Account</CardTitle>
          <CardDescription>Start your recipe library and import meals from the free API.</CardDescription>
        </CardHeader>

        {error && (
          <div className="mx-6 mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-700">
                Name
              </label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                minLength={6}
              />
            </div>

            <Button type="submit" disabled={registerMutation.isPending} className="w-full">
              {registerMutation.isPending ? 'Creating account...' : 'Sign Up'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-terracotta hover:text-terracotta-dark">
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
