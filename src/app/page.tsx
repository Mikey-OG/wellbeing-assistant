import Link from 'next/link'

// Landing page 
export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-6">
      <div className="text-center max-w-2xl w-full">

        {/* App title and tagline */}
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

        {/* Wellbeing categories the app supports */}
        <div className="grid grid-cols-3 gap-4">
          {['Sleep', 'Stress', 'Mood', 'Physical Wellbeing', 'Motivation', 'Others'].map((category) => (
            <div key={category} className="bg-white p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <p className="font-semibold text-gray-700 text-lg">{category}</p>
            </div>
          ))}
        </div>

      </div>
    </main>
  )
}
// export default function Home() {
//   return (
//     <main className="min-h-screen bg-gray-50 flex items-center justify-center">
//       <div className="text-center">
//         <h1 className="text-4xl font-bold text-gray-900 mb-4">
//           Wellbeing Assistant
//         </h1>
//         <p className="text-gray-600 text-lg">
//           Your personal AI wellbeing companion
//         </p>
//       </div>
//     </main>
//   )
// }