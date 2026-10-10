// client/src/App.jsx
import { Suspense } from 'react';
import AppRoutes from './routes/AppRoutes.jsx';
import Loader from './components/common/Loader.jsx';

function App() {
  return (
    <Suspense fallback={<Loader fullScreen />}>
      <AppRoutes />
    </Suspense>
  );
}

export default App;