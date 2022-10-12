import { getCurrentInstance } from 'vue'
import { defineNuxtPlugin, useNuxtApp } from '#app'
import * as Components from './components'
import { useHead } from './composables'

type MetaComponents = typeof Components
declare module '@vue/runtime-core' {
  export interface GlobalComponents extends MetaComponents {}
}

const metaMixin = {
  created() {
    const instance = getCurrentInstance()
    if (!instance)
      return

    const options = instance.type
    if (!options || !('head' in options))
      return

    const nuxtApp = useNuxtApp()
    const source = typeof options.head === 'function'
      ? () => options.head(nuxtApp)
      : options.head

    useHead(source)
  },
}

export default defineNuxtPlugin((nuxtApp) => {

  nuxtApp.vueApp.mixin(metaMixin)

  for (const name in Components)

    nuxtApp.vueApp.component(name, (Components as any)[name])
})
