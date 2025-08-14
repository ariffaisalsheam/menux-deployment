import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { QrCode, Smartphone, Brain, BarChart3, Clock, Shield } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export default function LandingPage() {
  const { isAuthenticated, user } = useAuth()

  const handleAuthAction = () => {
    if (isAuthenticated) {
      if (user?.role === 'RESTAURANT_OWNER') {
        return '/dashboard'
      } else if (user?.role === 'SUPER_ADMIN') {
        return '/admin'
      }
      return '/'
    }
    return '/register'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-background dark:to-background">
      <Navbar />

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-foreground mb-6">
            Smart Digital Communication
            <span className="text-blue-600 dark:text-primary block">for Restaurants in Bangladesh</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-muted-foreground mb-8 max-w-3xl mx-auto">
            Transform your restaurant with QR-based menu viewing, digital ordering, 
            and AI-powered feedback analysis. Modernize the dining experience today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={isAuthenticated ? handleAuthAction() : "/register"}>
              <Button size="lg" className="text-lg px-8 py-3">
                {isAuthenticated ? 'Go to Dashboard' : 'Start Free Trial'}
              </Button>
            </Link>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="lg" className="text-lg px-8 py-3">
                  Watch Demo
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-3xl p-0 overflow-hidden">
                <DialogHeader>
                  <DialogTitle className="sr-only">Product Demo</DialogTitle>
                </DialogHeader>
                <div className="aspect-video bg-black">
                  {/* Replace the src with your actual demo video URL */}
                  <iframe
                    className="w-full h-full"
                    src="https://www.youtube.com/embed/VIDEO_ID?rel=0"
                    title="Menu.X Demo"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white dark:bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Modernize Your Restaurant
            </h2>
            <p className="text-xl text-gray-600 dark:text-muted-foreground">
              Powerful features designed specifically for the Bangladesh restaurant industry
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <QrCode className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle>QR Code Menus</CardTitle>
                <CardDescription>
                  Contactless menu viewing with instant QR code scanning
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Smartphone className="h-12 w-12 text-green-600 mb-4" />
                <CardTitle>Digital Ordering</CardTitle>
                <CardDescription>
                  Seamless order placement directly from customer devices
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Brain className="h-12 w-12 text-purple-600 mb-4" />
                <CardTitle>AI-Powered Insights</CardTitle>
                <CardDescription>
                  Smart menu descriptions and feedback analysis with AI
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="h-12 w-12 text-orange-600 mb-4" />
                <CardTitle>Analytics Dashboard</CardTitle>
                <CardDescription>
                  Real-time insights into orders, feedback, and performance
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Clock className="h-12 w-12 text-red-600 mb-4" />
                <CardTitle>Live Order Tracking</CardTitle>
                <CardDescription>
                  Real-time order management and kitchen coordination
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-12 w-12 text-indigo-600 mb-4" />
                <CardTitle>Secure & Reliable</CardTitle>
                <CardDescription>
                  Enterprise-grade security with 99.9% uptime guarantee
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50 dark:bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 dark:text-muted-foreground">
              Choose the plan that fits your restaurant's needs
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Basic Plan */}
            <Card className="relative">
              <CardHeader>
                <CardTitle className="text-2xl">Basic</CardTitle>
                <CardDescription>Perfect for small restaurants</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-green-600">Free</span>
                  <span className="text-gray-600"> forever</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <span className="text-green-600 mr-2">✓</span>
                    QR Code Menu Viewing
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-600 mr-2">✓</span>
                    Basic Menu Management
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-600 mr-2">✓</span>
                    Customer Feedback Collection
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-600 mr-2">✓</span>
                    Basic Analytics
                  </li>
                </ul>
                <Button className="w-full mt-6">Get Started</Button>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="relative border-blue-500 border-2">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
              <CardHeader>
                <CardTitle className="text-2xl">Pro</CardTitle>
                <CardDescription>Advanced features with AI power</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">৳1,500</span>
                  <span className="text-gray-600">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <span className="text-green-600 mr-2">✓</span>
                    Everything in Basic
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-600 mr-2">✓</span>
                    Digital Ordering System
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-600 mr-2">✓</span>
                    AI Menu Description Writer
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-600 mr-2">✓</span>
                    AI Feedback Analyzer
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-600 mr-2">✓</span>
                    Live Order Tracking
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-600 mr-2">✓</span>
                    Advanced Analytics
                  </li>
                </ul>
                <Button className="w-full mt-6">Start Pro Trial</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Restaurant?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join hundreds of restaurants across Bangladesh that have already modernized their operations with Menu.X
          </p>
          <Link to="/register">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
              Start Your Free Trial Today
            </Button>
          </Link>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-white dark:bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Get in touch</h2>
            <p className="text-gray-600 dark:text-muted-foreground mt-2">Questions, demos, or support — we’re here to help.</p>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>Reach out directly — we typically respond within 24 hours.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p><span className="font-medium">Email:</span> <a className="text-blue-600 hover:underline" href="mailto:support@menux.app">support@menux.app</a></p>
                <p><span className="font-medium">Phone:</span> +880 1234-567890</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Send a message</CardTitle>
                <CardDescription>We’ll email you back as soon as possible.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input placeholder="Your name" required />
                    <Input placeholder="Your email" type="email" required />
                  </div>
                  <Input placeholder="Subject" required />
                  <Textarea placeholder="How can we help?" rows={4} required />
                  <div className="flex items-center justify-between">
                    <a className="text-sm text-blue-600 hover:underline" href="mailto:support@menux.app">Or email us directly</a>
                    <Button type="submit">Send</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
