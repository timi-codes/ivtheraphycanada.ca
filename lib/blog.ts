import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const BLOG_DIR = path.join(process.cwd(), 'content/blog')

export interface BlogPost {
  slug: string
  title: string
  description: string
  publishedAt: string
  coverImage?: string
  content: string
}

export function getAllPosts(): Omit<BlogPost, 'content'>[] {
  if (!fs.existsSync(BLOG_DIR)) return []

  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith('.mdx') || f.endsWith('.md'))
    .map((filename) => {
      const raw = fs.readFileSync(path.join(BLOG_DIR, filename), 'utf-8')
      const { data } = matter(raw)
      return {
        slug: (data.slug as string) ?? filename.replace(/\.mdx?$/, ''),
        title: data.title as string,
        description: data.description as string,
        publishedAt: data.publishedAt as string,
        coverImage: data.coverImage as string | undefined,
      }
    })
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
}

export function getPostBySlug(slug: string): BlogPost | null {
  if (!fs.existsSync(BLOG_DIR)) return null

  const files = fs.readdirSync(BLOG_DIR)
  for (const filename of files) {
    const raw = fs.readFileSync(path.join(BLOG_DIR, filename), 'utf-8')
    const { data, content } = matter(raw)
    const postSlug = (data.slug as string) ?? filename.replace(/\.mdx?$/, '')
    if (postSlug === slug) {
      return {
        slug: postSlug,
        title: data.title as string,
        description: data.description as string,
        publishedAt: data.publishedAt as string,
        coverImage: data.coverImage as string | undefined,
        content,
      }
    }
  }
  return null
}
