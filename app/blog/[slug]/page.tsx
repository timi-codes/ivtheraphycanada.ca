import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getAllPosts, getPostBySlug } from '@/lib/blog'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }))
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ivtherapycanada.ca'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return { robots: 'noindex' }
  const canonical = `${SITE_URL}/blog/${slug}`
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical },
    authors: [{ name: 'IV Therapy Canada' }],
    openGraph: {
      type: 'article',
      url: canonical,
      title: post.title,
      description: post.description,
      siteName: 'IV Therapy Canada',
      locale: 'en_CA',
      publishedTime: post.publishedAt,
      images: (post as any).coverImage ? [{ url: (post as any).coverImage, width: 1200, height: 630 }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: (post as any).coverImage ? [(post as any).coverImage] : [],
    },
  }
}

// Minimal markdown renderer (converts MDX content to HTML-safe JSX)
function renderMarkdown(content: string) {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let tableRows: string[] = []
  let inTable = false
  let key = 0

  const processInline = (text: string) => {
    // Bold, italic, code, links
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-[#1E1E2C] underline font-semibold hover:opacity-75">$1</a>')
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Table
    if (line.startsWith('|')) {
      inTable = true
      tableRows.push(line)
      continue
    }
    if (inTable && !line.startsWith('|')) {
      // Render table
      const rows = tableRows.filter((r) => !r.match(/^\|[-| ]+\|$/))
      elements.push(
        <div key={key++} className="overflow-x-auto my-6">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                {rows[0].split('|').filter((_, i, a) => i > 0 && i < a.length - 1).map((cell, ci) => (
                  <th key={ci} className="border border-gray-200 bg-gray-50 px-4 py-2 text-left font-semibold">{cell.trim()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(1).map((row, ri) => (
                <tr key={ri}>
                  {row.split('|').filter((_, i, a) => i > 0 && i < a.length - 1).map((cell, ci) => (
                    <td key={ci} className="border border-gray-200 px-4 py-2" dangerouslySetInnerHTML={{ __html: processInline(cell.trim()) }} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
      tableRows = []
      inTable = false
    }

    if (line.startsWith('## ')) {
      elements.push(<h2 key={key++} className="text-2xl font-bold text-gray-900 mt-10 mb-4">{line.slice(3)}</h2>)
    } else if (line.startsWith('### ')) {
      elements.push(<h3 key={key++} className="text-xl font-bold text-gray-900 mt-6 mb-3">{line.slice(4)}</h3>)
    } else if (line.startsWith('- ')) {
      elements.push(<li key={key++} className="ml-4 text-gray-700 mb-1" dangerouslySetInnerHTML={{ __html: processInline(line.slice(2)) }} />)
    } else if (line.match(/^\d+\. /)) {
      elements.push(<li key={key++} className="ml-4 list-decimal text-gray-700 mb-1" dangerouslySetInnerHTML={{ __html: processInline(line.replace(/^\d+\. /, '')) }} />)
    } else if (line.startsWith('*This article')) {
      elements.push(<p key={key++} className="text-sm text-gray-400 italic mt-8 pt-4 border-t border-gray-100" dangerouslySetInnerHTML={{ __html: processInline(line.slice(1, -1)) }} />)
    } else if (line.trim() === '') {
      elements.push(<br key={key++} />)
    } else if (line.trim()) {
      elements.push(<p key={key++} className="text-gray-700 leading-relaxed mb-4" dangerouslySetInnerHTML={{ __html: processInline(line) }} />)
    }
  }

  return elements
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-[#1E1E2C]">Home</Link>
        {' / '}
        <Link href="/blog" className="hover:text-[#1E1E2C]">Blog</Link>
        {' / '}
        <span className="text-gray-900">{post.title}</span>
      </nav>

      <article>
        <header className="mb-8">
          <time className="text-sm text-gray-400">
            {new Date(post.publishedAt).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}
          </time>
          <h1 className="text-3xl font-bold text-gray-900 mt-2 mb-3" style={{ fontFamily: 'var(--font-display)' }}>{post.title}</h1>
          <p className="text-xl text-gray-500 mb-6">{post.description}</p>

          {post.coverImage && (
            <div className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden mb-8">
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 768px"
                priority
              />
            </div>
          )}
        </header>

        <div className="prose-content">
          {renderMarkdown(post.content)}
        </div>
      </article>

      <div className="mt-12 border-t border-gray-100 pt-8">
        <Link href="/blog" className="text-[#1E1E2C] hover:underline text-sm">← Back to Blog</Link>
      </div>
    </main>
  )
}
