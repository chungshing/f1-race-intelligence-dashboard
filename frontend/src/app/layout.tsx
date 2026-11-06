import RegisterServiceWorker from '@/components/pwa/RegisterServiceWorker';
import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

export const metadata: Metadata = {
    title: 'F1 Dashboard',
    description: 'A dashboard for Formula 1 data built with Next.js and React.',
    applicationName: 'F1 Pitwall',
    appleWebApp: {
        capable: true,
        title: 'Pitwall',
        statusBarStyle: 'black-translucent',
    },
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
    themeColor: '#09090b',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang='en'
            className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        >
            <body className='min-h-full flex flex-col'>
                <Providers>{children}</Providers>
                <RegisterServiceWorker />
            </body>
        </html>
    );
}
