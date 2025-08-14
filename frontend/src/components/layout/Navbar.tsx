import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { QrCode } from "lucide-react"
import { ThemeToggle } from "@/components/theme/ThemeToggle"
import { useAuth } from "@/contexts/AuthContext"
import { useState } from "react"

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuth()
  const [open, setOpen] = useState(false)

  const dashboardHref = user?.role === "RESTAURANT_OWNER" ? "/dashboard" : user?.role === "SUPER_ADMIN" ? "/admin" : "/"

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to={"/"} className="flex items-center gap-2">
          <QrCode className="h-6 w-6 text-primary" />
          <span className="font-bold">Menu.X</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
          <a href="#features" className="text-sm text-muted-foreground hover:text-foreground">Features</a>
          <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground">Pricing</a>
          <a href="#contact" className="text-sm text-muted-foreground hover:text-foreground">Contact</a>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {isAuthenticated ? (
            <>
              <Link to={dashboardHref}><Button variant="outline" size="sm">Dashboard</Button></Link>
              <Button size="sm" onClick={logout}>Sign Out</Button>
            </>
          ) : (
            <>
              <Link to="/login"><Button variant="outline" size="sm">Sign In</Button></Link>
              <Link to="/register"><Button size="sm">Get Started</Button></Link>
            </>
          )}
          <button
            className="md:hidden ml-2"
            aria-label="Toggle Menu"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen(v => !v)}
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
        </div>
      </div>
      {open && (
        <div id="mobile-nav" className="border-t md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4">
            <a href="#features" onClick={() => setOpen(false)} className="text-sm">Features</a>
            <a href="#pricing" onClick={() => setOpen(false)} className="text-sm">Pricing</a>
            <a href="#contact" onClick={() => setOpen(false)} className="text-sm">Contact</a>
          </div>
        </div>
      )}
    </header>
  )
}



