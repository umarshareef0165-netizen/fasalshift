import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FasalShift — Which rotation should a Punjab farmer plant next?',
  description:
    'FasalShift tells a Punjab wheat farmer which rotation to plant next — and how many days their growing window has already shifted — from live NASA Earth observations (NASA POWER). Built for NASA Space Apps Challenge 2026, Challenge 7: Field Shift.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
