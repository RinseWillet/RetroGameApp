import Home from './pages/Home'
import Pong from './games/Pong'
import Asteroids from './games/Asteroids'
import NotFound from './pages/NotFound'

export const ROUTES = [
  { path: '/', element: <Home /> },
  { path: '/pong', element: <Pong /> },
  { path: '/asteroids', element: <Asteroids /> },
  { path: '*', element: <NotFound /> },
]
