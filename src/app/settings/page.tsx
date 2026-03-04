'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSolana } from '@/hooks/useSolana';
import { useIntlPathname, useIntlRouter } from '@/i18n/navigation';
import { userProfileService, type UpdatePreferencesInput, type UpdateProfileInput } from '@/services';
import type { User } from '@/types';

type ToastState =
  | { type: 'success'; message: string }
  | { type: 'error'; message: string }
  | null;

function SettingsForm({ user }: { user: User }) {
  const router = useRouter();
  const intlRouter = useIntlRouter();
  const intlPathname = useIntlPathname();
  const { theme, setTheme } = useTheme();
  const { walletAddress } = useSolana();
  const { signInWithGoogle } = useAuth();

  const [toast, setToast] = useState<ToastState>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [isClearingProgress, setIsClearingProgress] = useState(false);

  const [profileForm, setProfileForm] = useState<UpdateProfileInput>({
    displayName: user.displayName ?? user.username,
    username: user.username,
    bio: user.bio,
    twitterUrl: user.twitterUrl ?? null,
    githubUrl: user.githubUrl ?? null,
  });

  const [preferencesForm, setPreferencesForm] = useState<UpdatePreferencesInput>({
    preferredLanguage: user.preferredLanguage ?? 'en',
    themePreference: user.themePreference ?? 'dark',
    emailNotifications: user.emailNotifications ?? true,
    profileVisibility: user.profileVisibility ?? 'public',
    showOnLeaderboard: user.showOnLeaderboard ?? true,
  });

  const showToast = (nextToast: ToastState) => {
    setToast(nextToast);
    window.setTimeout(() => setToast(null), 3000);
  };

  const saveProfile = async () => {
    setIsSavingProfile(true);
    try {
      await userProfileService.updateProfile(user.id, profileForm);
      showToast({ type: 'success', message: 'Profile updated successfully.' });
    } catch (error) {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to update profile.',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const savePreferences = async () => {
    setIsSavingPreferences(true);
    try {
      await userProfileService.updatePreferences(user.id, preferencesForm);
      setTheme(preferencesForm.themePreference === 'system' ? 'dark' : preferencesForm.themePreference);
      intlRouter.replace(intlPathname, { locale: preferencesForm.preferredLanguage });
      showToast({ type: 'success', message: 'Preferences saved.' });
      router.refresh();
    } catch (error) {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to save preferences.',
      });
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const clearProgress = async () => {
    setIsClearingProgress(true);
    try {
      await userProfileService.clearProgress(user.id);
      showToast({ type: 'success', message: 'Progress cleared successfully.' });
      router.refresh();
    } catch (error) {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to clear progress.',
      });
    } finally {
      setIsClearingProgress(false);
    }
  };

  return (
    <main className="flex-1">
      {toast && (
        <div
          className={`fixed right-4 top-20 z-50 rounded-xl border px-4 py-3 text-sm shadow-xl ${
            toast.type === 'success'
              ? 'border-accent-green/35 bg-accent-green/10 text-accent-green'
              : 'border-destructive/35 bg-destructive/10 text-destructive'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            {toast.message}
          </div>
        </div>
      )}

      <section className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-text-primary">Settings</h1>

        <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-text-primary">Profile</h2>
          <div className="mt-4 grid gap-4">
            <div className="rounded-xl border border-dashed border-border bg-background p-4 text-sm text-text-secondary">
              Avatar upload coming soon
            </div>

            <label className="grid gap-1 text-sm text-text-secondary">
              Name
              <input
                type="text"
                value={profileForm.displayName}
                onChange={(event) =>
                  setProfileForm((prev) => ({ ...prev, displayName: event.target.value }))
                }
                className="rounded-lg border border-border bg-background px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-ring/60"
              />
            </label>

            <label className="grid gap-1 text-sm text-text-secondary">
              Username
              <input
                type="text"
                value={profileForm.username}
                onChange={(event) =>
                  setProfileForm((prev) => ({ ...prev, username: event.target.value }))
                }
                className="rounded-lg border border-border bg-background px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-ring/60"
              />
            </label>

            <label className="grid gap-1 text-sm text-text-secondary">
              Bio
              <textarea
                rows={3}
                value={profileForm.bio ?? ''}
                onChange={(event) =>
                  setProfileForm((prev) => ({ ...prev, bio: event.target.value || null }))
                }
                className="rounded-lg border border-border bg-background px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-ring/60"
              />
            </label>

            <label className="grid gap-1 text-sm text-text-secondary">
              Twitter
              <input
                type="url"
                value={profileForm.twitterUrl ?? ''}
                onChange={(event) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    twitterUrl: event.target.value || null,
                  }))
                }
                className="rounded-lg border border-border bg-background px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-ring/60"
              />
            </label>

            <label className="grid gap-1 text-sm text-text-secondary">
              GitHub
              <input
                type="url"
                value={profileForm.githubUrl ?? ''}
                onChange={(event) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    githubUrl: event.target.value || null,
                  }))
                }
                className="rounded-lg border border-border bg-background px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-ring/60"
              />
            </label>

            <button
              type="button"
              onClick={() => void saveProfile()}
              disabled={isSavingProfile}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent-cyan px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-70"
            >
              {isSavingProfile && <Loader2 size={14} className="animate-spin" />}
              Save Profile
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-text-primary">Account</h2>
          <div className="mt-4 space-y-4 text-sm text-text-secondary">
            <div className="rounded-lg border border-border bg-background px-4 py-3">
              Connected wallet: {walletAddress ?? 'Not connected'}
            </div>

            <button
              type="button"
              onClick={() => void signInWithGoogle()}
              className="rounded-lg border border-border bg-background px-4 py-2 font-semibold text-text-primary"
            >
              Link Google account
            </button>

            <div className="rounded-lg border border-destructive/35 bg-destructive/10 p-4">
              <p className="font-semibold text-destructive">Danger Zone</p>
              <p className="mt-1 text-xs text-text-secondary">
                This will reset course progress, XP logs, and streak records.
              </p>
              <button
                type="button"
                onClick={() => void clearProgress()}
                disabled={isClearingProgress}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-xs font-semibold text-white disabled:opacity-70"
              >
                {isClearingProgress && <Loader2 size={14} className="animate-spin" />}
                Clear progress
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-text-primary">Preferences</h2>
          <div className="mt-4 grid gap-4 text-sm text-text-secondary">
            <label className="grid gap-1">
              Language
              <select
                value={preferencesForm.preferredLanguage}
                onChange={(event) =>
                  setPreferencesForm((prev) => ({
                    ...prev,
                    preferredLanguage: event.target.value as 'en' | 'pt-BR' | 'es',
                  }))
                }
                className="rounded-lg border border-border bg-background px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-ring/60"
              >
                <option value="en">EN</option>
                <option value="pt-BR">PT-BR</option>
                <option value="es">ES</option>
              </select>
            </label>

            <label className="grid gap-1">
              Theme
              <select
                value={preferencesForm.themePreference}
                onChange={(event) =>
                  setPreferencesForm((prev) => ({
                    ...prev,
                    themePreference: event.target.value as 'dark' | 'light' | 'system',
                  }))
                }
                className="rounded-lg border border-border bg-background px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-ring/60"
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="system">System (maps to {theme ?? 'dark'})</option>
              </select>
            </label>

            <label className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
              Email notifications
              <input
                type="checkbox"
                checked={preferencesForm.emailNotifications}
                onChange={(event) =>
                  setPreferencesForm((prev) => ({
                    ...prev,
                    emailNotifications: event.target.checked,
                  }))
                }
                className="h-4 w-4 accent-accent-cyan"
              />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-text-primary">Privacy</h2>
          <div className="mt-4 grid gap-4 text-sm text-text-secondary">
            <label className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
              Profile visibility ({preferencesForm.profileVisibility})
              <input
                type="checkbox"
                checked={preferencesForm.profileVisibility === 'public'}
                onChange={(event) =>
                  setPreferencesForm((prev) => ({
                    ...prev,
                    profileVisibility: event.target.checked ? 'public' : 'private',
                  }))
                }
                className="h-4 w-4 accent-accent-cyan"
              />
            </label>

            <label className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
              Show on leaderboard
              <input
                type="checkbox"
                checked={preferencesForm.showOnLeaderboard}
                onChange={(event) =>
                  setPreferencesForm((prev) => ({
                    ...prev,
                    showOnLeaderboard: event.target.checked,
                  }))
                }
                className="h-4 w-4 accent-accent-cyan"
              />
            </label>

            <button
              type="button"
              onClick={() => void savePreferences()}
              disabled={isSavingPreferences}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent-cyan px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-70"
            >
              {isSavingPreferences && <Loader2 size={14} className="animate-spin" />}
              Save Preferences
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated || !user) {
    return (
      <main className="flex-1">
        <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="h-56 animate-pulse rounded-2xl border border-border bg-surface" />
        </section>
      </main>
    );
  }

  return <SettingsForm key={user.id} user={user} />;
}
