"use client"

import React, { useState } from 'react'

/**
 * Vercel/Stripe-inspired Design System Component Examples
 *
 * This file demonstrates all the design system components with their
 * various states and interactions following the Vercel/Stripe aesthetic.
 */

// ===== BUTTON EXAMPLES =====
export function ButtonExamples() {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Buttons</h3>
        <div className="flex flex-wrap gap-4">
          {/* Primary Buttons */}
          <button className="btn-primary">
            Create Prayer
          </button>
          <button className="btn-primary" disabled>
            Disabled Primary
          </button>

          {/* Secondary Buttons */}
          <button className="btn-secondary">
            View All
          </button>
          <button className="btn-secondary" disabled>
            Disabled Secondary
          </button>

          {/* Ghost Buttons */}
          <button className="btn-ghost">
            Cancel
          </button>
          <button className="btn-ghost" disabled>
            Disabled Ghost
          </button>

          {/* Destructive Buttons */}
          <button className="btn-destructive">
            Delete Prayer
          </button>
          <button className="btn-destructive" disabled>
            Disabled Destructive
          </button>
        </div>
      </div>

      {/* Button Sizes */}
      <div>
        <h4 className="text-base font-medium mb-4">Button Sizes</h4>
        <div className="flex flex-wrap items-center gap-4">
          <button className="btn-primary text-xs px-3 py-1.5">
            Extra Small
          </button>
          <button className="btn-primary text-sm px-4 py-2">
            Small (Default)
          </button>
          <button className="btn-primary text-base px-5 py-2.5">
            Medium
          </button>
          <button className="btn-primary text-lg px-6 py-3">
            Large
          </button>
        </div>
      </div>

      {/* Button with Icons */}
      <div>
        <h4 className="text-base font-medium mb-4">Buttons with Icons</h4>
        <div className="flex flex-wrap gap-4">
          <button className="btn-primary">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Prayer
          </button>

          <button className="btn-secondary">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </button>

          {/* Icon-only button */}
          <button className="btn-ghost p-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

// ===== CARD EXAMPLES =====
export function CardExamples() {
  return (
    <div className="space-y-8">
      <h3 className="text-lg font-semibold mb-4">Cards</h3>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Default Card */}
        <div className="card">
          <h4 className="font-semibold mb-2">Default Card</h4>
          <p className="text-sm text-muted-foreground">
            This is a basic card with a border. Perfect for content sections.
          </p>
        </div>

        {/* Elevated Card */}
        <div className="card-elevated">
          <h4 className="font-semibold mb-2">Elevated Card</h4>
          <p className="text-sm text-muted-foreground">
            This card has shadow elevation and hover effects for prominence.
          </p>
        </div>

        {/* Interactive Card */}
        <div className="card-interactive">
          <h4 className="font-semibold mb-2">Interactive Card</h4>
          <p className="text-sm text-muted-foreground">
            Click this card - it has hover and active states for interaction.
          </p>
        </div>
      </div>

      {/* Prayer Card Example */}
      <div className="card-elevated max-w-md">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h4 className="font-semibold">Morning Prayer</h4>
            <p className="text-sm text-muted-foreground">Daily Devotion</p>
          </div>
          <span className="badge badge-success">Completed</span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Thank you Lord for this new day. Guide my steps and fill my heart with your peace.
        </p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>7:00 AM</span>
          <span>•</span>
          <span>5 min read</span>
        </div>
      </div>
    </div>
  )
}

// ===== INPUT EXAMPLES =====
export function InputExamples() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <div className="space-y-8">
      <h3 className="text-lg font-semibold mb-4">Form Inputs</h3>

      <div className="max-w-md space-y-6">
        {/* Text Input */}
        <div className="form-group">
          <label htmlFor="prayer-title" className="input-label">
            Prayer Title
          </label>
          <input
            type="text"
            id="prayer-title"
            className="input"
            placeholder="Enter prayer title..."
          />
          <p className="input-help">
            Give your prayer a meaningful title
          </p>
        </div>

        {/* Email Input */}
        <div className="form-group">
          <label htmlFor="email" className="input-label">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            className="input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Password Input */}
        <div className="form-group">
          <label htmlFor="password" className="input-label">
            Password
          </label>
          <input
            type="password"
            id="password"
            className="input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* Input with Error */}
        <div className="form-group">
          <label htmlFor="error-input" className="input-label">
            Required Field
          </label>
          <input
            type="text"
            id="error-input"
            className="input input-error"
            placeholder="This field has an error"
          />
          <p className="input-error-text">
            This field is required
          </p>
        </div>

        {/* Disabled Input */}
        <div className="form-group">
          <label htmlFor="disabled-input" className="input-label">
            Disabled Input
          </label>
          <input
            type="text"
            id="disabled-input"
            className="input"
            placeholder="Cannot edit this field"
            disabled
          />
        </div>

        {/* Textarea */}
        <div className="form-group">
          <label htmlFor="prayer-content" className="input-label">
            Prayer Content
          </label>
          <textarea
            id="prayer-content"
            className="input min-h-[120px] resize-none"
            placeholder="Write your prayer here..."
          />
        </div>
      </div>
    </div>
  )
}

