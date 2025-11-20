'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface InviteOptionsProps {
  groupId: string;
  inviteCode: string;
  groupName: string;
}

export function InviteOptions({ groupId, inviteCode, groupName }: InviteOptionsProps) {
  const [copied, setCopied] = useState(false);

  const inviteUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/groups/join?code=${inviteCode}`
    : '';

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const message = encodeURIComponent(
      `Join our goal group "${groupName}"!\n\nInvite code: ${inviteCode}\nOr click: ${inviteUrl}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent(`Join "${groupName}" on DailyGoalTracker`);
    const body = encodeURIComponent(
      `Hey! I've created a group on DailyGoalTracker and I'd love for you to join.\n\nGroup: ${groupName}\nInvite Code: ${inviteCode}\n\nOr click this link to join directly:\n${inviteUrl}\n\nLet's achieve our goals together!`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const generateQRCode = () => {
    // Using a simple QR code API
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(inviteUrl)}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite Members</CardTitle>
        <CardDescription>Share this group with others</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Invite Code */}
        <div>
          <label className="text-sm font-medium mb-2 block">Invite Code</label>
          <div className="flex gap-2">
            <div className="flex-1 px-3 py-2 bg-gray-100 rounded-md font-mono text-lg font-bold text-center">
              {inviteCode}
            </div>
            <Button onClick={handleCopyCode} variant="outline" size="sm">
              {copied ? '✓' : '📋'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Share this code with people you want to invite
          </p>
        </div>

        {/* Invite Link */}
        <div>
          <label className="text-sm font-medium mb-2 block">Invite Link</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={inviteUrl}
              readOnly
              className="flex-1 px-3 py-2 border rounded-md text-sm bg-gray-50"
            />
            <Button onClick={handleCopyLink} variant="outline" size="sm">
              {copied ? '✓' : '🔗'}
            </Button>
          </div>
        </div>

        <div className="border-t pt-4 space-y-2">
          <p className="text-sm font-medium mb-3">Share via:</p>

          {/* WhatsApp */}
          <Button
            onClick={handleShareWhatsApp}
            variant="outline"
            className="w-full justify-start"
            size="sm"
          >
            <span className="mr-2">💬</span>
            Share on WhatsApp
          </Button>

          {/* Email */}
          <Button
            onClick={handleShareEmail}
            variant="outline"
            className="w-full justify-start"
            size="sm"
          >
            <span className="mr-2">✉️</span>
            Share via Email
          </Button>

          {/* QR Code */}
          <details className="group">
            <summary className="cursor-pointer list-none">
              <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md">
                <span className="text-sm font-medium flex items-center gap-2">
                  <span>📱</span>
                  Show QR Code
                </span>
                <span className="group-open:rotate-180 transition-transform">▼</span>
              </div>
            </summary>
            <div className="mt-3 p-4 bg-white border rounded-md text-center">
              <img
                src={generateQRCode()}
                alt="QR Code"
                className="mx-auto mb-2"
                width={200}
                height={200}
              />
              <p className="text-xs text-muted-foreground">
                Scan to join the group
              </p>
            </div>
          </details>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-xs text-blue-900">
            💡 <strong>Tip:</strong> Members who join will automatically be enrolled in the goal and
            can track progress together with the group.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
