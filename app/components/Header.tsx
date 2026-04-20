// File: app/components/Header.tsx
'use client';
import Link from 'next/link';
import { signIn, signOut, useSession } from 'next-auth/react';

export default function Header() {
  const { data: session, status } = useSession();

  return (
    <header className="bg-slate-800/50 backdrop-blur-sm w-full p-4 sticky top-0 z-10 border-b border-slate-700">
      <nav className="max-w-5xl mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-sky-400 hover:text-sky-300 transition-colors">
          SecureShare
        </Link>
        <div className="flex items-center space-x-4">
          {status === 'loading' ? (
            <div className="h-9 w-24 bg-slate-700 rounded-lg animate-pulse"></div>
          ) : session ? (
            <>
              <Link href="/dashboard" className="font-medium text-white hover:text-sky-400 transition-colors">
                Dashboard
              </Link>
              <button
                onClick={() => signOut()}
                className="bg-red-500 text-white font-bold px-4 py-2 rounded-lg hover:bg-red-400 transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={() => signIn()}
              className="bg-sky-500 text-slate-900 font-bold px-4 py-2 rounded-lg hover:bg-sky-400 transition-colors"
            >
              Login
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}