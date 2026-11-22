import { createApp, defineAsyncComponent } from 'vue'
import App from './App.vue'
import './style.css'

// PROTOTYPE: ?proto opens the throwaway guided-step prototypes instead of the app
const proto = new URLSearchParams(location.search).has('proto')
createApp(proto ? defineAsyncComponent(() => import('./proto/ProtoApp.vue')) : App).mount('#app')
