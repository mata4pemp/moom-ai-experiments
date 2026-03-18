import "./globals.css";

export const metadata = {
  title: "Moom Health - Shopify Assistant",
  description: "Chat with your Shopify store data",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
