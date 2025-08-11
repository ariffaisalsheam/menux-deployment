import { QrCode } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-card text-card-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold">Menu.X</span>
            </div>
            <p className="text-sm text-muted-foreground">Modernizing restaurants across Bangladesh with smart digital solutions.</p>
          </div>
          <div>
            <h3 className="mb-4 font-semibold">Product</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#features" className="hover:text-foreground">Features</a></li>
              <li><a href="#pricing" className="hover:text-foreground">Pricing</a></li>
              <li><a href="#demo" className="hover:text-foreground">Demo</a></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 font-semibold">Support</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground">Help Center</a></li>
              <li><a href="#contact" className="hover:text-foreground">Contact Us</a></li>
              <li><a href="#docs" className="hover:text-foreground">Documentation</a></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 font-semibold">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground">About</a></li>
              <li><a href="#" className="hover:text-foreground">Blog</a></li>
              <li><a href="#" className="hover:text-foreground">Careers</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t pt-6 text-center text-sm text-muted-foreground">
          <p>© 2025 Menu.X. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}


