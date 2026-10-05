import type { Metadata } from 'next';
import { LegalDocument } from '../../../src/legal-document.component';

export const metadata: Metadata = {
  title: 'Privacy Policy | Scratch',
  description: 'Privacy Policy for the Scratch companion app.',
};

export default function Page() {
  return <LegalDocument document="privacy" />;
}
