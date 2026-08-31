import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "PneumaScan | Chest X-ray screening",
  description: "Upload a chest X-ray for a pneumonia model screening result.",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className="bg-[#f4f8fa]"><body>{children}</body></html>
}
