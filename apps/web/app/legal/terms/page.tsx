import type { Metadata } from 'next';
import { LegalDocument } from '../../../src/legal-document.component';

export const metadata: Metadata = {
  title: 'Terms and Conditions | Scratch',
  description: 'Terms and Conditions for the Scratch companion app.',
};

export default function Page() {
  return <LegalDocument document="terms" />;
}
