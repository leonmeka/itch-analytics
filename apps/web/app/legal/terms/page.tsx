import type { Metadata } from 'next';
import { LegalDocument } from '../../../src/legal-document.component';

export const metadata: Metadata = {
  title: 'Terms and Conditions | itch dashboard',
  description: 'Terms and Conditions for the itch dashboard companion app.',
};

export default function Page() {
  return <LegalDocument document="terms" />;
}
