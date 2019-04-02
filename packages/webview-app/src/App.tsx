import React, { Component } from 'react';
import LoadingBar from './components/LoadingBar/LoadingBar';
import './App.css';

class App extends Component {
  componentDidMount() {}

  componentWillUnmount() {}

  render() {
    return (
      <>
        <LoadingBar />
        <div id="root">
        </div>
      </>
    );
  }
}

export default App;
