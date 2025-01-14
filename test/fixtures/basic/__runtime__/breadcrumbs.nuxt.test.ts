import { useBreadcrumbItems } from '#imports'
// @vitest-environment nuxt
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { afterEach, describe, expect, it, vi } from 'vitest'

const { useRouterMock, useI18nMock } = vi.hoisted(() => {
  return {
    useI18nMock: vi.fn().mockImplementation(() => {
      return {
        t: vi.fn().mockImplementation((s: string, fallback: string) => {
          if (s === 'breadcrumb.items.about.label') {
            return 'About I18n'
          }
          return fallback
        }),
      }
    }),
    useRouterMock: vi.fn().mockImplementation(() => {
      return {
        resolve: vi.fn().mockImplementation((s: string) => {
          if (s === '/') {
            return { matched: [{ name: 'index', title: 'Home' }] }
          }
          return { matched: [{ name: 'unknown' }] }
        }),
        currentRoute: {
          value: {
            path: '/',
          },
        },
      }
    }),
  }
})

mockNuxtImport('useRouter', () => {
  return useRouterMock
})
mockNuxtImport('useI18n', () => {
  return useI18nMock
})

afterEach(() => {
  vi.resetAllMocks()
})

describe('useBreadcrumbItems', () => {
  it('home', async () => {
    const breadcrumbs = useBreadcrumbItems()
    expect(breadcrumbs.value).toMatchInlineSnapshot(`
    [
      {
        "ariaLabel": "Home",
        "current": true,
        "label": "Home",
        "to": "/",
      },
    ]
  `)
  })
  it('subpath', async () => {
    useI18nMock.mockImplementation(() => {
      return {
        t: vi.fn().mockImplementation((s: string, fallback: string) => {
          return fallback
        }),
      }
    })
    // change the path
    useRouterMock.mockImplementation(() => {
      return {
        currentRoute: {
          value: {
            path: '/subpath',
          },
        },
        resolve(s: string) {
          if (s === '/subpath') {
            return { matched: [{ name: 'subpath', title: 'My subpath' }] }
          }
          return { matched: [{ name: 'index' }] }
        },
      }
    })
    const breadcrumbs = useBreadcrumbItems()
    expect(breadcrumbs.value).toMatchInlineSnapshot(`
      [
        {
          "ariaLabel": "Home",
          "current": false,
          "label": "Home",
          "to": "/",
        },
        {
          "ariaLabel": "Subpath",
          "current": true,
          "label": "Subpath",
          "to": "/subpath",
        },
      ]
    `)
  })
  it('i18n', async () => {
    useI18nMock.mockImplementation(() => {
      return {
        t: vi.fn().mockImplementation((s: string, fallback: string) => {
          if (s === 'breadcrumb.items.about.label') {
            return 'About I18n'
          }
          return fallback
        }),
      }
    })
    useRouterMock.mockImplementation(() => {
      return {
        currentRoute: {
          value: {
            name: 'about___en',
            path: '/about',
          },
        },
        resolve(s: string) {
          if (s !== '/') {
            return {
              matched: [
                {
                  name: 'about___en',
                  path: '/about',
                },
              ],
            }
          }
          return { matched: [{ name: 'index' }] }
        },
      }
    })
    const breadcrumbs = useBreadcrumbItems()
    expect(breadcrumbs.value).toMatchInlineSnapshot(`
      [
        {
          "ariaLabel": "Home",
          "current": false,
          "label": "Home",
          "to": "/",
        },
        {
          "ariaLabel": "About I18n",
          "current": true,
          "label": "About I18n",
          "to": "/about",
        },
      ]
    `)
  })
  it('catch-all', async () => {
    useI18nMock.mockImplementation(() => {
      return {
        t: vi.fn().mockImplementation((s: string, fallback: string) => {
          return fallback
        }),
      }
    })
    // change the path
    useRouterMock.mockImplementation(() => {
      return {
        currentRoute: {
          value: {
            path: '/docs/seo-utils/getting-started/installation',
          },
        },
        resolve(s: string) {
          if (s !== '/') {
            return {
              matched: [
                {
                  name: 'docs-slug',
                  path: '/docs/:slug(.*)*',
                },
              ],
            }
          }
          return { matched: [{ name: 'index' }] }
        },
      }
    })
    const breadcrumbs = useBreadcrumbItems()
    expect(breadcrumbs.value).toMatchInlineSnapshot(`
      [
        {
          "ariaLabel": "Home",
          "current": false,
          "label": "Home",
          "to": "/",
        },
        {
          "ariaLabel": "Docs",
          "current": false,
          "label": "Docs",
          "to": "/docs",
        },
        {
          "ariaLabel": "Seo Utils",
          "current": false,
          "label": "Seo Utils",
          "to": "/docs/seo-utils",
        },
        {
          "ariaLabel": "Getting Started",
          "current": false,
          "label": "Getting Started",
          "to": "/docs/seo-utils/getting-started",
        },
        {
          "ariaLabel": "Installation",
          "current": true,
          "label": "Installation",
          "to": "/docs/seo-utils/getting-started/installation",
        },
      ]
    `)
  })

  it('catch-all #2', async () => {
    useI18nMock.mockImplementation(() => {
      return {
        t: vi.fn().mockImplementation((s: string, fallback: string) => {
          return fallback
        }),
      }
    })
    // change the path
    useRouterMock.mockImplementation(() => {
      return {
        currentRoute: {
          value: {
            name: 'docs-slug',
            path: '/docs/seo-utils/getting-started/installation',
          },
        },
        resolve() {
          return null
        },
      }
    })
    const breadcrumbs = useBreadcrumbItems()
    expect(breadcrumbs.value).toMatchInlineSnapshot(`
      [
        {
          "ariaLabel": "",
          "current": false,
          "label": "",
          "to": "/",
        },
        {
          "ariaLabel": "Docs",
          "current": false,
          "label": "Docs",
          "to": "/docs",
        },
        {
          "ariaLabel": "Seo Utils",
          "current": false,
          "label": "Seo Utils",
          "to": "/docs/seo-utils",
        },
        {
          "ariaLabel": "Getting Started",
          "current": false,
          "label": "Getting Started",
          "to": "/docs/seo-utils/getting-started",
        },
        {
          "ariaLabel": "Installation",
          "current": true,
          "label": "Installation",
          "to": "/docs/seo-utils/getting-started/installation",
        },
      ]
    `)
  })
})
