import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            DailyGoalTracker
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Achieve your goals, one day at a time. Build lasting habits through structured daily progress.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" asChild>
              <Link href="/goals">Explore Goals</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/auth/register">Get Started</Link>
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📱</span>
                Mobile-First PWA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Install on your phone and access your goals offline. Works seamlessly on any device.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                Daily Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Complete one step each day. No rushing, no skipping. Consistency builds lasting change.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">👥</span>
                Community Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Join groups for shared accountability. Track collective streaks without competition.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto bg-gradient-to-r from-blue-500 to-purple-500 text-white border-none">
            <CardHeader>
              <CardTitle className="text-3xl">Ready to Start Your Journey?</CardTitle>
              <CardDescription className="text-white/90 text-lg">
                Join thousands building better habits, one day at a time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="lg" variant="secondary" asChild className="font-semibold">
                <Link href="/auth/register">Create Free Account</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
