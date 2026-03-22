import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { getAllPosts } from '@/lib/blog'

export const metadata: Metadata = {
  title: 'Blog — IV Therapy Canada',
  description: 'Guides, tips, and resources about IV therapy, NAD+, chelation therapy, and wellness infusions in Canada.',
}

export default function BlogPage() {
  const posts = getAllPosts()

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-[#1E1E2C]">Home</Link>
        {' / '}
        <span className="text-gray-900">Blog</span>
      </nav>

      <h1 className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-display)' }}>
        IV Therapy Canada Blog
      </h1>
      <p className="text-gray-500 mb-10">Guides, costs, and resources for IV therapy in Canada.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {posts.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="group block">
            <article className="rounded-2xl border border-gray-200 bg-white overflow-hidden hover:shadow-lg transition-shadow">
              {/* Cover image */}
              <div className="relative w-full h-48 bg-gray-100 overflow-hidden">
                {post.coverImage ? (
                  <Image
                    src={post.coverImage}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #141420, #1E1E2C)' }}>
                    <span className="text-4xl">💉</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-5">
                <time className="text-xs text-gray-400">
                  {new Date(post.publishedAt).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}
                </time>
                <h2 className="text-lg font-bold text-gray-900 group-hover:text-[#1E1E2C] transition-colors mt-1 mb-2 leading-snug" style={{ fontFamily: 'var(--font-display)' }}>
                  {post.title}
                </h2>
                <p className="text-gray-500 text-sm leading-relaxed line-clamp-2">{post.description}</p>
                <p className="text-[#E8624A] text-sm font-semibold mt-3">Read more →</p>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </main>
  )
}
