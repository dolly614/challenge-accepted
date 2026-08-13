import { Link } from "@tanstack/react-router";
import { Instagram, Mail, Phone } from "lucide-react";
import { BrandMark } from "./BrandMark";
import { useAuth } from "@/hooks/use-auth";

export function Footer() {
  const { user } = useAuth();
  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 font-bold">
            <BrandMark size={36} />
            <span>Uyanix 30 Days Challenge</span>
          </div>
          <p className="mt-3 max-w-md text-sm text-muted-foreground">
            India's most exciting daily learning competition for Class 1–12 students. Seekho, Compete Karo, Jeeto!
          </p>
          <div className="mt-4 flex items-center gap-3">
            <a
              href="https://www.instagram.com/dollysingh12682026/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition hover:bg-primary hover:text-primary-foreground"
            >
              <Instagram className="h-4 w-4" />
            </a>
          </div>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Quick Links</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/" className="hover:text-foreground">Home</Link></li>
            {!user && <li><Link to="/register" className="hover:text-foreground">Register</Link></li>}
            <li><Link to="/leaderboard" className="hover:text-foreground">Leaderboard</Link></li>
            {user && <li><Link to="/dashboard" className="hover:text-foreground">Dashboard</Link></li>}
            {user && <li><Link to="/teacher" className="hover:text-foreground">Teacher Portal</Link></li>}
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Contact</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><Mail className="h-4 w-4"/> dollysingh1268@gmail.com</li>
            <li className="flex items-center gap-2"><Phone className="h-4 w-4"/> +91 90000 12345</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Uyanix 30 Days Challenge. Made in India 🇮🇳
      </div>
    </footer>
  );
}
