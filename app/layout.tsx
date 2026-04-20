// File: app/layout.tsx
import './globals.css';
import Providers from './components/Providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}