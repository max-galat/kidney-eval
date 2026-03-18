'use client';

import { useRef, useState } from 'react';

export default function KidneyPhotoUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hasFile, setHasFile] = useState(false);

  const handleChange = () => {
    setHasFile(true);
  };

  return (
    <div className="space-y-1">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Kidney Photo</span>
      <div
        onClick={() => inputRef.current?.click()}
        className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 transition-colors min-h-[80px] flex flex-col items-center justify-center gap-1"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleChange}
        />
        <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
        </svg>
        <p className="text-xs text-gray-400">
          {hasFile ? 'Photo uploaded — analysis not yet available' : 'Drop photo or click to upload'}
        </p>
        <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 font-medium">
          Coming Soon
        </span>
      </div>
    </div>
  );
}
