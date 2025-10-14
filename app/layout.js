import './globals.css';

export const metadata = {
  title: 'Sagan Candidate Database',
  description: 'Manage your candidate database with advanced filtering and CRUD operations',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}