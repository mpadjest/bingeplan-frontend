'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-toastify';

export default function GoogleCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const { refreshUser } = useAuth();

  useEffect(() => {
    if (code) {
      api.post('/auth/google/callback', null, { params: { code } })
        .then(() => {
          toast.success('Google Calendar connected!');
          refreshUser();
          router.push('/profile');
        })
        .catch((err) => {
          console.error(err);
          toast.error('Failed to connect Google Calendar');
          router.push('/profile');
        });
    }
  }, [code, router]);

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="animate-pulse text-xl font-bold text-blue-600">
        Connecting to Google...
      </div>
    </div>
  );
}