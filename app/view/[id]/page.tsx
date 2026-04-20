// File: app/view/[id]/page.tsx
'use client';
import { useState } from 'react';
import { decryptFile } from '@/lib/crypto';
import Header from '@/app/components/Header';

export default function DownloadPage({ params }: { params: { id: string } }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'pin_required' | 'ready' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [pin, setPin] = useState('');
  const [fileData, setFileData] = useState<{ url: string; name: string; type: string; size: number } | null>(null);

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const handleFetch = async () => {
    try {
      setStatus('loading');
      setErrorMsg('');
      const hexKey = window.location.hash.substring(1);
      
      if (!hexKey) {
        setErrorMsg('Decryption key not found. Make sure the full URL is correct.');
        setStatus('error');
        return;
      }

      const res = await fetch(`/api/download/${params.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });

      if (res.status === 401) { setStatus('pin_required'); return; }
      if (res.status === 403) { setErrorMsg('Incorrect PIN. Please try again.'); setStatus('pin_required'); return; }
      if (res.status === 410) { setErrorMsg('This link has expired.'); setStatus('error'); return; }
      if (!res.ok) { setErrorMsg('File not found or has expired.'); setStatus('error'); return; }
      
      const mimeType = res.headers.get('X-MimeType') || 'application/octet-stream';
      const fileName = res.headers.get('X-Filename') || 'file';
      
      const arrayBuffer = await res.arrayBuffer();
      const decryptedBlob = await decryptFile(arrayBuffer, hexKey, null);
      
      const typedBlob = new Blob([decryptedBlob], { type: mimeType });
      setFileData({ url: URL.createObjectURL(typedBlob), name: fileName, type: mimeType, size: decryptedBlob.byteLength });
      setStatus('ready');
    } catch (err) {
      console.error(err);
      setErrorMsg('Decryption failed. The link may be invalid or corrupted.');
      setStatus('error');
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'idle':
        return (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">You&apos;ve received a secure file</h2>
            <p className="text-slate-400 mb-6">Click the button below to access and decrypt your file.</p>
            <button onClick={handleFetch} className="w-full bg-sky-500 text-slate-900 font-bold p-3 rounded-lg hover:bg-sky-400 transition-colors">
              Access File
            </button>
          </div>
        );

      case 'loading':
        return (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-400 mx-auto"></div>
            <p className="mt-4 text-slate-300">Decrypting file...</p>
          </div>
        );

      case 'pin_required':
        return (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">PIN Required</h2>
            <p className="text-slate-400 mb-6">This file is protected. Please enter the PIN to continue.</p>
            {errorMsg && <p className="text-red-400 mb-4">{errorMsg}</p>}
            <input 
              type="password" 
              value={pin} 
              onChange={e => setPin(e.target.value)} 
              onKeyUp={e => e.key === 'Enter' && handleFetch()}
              className="w-full mb-4 p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-sky-500 focus:border-sky-500 text-center" 
              placeholder="Enter PIN"
              autoFocus
            />
            <button onClick={handleFetch} className="w-full bg-sky-500 text-slate-900 font-bold p-3 rounded-lg hover:bg-sky-400 transition-colors">
              Unlock
            </button>
          </div>
        );

      case 'error':
        return (
          <div className="text-center">
             <h2 className="text-2xl font-bold mb-4 text-red-500">An Error Occurred</h2>
             <p className="text-slate-300 bg-red-500/10 p-4 rounded-lg">{errorMsg}</p>
             <button onClick={() => {setStatus('idle'); setErrorMsg(''); setPin('');}} className="mt-6 text-sky-400 hover:text-sky-300">
                Try Again
             </button>
          </div>
        );
        
      case 'ready':
        if (!fileData) return null;
        return (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2 text-emerald-400">File Ready!</h2>
            <p className="text-slate-400 mb-6">Your file has been decrypted and is ready to download.</p>

            <div className="bg-slate-700/50 p-4 rounded-lg mb-6 flex items-center space-x-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-sky-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <div className="text-left overflow-hidden">
                  <p className="font-semibold truncate">{fileData.name}</p>
                  <p className="text-sm text-slate-400">{formatBytes(fileData.size)}</p>
              </div>
            </div>

            {fileData.type.startsWith('image/') && (
               <img src={fileData.url} alt="File Preview" className="max-w-full max-h-60 h-auto mx-auto mb-6 rounded-lg bg-slate-700" />
            )}
            {fileData.type.startsWith('video/') && (
               <video src={fileData.url} controls className="w-full mb-6 rounded-lg bg-slate-700" />
            )}

            <a href={fileData.url} download={fileData.name} className="w-full block bg-emerald-500 text-slate-900 font-bold p-3 rounded-lg hover:bg-emerald-400 transition-colors">
              Download File
            </a>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col min-h-screen text-white">
      <Header />
      <main className="flex-grow flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl transition-all">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}