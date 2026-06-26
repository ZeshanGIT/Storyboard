import Welcome from './content/welcome.mdx'

function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto max-w-2xl space-y-4 px-6 py-16 [&_h1]:text-4xl [&_h1]:font-bold [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-semibold [&_p]:leading-7 [&_ul]:list-disc [&_ul]:pl-6">
        <Welcome />
      </main>
    </div>
  )
}

export default App
