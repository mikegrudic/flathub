import * as React from 'react';
import { Link } from 'react-router-dom';
import logo from './assets/logo.svg';
import Main from './Main';
import Header from './components/Header/Header';

function App() {
  return (
    <div className="App">
      <Header />
      <img src={logo} alt="logo" />
      <ul>
        <li>
          <Link to="/">Home</Link>
        </li>
        <li>
          <Link to="/catalogs">Catalogs</Link>
        </li>
        <li>
          <Link to="/collections">Collections</Link>
        </li>
        <li>
          <Link to="/about">About</Link>
        </li>
      </ul>
      <hr />
      <Main />
    </div>
  );
}

export default App;
