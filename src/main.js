import { createApp } from 'vue'
import './style.css'
// import App from './App.vue'
import LineChart from './components/LineChart.vue'
import Barcode from './components/Barcode.vue'
import Toolbar from './components/Toolbar.vue'

// createApp(App).mount('#app')
createApp(LineChart).mount('#linechart');
createApp(Barcode).mount('#barcode');
createApp(Toolbar).mount('#toolbar');