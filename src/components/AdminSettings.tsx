'use client';

import { useState } from 'react';
import { saveWebhookUrl } from '@/app/actions';
import { Card, Input, Button } from '@/components/ui';
import { RadioReceiver, Save, CheckCircle } from 'lucide-react';

interface AdminSettingsProps {
  initialWebhookUrl: string;
}

export function AdminSettings({ initialWebhookUrl }: AdminSettingsProps) {
  const [webhookUrl, setWebhookUrl] = useState(initialWebhookUrl);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    setError(null);
    try {
      await saveWebhookUrl(webhookUrl.trim());
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings. Make sure the database migration 004 was run.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-[hsl(var(--border))]">
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-[hsl(var(--border-muted))]">
          <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
            <RadioReceiver className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[hsl(var(--foreground))]">System Automation Webhook</h3>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Configure n8n or generic webhook endpoints for clinical alerts.</p>
          </div>
        </div>

        <div className="space-y-3">
          <Input
            label="Booking Notification Webhook URL"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://your-n8n-instance.com/webhook/appointments"
            hint="Triggered with appointment and patient payload details when a slot is scheduled."
          />

          {error && (
            <div className="alert alert-error text-xs">
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="alert alert-success text-xs flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Webhook configuration successfully saved!</span>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <Button
              onClick={handleSave}
              loading={saving}
              className="bg-purple-600 hover:bg-purple-500 text-white font-semibold flex items-center gap-1.5 px-4 py-2 text-xs"
              type="button"
            >
              <Save className="w-3.5 h-3.5 shrink-0" /> Save Settings
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
