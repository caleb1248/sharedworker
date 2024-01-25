// @ts-check

import './style.css';
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js');
}
