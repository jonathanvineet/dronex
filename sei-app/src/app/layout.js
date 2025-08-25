import { Inter, Orbitron, Russo_One } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/contexts/CartContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  display: "swap",
});

const russo = Russo_One({
  variable: "--font-russo",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata = {
  title: "DroneX — Gamified Web3 Drone Delivery",
  description: "Futuristic dark drone delivery dashboard with escrow status and HUD overlays",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${orbitron.variable} ${russo.variable} antialiased bg-background text-foreground`}>
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
