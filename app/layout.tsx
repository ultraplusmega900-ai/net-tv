import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Netflix Brasil - Assista a séries de TV e filmes online',
  description: 'Replica da Netflix com filmes completos dublados e trailers direto do canal NetMovies via YouTube.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR">
      <body suppressHydrationWarning className="bg-black text-white antialiased selection:bg-red-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
