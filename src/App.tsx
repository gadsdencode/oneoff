import Sidebar from './components/Sidebar'
import ChatView from './components/ChatView'

function App() {
  return (
    <main className="flex h-screen w-full bg-background text-foreground">
      <Sidebar />
      <ChatView />
    </main>
  )
}

export default App
