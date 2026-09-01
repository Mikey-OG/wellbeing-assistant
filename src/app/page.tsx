import Link from 'next/link'

// This is the Landing page 
export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-6">
      <div className="text-center max-w-2xl w-full">

        {/* The title */}
        <h1 className="text-6xl font-bold text-gray-900 mb-6">
          Wellbeing Assistant
        </h1>
        <p className="text-xl text-gray-600 mb-10 leading-relaxed">
          Your personal AI companion for sleep, stress, mood, and motivation.
          Get a personalised plan and track your progress every day.
        </p>

        {/* Signup and login buttons */}
        <div className="flex gap-4 justify-center mb-20">
          <Link
            href="/auth/signup"
            className="bg-blue-600 text-white px-10 py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors"
          >
            Get Started
          </Link>
          <Link
            href="/auth/login"
            className="bg-white text-blue-600 px-10 py-4 rounded-xl font-semibold text-lg border-2 border-blue-200 hover:bg-blue-50 transition-colors"
          >
            Sign In
          </Link>
        </div>


      </div>
    </main>
  )
}
