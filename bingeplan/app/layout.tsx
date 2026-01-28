import './globals.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from '@/context/AuthContext';
import { ToastContainer } from 'react-toastify';

export const metadata = {
  title: 'BingePlan',
  description: 'Plan your watch schedule',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    /* Force light mode here */
    <html lang="en" className="light">
      <body className="bg-gray-50 text-gray-900 min-h-screen">
        <AuthProvider>
          {children}
          <ToastContainer position="bottom-right" theme="colored" />
        </AuthProvider>
      </body>
    </html>
  );
}