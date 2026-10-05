import type { Metadata } from 'next';
import { LegalDocument } from '../../../src/legal-document.component';

export const metadata: Metadata = {
  title: 'Privacy Policy | itch dashboard',
  description: 'Privacy Policy for the itch dashboard companion app.',
};

export default function Page() {
  return <LegalDocument document="privacy" />;
}
