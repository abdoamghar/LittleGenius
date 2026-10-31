import "../src/index.css";
import Providers from "./providers";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "LittleGenius",
  description: "A playful learning space for students and teachers.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
