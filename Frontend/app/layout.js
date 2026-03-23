import "./globals.css";
import { ToastProvider } from '../components/ui/Toast';
import Header from './components/Header';
import Footer from './components/Footer';
import Sidebar from './components/SidebarNew';

export const metadata = {
  title: "AI Knowledge OS",
  description: "Frontend starter for AI Knowledge OS",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" href="/icon.jpg" />
      </head>
      <body suppressHydrationWarning>
        <ToastProvider>
          <Header />
          <div className="app-shell">
            <Sidebar />
            <main className="main-content">{children}</main>
          </div>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
