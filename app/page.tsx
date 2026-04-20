// File: app/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { encryptFile } from '@/lib/crypto';
import { QRCodeCanvas } from 'qrcode.react';
import Header from './components/Header';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [pin, setPin] = useState('');
  const [status, setStatus] = useState<'idle' | 'encrypting' | 'uploading' | 'done'>('idle');
  const [shareUrl, setShareUrl] = useState('');
  const [expiry, setExpiry] = useState('0'); // In seconds, '0' for never
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    if (navigator.share) {
      setCanShare(true);
    }
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    setStatus('encrypting');
    try {
      const { encryptedBlob, hexKey } = await encryptFile(file, 0);
      setStatus('uploading');

      const formData = new FormData();
      formData.append('file', encryptedBlob);
      formData.append('originalName', file.name);
      formData.append('mimeType', file.type || 'application/octet-stream');
      formData.append('expiryInSeconds', expiry);
      if (pin) formData.append('pin', pin);

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (data.success) {
        setShareUrl(`${window.location.origin}/view/${data.fileId}#${hexKey}`);
        setStatus('done');
      }
    } catch (err) {
      alert('Upload failed');
      setStatus('idle');
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleShare = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: 'SecureShare File',
        text: 'You have received a securely shared file:',
        url: shareUrl,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen text-white">
      <Header />
      <main className="flex-grow flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="text-center mb-8">
          <p className="text-slate-300 max-w-lg text-lg">
            End-to-end encrypted file sharing. Your files are encrypted in your browser before they&apos;re uploaded and can only be decrypted by someone with the unique link.
          </p>
        </div>

        <div className="w-full max-w-md bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl">
          {status !== 'done' ? (
            <>
              <label htmlFor="file-upload" className="mb-4 flex flex-col items-center justify-center w-full h-32 border-2 border-slate-600 border-dashed rounded-lg cursor-pointer bg-slate-700 hover:bg-slate-600 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-8 h-8 mb-2 text-slate-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/></svg>
                  <p className="text-sm text-slate-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                  {file && <p className="text-xs text-sky-400 mt-1">{file.name}</p>}
                </div>
                <input id="file-upload" type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </label>
              
              <div className="flex space-x-2 mb-4">
                  <input 
                    type="password" 
                    placeholder="Optional PIN" 
                    value={pin} 
                    onChange={(e) => setPin(e.target.value)} 
                    autoComplete="new-password"
                    className="w-1/2 p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-sky-500 focus:border-sky-500" 
                  />
                  <select value={expiry} onChange={(e) => setExpiry(e.target.value)} className="w-1/2 p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-sky-500 focus:border-sky-500">
                      <option value="0">Never Expires</option>
                      <option value="300">5 Minutes</option>
                      <option value="3600">1 Hour</option>
                      <option value="86400">24 Hours</option>
                      <option value="604800">7 Days</option>
                  </select>
              </div>
              
              <button 
                onClick={handleUpload} 
                className="w-full bg-sky-500 text-slate-900 font-bold p-3 rounded-lg hover:bg-sky-400 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed" 
                disabled={!file || status !== 'idle'}
              >
                {status === 'idle' ? 'Encrypt & Upload' : `${status.charAt(0).toUpperCase() + status.slice(1)}...`}
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center text-center">
              <h3 className="text-2xl font-bold mb-4 text-emerald-400">Upload Complete!</h3>
              <p className="mb-6 text-slate-300">Share your secure link and QR code below.</p>
              
              <div className="bg-white p-4 rounded-xl mb-6">
                <QRCodeCanvas value={shareUrl} size={180} bgColor="#ffffff" fgColor="#0f172a" />
              </div>

              <input readOnly value={shareUrl} className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-center mb-4" />
              
              <div className="flex w-full space-x-2">
                  <button 
                    onClick={copyToClipboard} 
                    className="flex-grow bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold p-3 rounded-lg transition-colors"
                  >
                    Copy
                  </button>
                  {canShare && (
                      <button 
                          onClick={handleShare}
                          className="p-3 bg-sky-500 hover:bg-sky-400 text-slate-900 font-bold rounded-lg transition-colors"
                          aria-label="Share"
                      >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.368a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" /></svg>
                      </button>
                  )}
              </div>

              <button
                  onClick={() => { setStatus('idle'); setFile(null); setPin(''); setShareUrl(''); setExpiry('0'); }}
                  className="mt-4 text-sky-400 hover:text-sky-300"
              >
                  Upload another file
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}