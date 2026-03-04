import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProfileView } from '@/components/sections/profile-view';
import { userProfileService } from '@/services';

interface ProfilePageProps {
  params: Promise<{
    username: string;
  }>;
}

export async function generateMetadata(
  { params }: ProfilePageProps,
): Promise<Metadata> {
  const { username } = await params;
  const user = await userProfileService.getUserByUsername(username);

  if (!user) {
    return {
      title: 'Profile Not Found | Superteam Academy',
    };
  }

  return {
    title: `${user.displayName || user.username} | Superteam Academy`,
    description: user.bio ?? `View ${user.displayName || user.username}'s learning profile.`,
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const user = await userProfileService.getUserByUsername(username);

  if (!user) {
    notFound();
  }

  return <ProfileView user={user} isOwnProfile={false} />;
}
