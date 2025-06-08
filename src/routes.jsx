import Home from './pages/Home'
import Pong from './games/pong/Pong'
import Asteroids from './games/asteroids/Asteroids'
import NotFound from './pages/NotFound'

export const ROUTES = [
  { path: '/', element: <Home /> },
  { path: '/pong', element: <Pong /> },
  { path: '/asteroids', element: <Asteroids /> },
  { path: '*', element: <NotFound /> },
]
