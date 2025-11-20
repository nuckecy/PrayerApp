'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

export default function AuthorApplicationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    bio: '',
    portfolioUrl: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Check if user already has an author profile
      const { data: existingAuthor } = await supabase
        .from('authors')
        .select('id, status')
        .eq('user_id', user.id)
        .single();

      if (existingAuthor) {
        setError('You already have an author application. Check your status in the author dashboard.');
        return;
      }

      // Create author application
      const { error: insertError } = await supabase
        .from('authors')
        .insert({
          user_id: user.id,
          bio: formData.bio,
          portfolio_url: formData.portfolioUrl || null,
          status: 'pending',
        });

      if (insertError) throw insertError;

      // Success - redirect to author dashboard
      router.push('/author/dashboard?newApplication=true');
    } catch (err: any) {
      console.error('Failed to submit application:', err);
      setError(err.message || 'Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Become an Author</h1>
            <p className="text-lg text-muted-foreground">
              Share your knowledge and help others achieve their goals through structured daily programs.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Author Application</CardTitle>
              <CardDescription>
                Tell us about yourself and your expertise. Your application will be reviewed by our team.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="bio" className="text-sm font-medium">
                    Bio <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="bio"
                    required
                    minLength={50}
                    maxLength={500}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Tell us about your background, expertise, and why you want to create goals..."
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.bio.length}/500 characters (minimum 50)
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="portfolioUrl" className="text-sm font-medium">
                    Portfolio URL (optional)
                  </label>
                  <input
                    id="portfolioUrl"
                    type="url"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="https://your-website.com"
                    value={formData.portfolioUrl}
                    onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Link to your website, blog, or professional profile
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h3 className="font-medium text-sm mb-2">What happens next?</h3>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Our team will review your application within 48 hours</li>
                    <li>You&apos;ll receive an email notification of the decision</li>
                    <li>Once approved, you can start creating goal programs</li>
                    <li>Your goals will need approval before being published</li>
                  </ul>
                </div>
              </CardContent>

              <CardFooter className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || formData.bio.length < 50}>
                  {loading ? 'Submitting...' : 'Submit Application'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
