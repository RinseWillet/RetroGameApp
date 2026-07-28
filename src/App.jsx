import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ROUTES } from './routes'

const App = () => {

  return (
      <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        {ROUTES.map(({ path, element }) => (
          <Route key={path} path={path} element={element} />
        ))}
      </Routes>
    </BrowserRouter>
  )
}

export default App
