import "./globals.css";
import ClientLayout from "@/client-layout";
import { ViewTransitions } from "next-view-transitions";

export const metadata = {
  title: "Polite Chaos | Codegrid",
  description: "MWT by Codegrid",
  icons: {
    icon: "/polite-chaos/site-logo.png",
    shortcut: "/polite-chaos/site-logo.png",
    apple: "/polite-chaos/site-logo.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ViewTransitions>
          <ClientLayout>{children}</ClientLayout>
        </ViewTransitions>
      </body>
    </html>
  );
}
