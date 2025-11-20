import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@iconify/react";

export default function Home() {
  return (
    <main className="min-h-screen gradient-mesh text-white overflow-hidden">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-16">
          <div className="flex items-center gap-3">
            <Icon icon="solar:hand-prayer-bold-duotone" className="text-4xl text-purple-400" />
            <h1 className="text-2xl font-bold">PrayPal</h1>
          </div>
          <Button variant="ghost" className="text-white hover:bg-white/10">
            Menu
            <Icon icon="solar:alt-arrow-down-bold-duotone" className="ml-2 text-xl" />
          </Button>
        </header>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Column - Hero Content */}
          <div className="space-y-8 pt-12">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur border border-white/20">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-sm">Strengthen prayer life by 2+ hours each week</span>
            </div>

            {/* Main Heading */}
            <div className="space-y-4">
              <h2 className="text-5xl md:text-7xl font-bold leading-tight">
                The prayer companion that transforms your spiritual journey
              </h2>
              <p className="text-xl text-gray-300 max-w-2xl">
                PrayPal connects your prayers, scripture, and community into one unified space,
                turning scattered devotions into organized spiritual growth.
              </p>
            </div>

            {/* Email Input */}
            <div className="flex flex-col sm:flex-row gap-4 max-w-xl">
              <div className="relative flex-1">
                <Icon
                  icon="solar:letter-bold-duotone"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-gray-400"
                />
                <input
                  type="email"
                  placeholder="you@church.com"
                  className="w-full pl-14 pr-4 py-4 rounded-lg bg-white/10 backdrop-blur border border-white/20 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <Button
                size="lg"
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold px-8"
              >
                Get Started Free
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="pt-8">
              <p className="text-sm text-gray-400 mb-6">CHURCHES & COMMUNITIES USING PRAYPAL</p>
              <div className="flex flex-wrap items-center gap-8 opacity-70">
                <Icon icon="solar:church-bold-duotone" className="text-4xl" />
                <Icon icon="solar:users-group-two-rounded-bold-duotone" className="text-4xl" />
                <Icon icon="solar:book-bold-duotone" className="text-4xl" />
                <Icon icon="solar:global-bold-duotone" className="text-4xl" />
                <Icon icon="solar:heart-bold-duotone" className="text-4xl" />
              </div>
            </div>
          </div>

          {/* Right Column - Workspace Preview */}
          <div className="glass-card rounded-2xl p-1 shadow-2xl lg:mt-12">
            <div className="bg-gradient-to-b from-gray-900/90 to-gray-950/90 rounded-xl p-6 space-y-6">
              {/* Workspace Header */}
              <div className="flex justify-between items-center pb-4 border-b border-white/10">
                <div>
                  <h3 className="text-xl font-semibold">PrayPal workspace</h3>
                  <p className="text-sm text-gray-400">Faith · Delivered daily</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="text-xs text-white hover:bg-white/10">
                    <Icon icon="solar:add-circle-bold-duotone" className="mr-1" />
                    Add prayer
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs text-white hover:bg-white/10">
                    <Icon icon="solar:share-bold-duotone" className="mr-1" />
                    Share
                  </Button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2">
                <button className="px-4 py-2 rounded-lg bg-white/10 text-sm font-medium flex items-center gap-2">
                  Overview
                  <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs">6</span>
                </button>
                <button className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:bg-white/5 flex items-center gap-2">
                  Prayer Lists
                  <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs">9</span>
                </button>
                <button className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:bg-white/5 flex items-center gap-2">
                  Community
                  <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs">2</span>
                </button>
                <button className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:bg-white/5">
                  Scripture
                </button>
              </div>

              {/* Prayer Suggestions */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-semibold text-gray-300">Prayer suggestions</h4>
                  <Link href="#" className="text-xs text-purple-400 hover:text-purple-300">
                    View all suggestions
                  </Link>
                </div>

                <div className="space-y-2">
                  <PrayerItem
                    icon="solar:book-bookmark-bold-duotone"
                    title="Morning devotional guide"
                    subtitle="4 prayers · Scripture"
                    avatars={3}
                  />
                  <PrayerItem
                    icon="solar:star-bold-duotone"
                    title="Gratitude & thanksgiving"
                    subtitle="Devotional"
                    avatars={2}
                  />
                  <PrayerItem
                    icon="solar:calendar-bold-duotone"
                    title="Weekly worship prep"
                    subtitle="15 tasks · Sheets"
                    avatars={2}
                  />
                </div>
              </div>

              {/* Community Prayers */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-semibold text-gray-300">Community prayers</h4>
                  <Link href="#" className="text-xs text-purple-400 hover:text-purple-300">
                    View all prayers
                  </Link>
                </div>

                <div className="space-y-2">
                  <PrayerItem
                    icon="solar:heart-bold-duotone"
                    title="Healing & restoration"
                    subtitle="4 requests · Prayer"
                    avatars={3}
                    urgent
                  />
                  <PrayerItem
                    icon="solar:check-circle-bold-duotone"
                    title="Answered prayers"
                    subtitle="13 items · Praise"
                    avatars={2}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center gap-2">
                  <Icon icon="solar:link-bold-duotone" className="text-base" />
                  <span>Prayer links</span>
                  <span className="text-gray-600">—</span>
                  <span>Daily devotions, requests, praise</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span>Instant sync on</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// Helper Component for Prayer Items
function PrayerItem({
  icon,
  title,
  subtitle,
  avatars,
  urgent = false
}: {
  icon: string;
  title: string;
  subtitle: string;
  avatars: number;
  urgent?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${urgent ? 'bg-red-500/20' : 'bg-purple-500/20'}`}>
        <Icon icon={icon} className={`text-xl ${urgent ? 'text-red-400' : 'text-purple-400'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <h5 className="text-sm font-medium truncate">{title}</h5>
        <p className="text-xs text-gray-400">{subtitle}</p>
      </div>
      <div className="flex -space-x-2">
        {Array.from({ length: avatars }).map((_, i) => (
          <div
            key={i}
            className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 border-2 border-gray-900"
            style={{
              background: `linear-gradient(135deg, ${
                i === 0 ? '#a78bfa, #ec4899' : i === 1 ? '#60a5fa, #a78bfa' : '#fbbf24, #f97316'
              })`
            }}
          />
        ))}
      </div>
    </div>
  );
}
