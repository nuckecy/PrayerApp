'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-subtle">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              P
            </div>
            <span className="text-xl font-semibold text-foreground">PrayPal</span>
          </div>

          {/* Navigation Menu */}
          <nav className="hidden md:flex items-center gap-8">
            <div className="relative group">
              <button className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Explore
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
            <Link href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              About Us
            </Link>
            <Link href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Goals
            </Link>
            <Link href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Community
            </Link>
          </nav>

          {/* CTA Button */}
          <div className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost" className="text-sm">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button className="btn-primary text-sm">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-start">
          {/* Left Column - Hero Content */}
          <div className="space-y-8 flex flex-col justify-center">
            {/* Tagline Badge */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-4">
                Built with purpose for your faith
              </p>
            </div>

            {/* Main Headline */}
            <div className="space-y-6">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-tight">
                Your daily prayer companion
              </h1>
              <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
                Transform your spiritual life with guided daily prayers, accountability groups, and a supportive community.
              </p>
            </div>

            {/* CTA Button */}
            <Link href="/auth/register" className="inline-flex">
              <Button className="btn-primary px-8 py-6 text-base h-auto">
                Get Started Now
              </Button>
            </Link>

            {/* Stats/Trust Section */}
            <div className="flex items-center gap-8 pt-8 border-t border-border">
              <div>
                <p className="text-2xl font-bold text-foreground">10K+</p>
                <p className="text-sm text-muted-foreground">Active Users</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">50K+</p>
                <p className="text-sm text-muted-foreground">Prayers Completed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">98%</p>
                <p className="text-sm text-muted-foreground">Satisfaction Rate</p>
              </div>
            </div>
          </div>

          {/* Right Column - Feature Cards */}
          <div className="space-y-6 pt-8 lg:pt-0">
            {/* Card 1 - Features */}
            <div className="card border-border hover:shadow-lg transition-all duration-200">
              <div className="space-y-4">
                <div className="h-32 bg-gray-100 dark:bg-gray-900 rounded-lg"></div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Daily Guided Prayers</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Explore a curated collection of prayers designed by spiritual leaders to deepen your daily practice.
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">5+ new prayers daily</span>
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                      →
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2 - Community */}
            <div className="card border-border hover:shadow-lg transition-all duration-200">
              <div className="space-y-4">
                <div className="h-32 bg-gray-100 dark:bg-gray-900 rounded-lg"></div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Join Prayer Groups</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Connect with like-minded individuals and grow your faith through shared accountability and support.
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Build community</span>
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                      →
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3 - Tracking */}
            <div className="card border-border hover:shadow-lg transition-all duration-200">
              <div className="space-y-4">
                <div className="h-32 bg-gray-100 dark:bg-gray-900 rounded-lg"></div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Track Your Progress</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Visualize your spiritual growth with streaks, achievements, and personalized insights.
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Stay motivated</span>
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                      →
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4 - Resources */}
            <div className="card border-border hover:shadow-lg transition-all duration-200">
              <div className="space-y-4">
                <div className="h-32 bg-gray-100 dark:bg-gray-900 rounded-lg"></div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Expert Resources</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Access comprehensive spiritual guides and teachings from trusted faith leaders and authors.
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Learn & grow</span>
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                      →
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="bg-card border-t border-border py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-2xl">📿</span>
              </div>
              <h3 className="font-semibold text-foreground text-lg">Spiritual Growth</h3>
              <p className="text-muted-foreground">
                Deepen your connection to faith with structured daily practices and meaningful reflections.
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="font-semibold text-foreground text-lg">Community Support</h3>
              <p className="text-muted-foreground">
                Never pray alone. Join accountability groups and share your journey with others.
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-2xl">✨</span>
              </div>
              <h3 className="font-semibold text-foreground text-lg">Progress Tracking</h3>
              <p className="text-muted-foreground">
                Visualize your spiritual progress with achievement badges and meaningful metrics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground">
              Ready to transform your prayer life?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join thousands of users who are deepening their faith and building meaningful spiritual habits.
            </p>
          </div>
          <Link href="/auth/register">
            <Button className="btn-primary px-8 py-6 text-base h-auto">
              Start Your Journey Today
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Security</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">Privacy</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Terms</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Connect</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">Twitter</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">LinkedIn</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Instagram</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
            <p>&copy; 2025 PrayPal. All rights reserved.</p>
            <p>Designed with purpose for spiritual growth.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
