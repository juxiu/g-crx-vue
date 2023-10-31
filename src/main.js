import { createApp } from 'vue'
import App from './App.vue'

// const customId = `chromeCrxApp${new Date().valueOf()}`
// const customElement = document.createElement('div')
// customElement.id = customId
// document.body.prepend(customElement)
createApp(App).mount(`#chromeCrxAppMountDom`)
