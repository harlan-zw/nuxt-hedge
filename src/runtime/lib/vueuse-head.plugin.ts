import { createHead, renderHeadToString } from '@vueuse/head'
import type { HeadEntryOptions } from '@vueuse/head'
import { packMeta } from 'zhead'
import type { MetaObject } from '@nuxt/schema'
import { getCurrentInstance, onBeforeUnmount } from 'vue'
import { defineNuxtPlugin, useRouter } from '#app'
// @ts-expect-error untyped
import options from '#build/nuxt-hedge-config.mjs'
// @ts-expect-error untyped
import { appHead } from '#build/nuxt.config.mjs'

// Note: This should always be a partial match to nuxt's internal vueuse-head plugin

export default defineNuxtPlugin((nuxtApp) => {
  const { resolveAliases, seoOptimise } = options

  const head = createHead()

  // this is a pollyfill for not having the schema resolving
  appHead.meta = appHead.meta || []
  if (appHead.viewport)
    appHead.meta.push({ name: 'viewport', content: appHead.viewport })

  if (appHead.charset)
    appHead.meta.push({ charset: appHead.charset })

  head.addEntry(appHead, { resolved: true })

  nuxtApp.vueApp.use(head)

  head.hooks['resolved:tags'].push(async (tags) => {
    await nuxtApp.hooks.callHook('head:tags', tags)
  })

  head.hooks['resolved:entries'].push(async (entries) => {
    await nuxtApp.hooks.callHook('head:entries', entries)
  })

  // @todo get this to work in v1
  if (resolveAliases) {
    head.hooks['resolved:tags'].push(async (tags) => {
      // resolve runtime build aliases
      const props = ['href', 'src']
      for (const i in tags) {
        for (const prop of props) {
          if (tags[i]?.props?.[prop] && /^[~@]+\//.test(tags[i].props[prop])) {
            // Note: This could work but we need this hook to be async or to be able to resolve promises as values
            if (process.server) {
              tags[i].props[prop] = (await import(/* @vite-ignore */ `${tags[i].props[prop]}?url`)).default
            }
            else {
              // Note: client side does not work
              // @todo need to figure out a way to opt-out of the hydration of a tag
            }
          }
        }
      }
    })
  }

  if (seoOptimise) {
    head.hooks['resolved:tags'].push((tags) => {
      console.log(tags)
      const metaProps = []
      let title = ''
      for (const i in tags) {
        if (tags[i].tag === 'meta')
          metaProps.push(tags[i].props)
        if (tags[i].tag === 'title')
          title = tags[i].children
      }
      const meta = packMeta(metaProps)
      // ensure twitter card is set
      if (meta.ogImage && !meta.twitterCard) {
        tags.push({
          tag: 'meta',
          props: {
            name: 'twitter:card',
            content: 'summary_large_image',
          },
        })
      }

      // ensure og:title
      if (title && !meta.ogTitle) {
        tags.push({
          tag: 'meta',
          props: {
            name: 'og:title',
            content: title,
          },
        })
      }

      // ensure og:description
      if (meta.description && !meta.ogDescription) {
        tags.push({
          tag: 'meta',
          props: {
            name: 'og:description',
            content: meta.description,
          },
        })
      }
    })
  }

  let pauseDOMUpdates = true
  head.hooks['before:dom'].push(() => !pauseDOMUpdates)
  nuxtApp.hooks.hookOnce('app:mounted', () => {
    pauseDOMUpdates = false
    head.updateDOM()

    // start pausing DOM updates when route changes (trigger immediately)
    useRouter().beforeEach(() => {
      pauseDOMUpdates = true
    })
    // watch for new route before unpausing dom updates (triggered after suspense resolved)
    useRouter().afterEach(() => {
      pauseDOMUpdates = false
      head.updateDOM()
    })
  })

  nuxtApp._useHead = (_meta: MetaObject, options: HeadEntryOptions) => {
    const removeSideEffectFns = []

    if (process.server) {
      head.addEntry(_meta, options)
      return
    }

    const cleanUp = head.addReactiveEntry(_meta, options)

    const vm = getCurrentInstance()
    if (!vm)
      return

    onBeforeUnmount(() => {
      cleanUp()
      removeSideEffectFns.forEach(fn => fn())
      head.updateDOM()
    })
  }

  if (process.server) {
    nuxtApp.ssrContext!.renderMeta = async () => {
      const meta = await renderHeadToString(head)
      return {
        ...meta,
        // resolves naming difference with NuxtMeta and @vueuse/head
        bodyScripts: meta.bodyTags,
      }
    }
  }
})
