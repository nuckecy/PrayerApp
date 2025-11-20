'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, Settings, LogOut, Home, BookOpen, Users } from 'lucide-react';

export function AppHeader() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setProfile(profileData);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (!user) return null;

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo/Brand */}
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="font-bold text-xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              PrayPal
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/dashboard" className="text-sm font-medium transition-colors hover:text-primary">
              Dashboard
            </Link>
            <Link href="/goals" className="text-sm font-medium transition-colors hover:text-primary">
              Browse Goals
            </Link>
            <Link href="/groups/join" className="text-sm font-medium transition-colors hover:text-primary">
              Join Group
            </Link>
            {profile?.role === 'author' || profile?.role === 'super_admin' ? (
              <Link href="/author/dashboard" className="text-sm font-medium transition-colors hover:text-primary">
                Author Dashboard
              </Link>
            ) : null}
            {profile?.role === 'super_admin' ? (
              <Link href="/admin" className="text-sm font-medium transition-colors hover:text-primary text-purple-600">
                Admin
              </Link>
            ) : null}
          </nav>

          {/* Right Side - Notifications & User Menu */}
          <div className="flex items-center space-x-4">
            <NotificationCenter />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-medium">{profile?.name || 'User'}</span>
                    <span className="text-xs text-muted-foreground">{user?.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* Mobile navigation items */}
                <div className="md:hidden">
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="w-full cursor-pointer">
                      <Home className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/goals" className="w-full cursor-pointer">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Browse Goals
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/groups/join" className="w-full cursor-pointer">
                      <Users className="mr-2 h-4 w-4" />
                      Join Group
                    </Link>
                  </DropdownMenuItem>
                  {profile?.role === 'author' || profile?.role === 'super_admin' ? (
                    <DropdownMenuItem asChild>
                      <Link href="/author/dashboard" className="w-full cursor-pointer">
                        <BookOpen className="mr-2 h-4 w-4" />
                        Author Dashboard
                      </Link>
                    </DropdownMenuItem>
                  ) : null}
                  {profile?.role === 'super_admin' ? (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="w-full cursor-pointer text-purple-600">
                        <Settings className="mr-2 h-4 w-4" />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuSeparator />
                </div>

                <DropdownMenuItem asChild>
                  <Link href="/settings/notifications" className="w-full cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Notification Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
