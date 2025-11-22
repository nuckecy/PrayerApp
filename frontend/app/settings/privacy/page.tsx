'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AppHeader } from '@/components/layout/AppHeader';
import {
  downloadUserData,
  requestDataDeletion,
  getDeletionRequestStatus,
  cancelDeletionRequest,
  getDataRetentionInfo,
  type DeletionRequest,
} from '@/lib/privacy-compliance';
import { Download, Trash2, AlertTriangle, Info, X } from 'lucide-react';

export default function PrivacySettingsPage() {
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [deletionRequest, setDeletionRequest] = useState<DeletionRequest | undefined>();
  const [showDeletionConfirm, setShowDeletionConfirm] = useState(false);
  const [deletionReason, setDeletionReason] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadDeletionRequest();
  }, []);

  const loadDeletionRequest = async () => {
    const result = await getDeletionRequestStatus();
    if (result.success && result.request) {
      setDeletionRequest(result.request);
    }
  };

  const handleExportData = async () => {
    setExportLoading(true);
    setMessage(null);

    const result = await downloadUserData();

    if (result.success) {
      setMessage({
        type: 'success',
        text: 'Your data has been downloaded successfully!',
      });
    } else {
      setMessage({
        type: 'error',
        text: result.error || 'Failed to export data',
      });
    }

    setExportLoading(false);
  };

  const handleRequestDeletion = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone after 30 days.')) {
      return;
    }

    setLoading(true);
    setMessage(null);

    const result = await requestDataDeletion(deletionReason || undefined);

    if (result.success) {
      setMessage({
        type: 'success',
        text: 'Account deletion request submitted. Your data will be deleted in 30 days. You can cancel this request during the grace period.',
      });
      setShowDeletionConfirm(false);
      setDeletionReason('');
      await loadDeletionRequest();
    } else {
      setMessage({
        type: 'error',
        text: result.error || 'Failed to request deletion',
      });
    }

    setLoading(false);
  };

  const handleCancelDeletion = async () => {
    if (!deletionRequest) return;

    if (!confirm('Are you sure you want to cancel your account deletion request?')) {
      return;
    }

    setLoading(true);
    const result = await cancelDeletionRequest(deletionRequest.id);

    if (result.success) {
      setMessage({
        type: 'success',
        text: 'Account deletion request cancelled successfully.',
      });
      setDeletionRequest(undefined);
    } else {
      setMessage({
        type: 'error',
        text: result.error || 'Failed to cancel deletion request',
      });
    }

    setLoading(false);
  };

  const retentionInfo = getDataRetentionInfo();

  return (
    <>
      <AppHeader />
      <div className="container mx-auto p-6 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Privacy & Data Settings</h1>

        {message && (
          <div
            className={`p-4 rounded-lg mb-6 ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Deletion Request Status */}
        {deletionRequest && deletionRequest.status === 'pending' && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <CardTitle className="text-red-800">Account Deletion Pending</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-red-700 mb-4">
                Your account is scheduled for deletion on{' '}
                <strong>
                  {new Date(
                    new Date(deletionRequest.requestedAt).getTime() + 30 * 24 * 60 * 60 * 1000
                  ).toLocaleDateString()}
                </strong>
                . You can cancel this request at any time before then.
              </p>
              <Button
                onClick={handleCancelDeletion}
                disabled={loading}
                variant="outline"
                className="border-red-600 text-red-600 hover:bg-red-100"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel Deletion Request
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Export Data */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              <CardTitle>Export Your Data</CardTitle>
            </div>
            <CardDescription>
              Download a copy of all your data in JSON format (GDPR Article 15 - Right of Access)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Your export will include:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 mb-4 space-y-1">
              <li>Profile information</li>
              <li>Goal enrollments and progress</li>
              <li>Day completions</li>
              <li>Notifications</li>
              <li>Authored goals (if applicable)</li>
              <li>Recent security logs (90 days)</li>
            </ul>
            <Button onClick={handleExportData} disabled={exportLoading}>
              <Download className="w-4 h-4 mr-2" />
              {exportLoading ? 'Exporting...' : 'Download My Data'}
            </Button>
          </CardContent>
        </Card>

        {/* Data Retention */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              <CardTitle>Data Retention</CardTitle>
            </div>
            <CardDescription>How long we keep different types of data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(retentionInfo).map(([key, info]) => (
                <div key={key} className="border-b pb-3 last:border-b-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">{info.description}</p>
                      <p className="text-xs text-gray-500 mt-1">{info.period}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Delete Account */}
        {!deletionRequest && (
          <Card className="border-red-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-600" />
                <CardTitle className="text-red-800">Delete Account</CardTitle>
              </div>
              <CardDescription>
                Permanently delete your account and all associated data (GDPR Article 17 - Right to Erasure)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!showDeletionConfirm ? (
                <>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <div className="flex gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-yellow-800">
                        <p className="font-medium mb-1">Warning: This action is irreversible</p>
                        <p>
                          Deleting your account will permanently remove all your data after a 30-day grace period.
                          During this period, you can cancel the deletion request.
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowDeletionConfirm(true)}
                    variant="destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Request Account Deletion
                  </Button>
                </>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Reason for deletion (optional)
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border rounded-md"
                      rows={3}
                      placeholder="Help us improve by telling us why you're leaving..."
                      value={deletionReason}
                      onChange={(e) => setDeletionReason(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleRequestDeletion}
                      disabled={loading}
                      variant="destructive"
                    >
                      {loading ? 'Processing...' : 'Confirm Deletion'}
                    </Button>
                    <Button
                      onClick={() => {
                        setShowDeletionConfirm(false);
                        setDeletionReason('');
                      }}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Privacy Information */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium mb-2">Your Privacy Rights</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• <strong>Right to Access:</strong> Download your data at any time</li>
            <li>• <strong>Right to Erasure:</strong> Request permanent deletion of your account</li>
            <li>• <strong>Right to Portability:</strong> Receive your data in a machine-readable format</li>
            <li>• <strong>Right to Rectification:</strong> Update your information in account settings</li>
          </ul>
          <p className="text-xs text-gray-500 mt-3">
            Questions about privacy? Contact us at privacy@prayerapp.com
          </p>
        </div>
      </div>
    </>
  );
}
