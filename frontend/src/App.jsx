import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import DashboardPage    from './pages/DashboardPage'
import TicketsPage      from './pages/TicketsPage'
import TicketDetailPage from './pages/TicketDetailPage'
import LogsPage         from './pages/LogsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index              element={<DashboardPage />}    />
          <Route path="tickets"     element={<TicketsPage />}      />
          <Route path="tickets/:id" element={<TicketDetailPage />} />
          <Route path="logs"        element={<LogsPage />}         />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
