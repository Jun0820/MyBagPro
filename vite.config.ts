import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

type BrandKey = 'golfid' | 'mybagpro'

const brandMeta: Record<
  BrandKey,
  {
    name: string
    url: string
    title: string
    description: string
    keywords: string
    twitterDescription: string
    structuredDescription: string
  }
> = {
  golfid: {
    name: 'Golf ID',
    url: 'https://golfid.jp',
    title: '上手くなる人は、自分のゴルフを知っている。 | Golf ID',
    description:
      'クラブ、スコア、悩み、目標をまとめると、AIがあなたの“次の一手”を提案。作ったGolf IDはSNSプロフィールに貼って、仲間やフォロワーと共有できます。',
    keywords: 'Golf ID, ゴルフ ID, ゴルフ, クラブセッティング, WITB, プロ ゴルフクラブ, ゴルフクラブ 診断',
    twitterDescription: 'クラブ、スコア、悩み、目標をまとめると、AIがあなたの“次の一手”を提案。',
    structuredDescription: 'クラブ、スコア、悩み、目標をまとめ、AI診断とSNS共有につなげられるゴルフプロフィールサービス',
  },
  mybagpro: {
    name: 'MyBagPro',
    url: 'https://www.mybagpro.jp',
    title: 'MyBagPro | プロとみんなのクラブセッティングが見つかる',
    description:
      'プロ・インフルエンサー・ゴルファーのクラブセッティングをチェック。気になるクラブ選びから、Golf IDでのAI上達診断までつなげられます。',
    keywords: 'MyBagPro, クラブセッティング, プロ 使用クラブ, ゴルフ WITB, 女子プロ クラブセッティング, ゴルフクラブ 診断',
    twitterDescription: 'プロやみんなのクラブセッティングを確認し、自分のクラブ選びに活かせます。',
    structuredDescription: 'プロ・インフルエンサー・ゴルファーのクラブセッティングを確認し、自分のクラブ選びに活かせるゴルフ情報サイト',
  },
}

const toBrandKey = (value?: string): BrandKey | null => {
  const normalized = (value || '').toLowerCase()
  return normalized === 'golfid' || normalized === 'mybagpro' ? normalized : null
}

const replaceMetaContent = (html: string, selector: string, content: string) =>
  html.replace(new RegExp(`(<meta ${selector} content=")[^"]*(" \\/?>)`, 'i'), `$1${content}$2`)

const brandIndexHtmlPlugin = (brand: BrandKey | null): Plugin => ({
  name: 'brand-index-html',
  transformIndexHtml: {
    order: 'pre',
    handler(html, ctx) {
      if (!brand || !ctx.filename.endsWith('index.html')) return html

      const meta = brandMeta[brand]
      const canonical = `${meta.url}/`
      const image = `${meta.url}/article-visuals/golf-bag-course.jpg`
      const searchTarget = `${meta.url}/pros?search={search_term_string}`
      const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: meta.name,
        url: canonical,
        inLanguage: 'ja-JP',
        description: meta.structuredDescription,
        potentialAction: {
          '@type': 'SearchAction',
          target: searchTarget,
          'query-input': 'required name=search_term_string',
        },
        publisher: {
          '@type': 'Organization',
          name: meta.name,
        },
      }

      let next = html
        .replace(/<title>.*?<\/title>/i, `<title>${meta.title}</title>`)
        .replace(/<link rel="canonical" href="[^"]*" \/>/i, `<link rel="canonical" href="${canonical}" />`)
        .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/i, `<script type="application/ld+json">\n    ${JSON.stringify(structuredData, null, 6)}\n  </script>`)
        .replace(/<meta property="og:site_name" content="[^"]*" \/>/i, `<meta property="og:site_name" content="${meta.name}" />`)
        .replace(/<meta property="og:url" content="[^"]*" \/>/i, `<meta property="og:url" content="${canonical}" />`)
        .replace(/<meta property="og:image" content="[^"]*" \/>/i, `<meta property="og:image" content="${image}" />`)
        .replace(/<meta name="twitter:image" content="[^"]*" \/>/i, `<meta name="twitter:image" content="${image}" />`)

      next = replaceMetaContent(next, 'name="description"', meta.description)
      next = replaceMetaContent(next, 'name="keywords"', meta.keywords)
      next = replaceMetaContent(next, 'property="og:title"', meta.title)
      next = replaceMetaContent(next, 'property="og:description"', meta.description)
      next = replaceMetaContent(next, 'name="twitter:title"', meta.title)
      next = replaceMetaContent(next, 'name="twitter:description"', meta.twitterDescription)

      return next
    },
  },
})

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const brand = toBrandKey(env.VITE_BRAND)

  return {
    plugins: [brandIndexHtmlPlugin(brand), react()],
    // mybagpro.jp/app/ サブディレクトリに配置
    base: '/',
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'index.html'),
          mybagpro: resolve(__dirname, 'mybagpro.html'),
          mybagproPros: resolve(__dirname, 'mybagpro-pros.html'),
          mybagproArticles: resolve(__dirname, 'mybagpro-articles.html'),
          golfidCreate: resolve(__dirname, 'golfid-create.html'),
          golfidDiagnosis: resolve(__dirname, 'golfid-diagnosis.html'),
          golfidPublic: resolve(__dirname, 'golfid-public.html'),
        },
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            supabase: ['@supabase/supabase-js'],
            motion: ['framer-motion'],
            ai: ['@google/generative-ai'],
          },
        },
      },
    },
    server: {
      host: true,
    },
  }
})
