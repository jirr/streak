import { useEffect } from 'react'
import { createHashRouter, Navigate, Outlet, useLocation } from 'react-router'
import { BottomNav } from '../ui/components/BottomNav.tsx'
import { Account } from '../ui/screens/Account.tsx'
import { HallOfFame } from '../ui/screens/HallOfFame.tsx'
import { Home } from '../ui/screens/Home.tsx'
import { Onboarding } from '../ui/screens/Onboarding.tsx'
import { SeriesForm } from '../ui/screens/SeriesForm.tsx'
import { useAppStore } from './store.ts'

function RootLayout() {
  const status = useAppStore((s) => s.status)
  const init = useAppStore((s) => s.init)
  const { pathname } = useLocation()

  useEffect(() => {
    void init()
  }, [init])

  if (status === 'loading') return <div style={{ minHeight: '100dvh', background: 'var(--bg)' }} />
  if (status === 'onboarding' && pathname !== '/onboarding') return <Navigate to="/onboarding" replace />
  if (status === 'ready' && pathname === '/onboarding') return <Navigate to="/" replace />
  return <Outlet />
}

function TabsLayout() {
  return (
    <>
      <Outlet />
      <BottomNav />
    </>
  )
}

export const router = createHashRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/onboarding', element: <Onboarding /> },
      {
        element: <TabsLayout />,
        children: [
          { path: '/', element: <Home /> },
          { path: '/hall-of-fame', element: <HallOfFame /> },
          { path: '/account', element: <Account /> },
        ],
      },
      { path: '/series/new', element: <SeriesForm /> },
      { path: '/series/:id/edit', element: <SeriesForm /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
