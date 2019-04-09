import { initRPCWebviewSide } from './rpc-webview';
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

import App from './App';

initRPCWebviewSide();

ReactDOM.render(<App />, document.getElementById('root'));