"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <header
      className="
                 w-full max-w-4xl mx-auto
                 bg-white/80 dark:bg-gray-900/80 text-black dark:text-white
                 shadow-md shadow-amber-300 outline outline-amber-400
                 rounded-2xl px-4 sm:px-6 py-3 mt-4
                 flex flex-wrap items-center justify-between
                 gap-4 sm:gap-6
                 backdrop-blur-md ring-1 ring-gray-300 dark:ring-gray-700
                 transition-all duration-300"
    >
      {/* Logo */}
      <h1 className="text-lg sm:text-xl font-bold whitespace-nowrap">
        <Link href="/">SAAS</Link>
      </h1>

      {/* Links */}
      <nav className="flex flex-wrap gap-3 text-sm sm:text-base font-medium justify-center">
        <Link href="/" className="hover:underline whitespace-nowrap">Home</Link>
        <Link href="/analytics" className="hover:underline whitespace-nowrap">Analytics</Link>
        <Link href="/about" className="hover:underline whitespace-nowrap">About</Link>
        <Link href="/contact" className="hover:underline whitespace-nowrap">Contact</Link>
        <Link href="/pricing" className="hover:underline whitespace-nowrap">Pricing</Link>
      </nav>
    </header>
  );
}
