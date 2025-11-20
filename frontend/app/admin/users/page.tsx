'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AppHeader } from '@/components/layout/AppHeader';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Shield, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface UserProfile {
  id: string;
  name: string;
  role: 'super_admin' | 'author' | 'user';
  timezone: string;
  created_at: string;
  auth_users?: {
    email: string;
  };
  _count?: {
    enrollments: number;
    achievements: number;
  };
}

export default function UserManagementPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'super_admin') {
        alert('Access denied. Admin privileges required.');
        router.push('/dashboard');
        return;
      }

      await loadUsers();
    } catch (error) {
      console.error('Error checking admin access:', error);
      router.push('/dashboard');
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, role, timezone, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get email from auth.users and enrollment counts
      const usersWithData = await Promise.all(
        (data || []).map(async (user) => {
          const [{ count: enrollmentsCount }, { count: achievementsCount }] = await Promise.all([
            supabase
              .from('enrollments')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', user.id),
            supabase
              .from('user_achievements')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', user.id),
          ]);

          // Note: In production, email should be fetched via admin API
          // For now, we'll display without email or use a service role query
          return {
            ...user,
            _count: {
              enrollments: enrollmentsCount || 0,
              achievements: achievementsCount || 0,
            },
          };
        })
      );

      setUsers(usersWithData);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'super_admin' | 'author' | 'user') => {
    if (!confirm(`Change user role to ${newRole}?`)) return;

    setProcessing(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      alert('User role updated successfully!');
      await loadUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Failed to update role. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">Admin</Badge>;
      case 'author':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">Author</Badge>;
      case 'user':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300">User</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <>
        <AppHeader />
        <div className="container max-w-7xl py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader />
      <div className="container max-w-7xl py-8">
        <div className="mb-6">
          <Link href="/admin" className="text-sm text-muted-foreground hover:text-primary mb-2 inline-block">
            ← Back to Admin Dashboard
          </Link>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage user accounts and roles
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Authors</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter((u) => u.role === 'author' || u.role === 'super_admin').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Admins</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter((u) => u.role === 'super_admin').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users List */}
        <div className="space-y-4">
          {filteredUsers.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No users found matching your search.</p>
              </CardContent>
            </Card>
          ) : (
            filteredUsers.map((user) => (
              <Card key={user.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{user.name}</CardTitle>
                      <CardDescription className="font-mono text-xs">
                        ID: {user.id}
                      </CardDescription>
                    </div>
                    {getRoleBadge(user.role)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{user._count?.enrollments || 0} enrollments</span>
                      <span>{user._count?.achievements || 0} achievements</span>
                      <span>Timezone: {user.timezone}</span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-xs text-muted-foreground">
                        Joined {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                      </span>

                      <div className="flex gap-2">
                        {user.role !== 'super_admin' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRoleChange(user.id, 'super_admin')}
                            disabled={processing === user.id}
                          >
                            <Shield className="h-4 w-4 mr-1" />
                            Make Admin
                          </Button>
                        )}

                        {user.role !== 'author' && user.role !== 'super_admin' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRoleChange(user.id, 'author')}
                            disabled={processing === user.id}
                          >
                            Make Author
                          </Button>
                        )}

                        {user.role !== 'user' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRoleChange(user.id, 'user')}
                            disabled={processing === user.id}
                          >
                            Make User
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </>
  );
}
