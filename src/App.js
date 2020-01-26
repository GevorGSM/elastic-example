import React, { Suspense } from 'react';
import { Router, View } from 'react-navi'

import { routes } from './routes';

import "@elastic/react-search-ui-views/lib/styles/styles.css";
import './styles/main.css'

function App() {
  return (
    <Router routes={routes}>
      <Suspense fallback={null}>
        <View />
      </Suspense>
    </Router>
  );
}

export default App;