// ===== BADGE EXAMPLES =====
export function BadgeExamples() {
  return (
    <div className="space-y-8">
      <h3 className="text-lg font-semibold mb-4">Badges & Pills</h3>

      <div className="flex flex-wrap gap-3">
        <span className="badge badge-default">Default</span>
        <span className="badge badge-primary">Primary</span>
        <span className="badge badge-success">Success</span>
        <span className="badge badge-warning">Warning</span>
        <span className="badge badge-destructive">Error</span>
        <span className="badge badge-info">Info</span>
      </div>

      {/* Larger Pills */}
      <div className="flex flex-wrap gap-3">
        <span className="badge badge-default text-sm px-3 py-1">Prayer Count: 42</span>
        <span className="badge badge-success text-sm px-3 py-1">Active Streak: 7 days</span>
        <span className="badge badge-info text-sm px-3 py-1">Morning Prayer</span>
      </div>
    </div>
  )
}

// ===== ALERT EXAMPLES =====
export function AlertExamples() {
  return (
    <div className="space-y-8">
      <h3 className="text-lg font-semibold mb-4">Alerts & Toasts</h3>

      <div className="space-y-4 max-w-2xl">
        {/* Default Alert */}
        <div className="alert alert-default">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="font-medium">New Feature Available</h4>
              <p className="text-sm text-muted-foreground mt-1">
                You can now share your prayers with your prayer group.
              </p>
            </div>
          </div>
        </div>

        {/* Success Alert */}
        <div className="alert alert-success">
          <div className="flex gap-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="font-medium">Prayer Saved Successfully</h4>
              <p className="text-sm opacity-90 mt-1">
                Your prayer has been added to your prayer journal.
              </p>
            </div>
          </div>
        </div>

        {/* Warning Alert */}
        <div className="alert alert-warning">
          <div className="flex gap-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h4 className="font-medium">Reminder</h4>
              <p className="text-sm opacity-90 mt-1">
                You have 3 unanswered prayer requests from your group.
              </p>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        <div className="alert alert-destructive">
          <div className="flex gap-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="font-medium">Connection Error</h4>
              <p className="text-sm opacity-90 mt-1">
                Unable to sync your prayers. Please check your internet connection.
              </p>
            </div>
          </div>
        </div>

        {/* Info Alert */}
        <div className="alert alert-info">
          <div className="flex gap-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="font-medium">Tip</h4>
              <p className="text-sm opacity-90 mt-1">
                Set daily prayer reminders to maintain your prayer streak.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ===== MODAL/DIALOG EXAMPLE =====
export function DialogExample() {
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-8">
      <h3 className="text-lg font-semibold mb-4">Dialog / Modal</h3>

      <button
        className="btn-primary"
        onClick={() => setOpen(true)}
      >
        Open Prayer Dialog
      </button>

      {open && (
        <>
          {/* Overlay */}
          <div
            className="dialog-overlay"
            onClick={() => setOpen(false)}
          />

          {/* Dialog Content */}
          <div className="dialog-content">
            <div className="dialog-header">
              <h2 className="text-lg font-semibold">Create New Prayer</h2>
              <p className="text-sm text-muted-foreground">
                Add a new prayer to your journal
              </p>
            </div>

            <div className="form-section">
              <div className="form-group">
                <label htmlFor="modal-title" className="input-label">
                  Prayer Title
                </label>
                <input
                  type="text"
                  id="modal-title"
                  className="input"
                  placeholder="Enter prayer title..."
                />
              </div>

              <div className="form-group">
                <label htmlFor="modal-content" className="input-label">
                  Prayer Content
                </label>
                <textarea
                  id="modal-content"
                  className="input min-h-[100px] resize-none"
                  placeholder="Write your prayer..."
                />
              </div>
            </div>

            <div className="dialog-footer">
              <button
                className="btn-ghost"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={() => setOpen(false)}
              >
                Save Prayer
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ===== NAVIGATION EXAMPLE =====
export function NavigationExample() {
  const [activeItem, setActiveItem] = useState('dashboard')

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'prayers', label: 'My Prayers', icon: '🙏' },
    { id: 'journal', label: 'Prayer Journal', icon: '📖' },
    { id: 'groups', label: 'Prayer Groups', icon: '👥' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ]

  return (
    <div className="space-y-8">
      <h3 className="text-lg font-semibold mb-4">Navigation</h3>

      <div className="max-w-xs">
        <nav className="space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveItem(item.id)}
              className={`nav-item w-full text-left ${
                activeItem === item.id ? 'nav-item-active' : ''
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}

// ===== LOADING STATES =====
export function LoadingStates() {
  return (
    <div className="space-y-8">
      <h3 className="text-lg font-semibold mb-4">Loading States</h3>

      {/* Loading Dots */}
      <div className="flex items-center gap-4">
        <button className="btn-primary" disabled>
          <span className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </span>
          <span className="ml-2">Saving</span>
        </button>
      </div>

      {/* Skeleton Loaders */}
      <div className="space-y-4 max-w-md">
        <div className="skeleton h-4 w-3/4"></div>
        <div className="skeleton h-4 w-full"></div>
        <div className="skeleton h-4 w-5/6"></div>
        <div className="skeleton h-20 w-full"></div>
      </div>

      {/* Shimmer Card */}
      <div className="card max-w-md shimmer">
        <div className="space-y-3">
          <div className="skeleton h-6 w-1/3"></div>
          <div className="skeleton h-4 w-full"></div>
          <div className="skeleton h-4 w-4/5"></div>
        </div>
      </div>
    </div>
  )
}

// ===== COMPLETE FORM EXAMPLE =====
export function CompleteFormExample() {
  return (
    <div className="space-y-8">
      <h3 className="text-lg font-semibold mb-4">Complete Prayer Form</h3>

      <div className="card-elevated max-w-2xl">
        <form className="form-section">
          {/* Form Header */}
          <div className="border-b border-gray-200 dark:border-gray-800 pb-6">
            <h2 className="text-xl font-semibold">Create Prayer Request</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Share your prayer request with your prayer group
            </p>
          </div>

          {/* Form Fields */}
          <div className="form-group">
            <label htmlFor="prayer-type" className="input-label">
              Prayer Type
            </label>
            <select className="input">
              <option>Personal</option>
              <option>Family</option>
              <option>Health</option>
              <option>Work</option>
              <option>Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="title" className="input-label">
              Title <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              id="title"
              className="input"
              placeholder="Brief title for your prayer request"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description" className="input-label">
              Description <span className="text-destructive">*</span>
            </label>
            <textarea
              id="description"
              className="input min-h-[150px] resize-none"
              placeholder="Describe your prayer request in detail..."
            />
            <p className="input-help">
              Be specific about what you're praying for
            </p>
          </div>

          <div className="form-group">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded border-gray-300" />
              <span className="text-sm font-medium">Share with prayer group</span>
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-800">
            <button type="button" className="btn-ghost">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Submit Prayer Request
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ===== MAIN SHOWCASE COMPONENT =====
export default function DesignSystemShowcase() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-gradient text-4xl font-bold mb-4">
            PrayerApp Design System
          </h1>
          <p className="text-lg text-muted-foreground">
            Vercel/Stripe-inspired components for a modern prayer application
          </p>
        </div>

        <div className="divider"></div>

        {/* Components */}
        <ButtonExamples />
        <div className="divider"></div>

        <CardExamples />
        <div className="divider"></div>

        <InputExamples />
        <div className="divider"></div>

        <BadgeExamples />
        <div className="divider"></div>

        <AlertExamples />
        <div className="divider"></div>

        <DialogExample />
        <div className="divider"></div>

        <NavigationExample />
        <div className="divider"></div>

        <LoadingStates />
        <div className="divider"></div>

        <CompleteFormExample />
      </div>
    </div>
  )
}