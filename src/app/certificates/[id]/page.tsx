import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CertificateView } from '@/components/sections/certificate-view';
import { CredentialService } from '@/services/chain/CredentialService';

const credentialService = new CredentialService();

interface CertificatePageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata(
  { params }: CertificatePageProps,
): Promise<Metadata> {
  const { id } = await params;
  const credential = await credentialService.getCredentialByMintAddress(id);

  if (!credential) {
    return {
      title: 'Certificate Not Found | Superteam Academy',
    };
  }

  return {
    title: `${credential.course.title} Certificate | Superteam Academy`,
    description: `View the on-chain certificate for ${credential.course.title}.`,
  };
}

export default async function CertificatePage({ params }: CertificatePageProps) {
  const { id } = await params;
  const credential = await credentialService.getCredentialByMintAddress(id);

  if (!credential) {
    notFound();
  }

  return <CertificateView credential={credential} />;
}
