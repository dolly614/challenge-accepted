import { Link } from "@tanstack/react-router";
import { Mail, Phone, Trophy } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 font-bold">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-hero text-primary-foreground"><Trophy className="h-5 w-5"/></div>
            <span>30 Days Learning Challenge</span>
          </div>
          <p className="mt-3 max-w-md text-sm text-muted-foreground">
            India's most exciting daily learning competition for Class 1–12 students. Seekho, Compete Karo, Jeeto!
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Quick Links</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/" className="hover:text-foreground">Home</Link></li>
            <li><Link to="/register" className="hover:text-foreground">Register</Link></li>
            <li><Link to="/leaderboard" className="hover:text-foreground">Leaderboard</Link></li>
            <li><Link to="/dashboard" className="hover:text-foreground">Dashboard</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Contact</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><Mail className="h-4 w-4"/> support@30dayschallenge.in</li>
            <li className="flex items-center gap-2"><Phone className="h-4 w-4"/> +91 90000 12345</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} 30 Days Learning Challenge. Made in India 🇮🇳
      </div>
    </footer>
  );
}
