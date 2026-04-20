// File: app/dashboard/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Header from "../components/Header";

export default async function Dashboard() {
  const session = await getServerSession();
  if (!session?.user?.email) redirect("/api/auth/signin");

  const files = await prisma.sharedFile.findMany({
    where: { user: { email: session.user.email } },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="min-h-screen text-white">
      <Header />
      <main className="max-w-4xl mx-auto p-4 sm:p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Your Files</h1>
          <a href="/" className="bg-sky-500 text-slate-900 font-bold px-4 py-2 rounded-lg hover:bg-sky-400 transition-colors">
            Upload New File
          </a>
        </div>
        
        <div className="bg-slate-800 rounded-lg shadow-xl">
          <ul className="divide-y divide-slate-700">
            {files.map(file => (
              <li key={file.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center hover:bg-slate-700/50 transition-colors">
                <div className="flex-grow mb-3 sm:mb-0">
                  <p className="font-semibold text-white truncate max-w-xs sm:max-w-sm">{file.originalName}</p>
                  <p className="text-sm text-slate-400">
                    Created on {new Date(file.createdAt).toLocaleDateString()}
                    {file.expiresAt ? ` - Expires ${new Date(file.expiresAt).toLocaleDateString()}` : ''}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                   <div className="flex items-center space-x-2 text-sm bg-slate-700 px-3 py-1 rounded-full">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                     <span className="font-mono font-bold">{file.downloads}</span>
                     <span className="hidden sm:inline">Downloads</span>
                  </div>
                  <a href={`/view/${file.id}`} className="text-sky-400 hover:text-sky-300 font-medium whitespace-nowrap">
                    View Link
                  </a>
                </div>
              </li>
            ))}
          </ul>
          {files.length === 0 && (
            <div className="text-center p-8 text-slate-400">
              <p>You haven&apos;t uploaded any files yet.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}