# NtNtN Engine — Category 9: CMS & Content

> How content is managed, authored, and delivered.

---

## Sanity

### Overview
Real-time structured content platform. Define custom schemas, query with GROQ,
collaborate in real-time. The most flexible headless CMS for custom workflows.

- **Current:** Sanity v3 (Studio)
- **Query:** GROQ (Graph-Relational Object Queries)
- **Hosting:** Cloud-hosted CDN (content), self-hosted Studio (admin)

### Key Patterns

#### Schema Definition
```ts
// schemas/post.ts
export default defineType({
  name: 'post',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: Rule => Rule.required() }),
    defineField({ name: 'slug', type: 'slug', options: { source: 'title' } }),
    defineField({ name: 'body', type: 'array', of: [{ type: 'block' }] }), // Portable Text
    defineField({ name: 'coverImage', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'publishedAt', type: 'datetime' }),
  ],
});
```

#### GROQ Query
```groq
*[_type == "post" && publishedAt < now()] | order(publishedAt desc) {
  title, slug, publishedAt,
  "coverUrl": coverImage.asset->url,
  body[] { ..., _type == "image" => { "url": asset->url } }
}
```

#### Next.js Integration
```ts
const posts = await sanityClient.fetch(groqQuery);
```

### Visual Editing
Sanity's Visual Editing allows content editors to click-to-edit directly on the
live preview of the site. Requires `@sanity/visual-editing` package.

### Picker_Ang Notes
- Choose when: Custom schemas, real-time collaboration, need GROQ flexibility
- Avoid when: Simple blog (MDX is simpler), need self-hosted everything (Strapi/Payload)

---

## Strapi

### Overview
Open-source headless CMS. Self-hosted, extensible, generates REST + GraphQL
APIs from content types. Admin panel included.

- **Current:** Strapi 5.x
- **Hosting:** Self-hosted (Docker, VPS), Strapi Cloud
- **API:** Auto-generated REST and GraphQL endpoints

### Key Patterns

#### Content Type (via Admin or code)
```json
{
  "kind": "collectionType",
  "collectionName": "articles",
  "attributes": {
    "title": { "type": "string", "required": true },
    "content": { "type": "richtext" },
    "cover": { "type": "media" },
    "category": { "type": "relation", "relation": "manyToOne", "target": "api::category.category" }
  }
}
```

#### API Usage
```ts
// REST
const articles = await fetch('http://localhost:1337/api/articles?populate=cover');

// GraphQL
const { data } = await graphqlClient.query({
  query: gql`{ articles { data { attributes { title content } } } }`
});
```

### Picker_Ang Notes
- Choose when: Self-hosted required, full control over data, REST + GraphQL needed
- Avoid when: Need real-time collaboration (Sanity better), serverless deployment

---

## Payload CMS

### Overview
TypeScript-first headless CMS. Code-first configuration — define collections
in TypeScript, get API + admin panel automatically. Can be embedded in Next.js.

- **Current:** Payload 3.x (Next.js native)
- **Approach:** Config-driven (TypeScript), embedded in your Next.js app
- **Database:** Postgres, MongoDB, SQLite (via Drizzle adapter)

### Key Patterns
```ts
// collections/Posts.ts
export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: { useAsTitle: 'title' },
  access: { read: () => true, create: isAdmin },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'content', type: 'richText' },
    { name: 'status', type: 'select', options: ['draft', 'published'] },
    { name: 'author', type: 'relationship', relationTo: 'users' },
  ],
};
```

### Picker_Ang Notes
- Choose when: TypeScript team, want CMS embedded in Next.js, code-first approach
- Avoid when: Non-technical editors (Sanity Studio is friendlier for content teams)

---

## Contentful

### Overview
Enterprise headless CMS. Cloud-hosted, CDN-delivered, structured content with
Environments for staging/production content management.

- **Current:** Contentful latest
- **Approach:** Visual content modeling, REST + GraphQL APIs, CDN delivery
- **Pricing:** Free tier available, enterprise pricing for larger teams

### Picker_Ang Notes
- Choose when: Enterprise content operations, multi-channel delivery, large teams
- Avoid when: Budget-sensitive (pricing scales with usage), need full self-hosting

---

## MDX

### Overview
Markdown with JSX components embedded. Write content in Markdown, import and use
React components inline. The standard for developer documentation and technical blogs.

- **Current:** MDX 3.x
- **Approach:** `.mdx` files compiled to React components
- **Integration:** Next.js (`@next/mdx`), Astro, Remix, Gatsby

### Key Patterns
```mdx
---
title: "Getting Started"
date: 2026-02-21
---

import { CodeBlock } from '../components/CodeBlock'
import { Alert } from '../components/Alert'

# Getting Started

<Alert type="info">This guide assumes you have Node.js installed.</Alert>

## Installation

<CodeBlock language="bash">
npm install @aims/sdk
</CodeBlock>

Here's a **live demo** of the component:

<InteractiveDemo />
```

### Ecosystem
- **next-mdx-remote:** Load MDX from any source (CMS, database, file system)
- **contentlayer2:** Type-safe MDX with schema validation (Contentlayer successor)
- **rehype/remark plugins:** Syntax highlighting, table of contents, reading time

### Picker_Ang Notes
- Choose when: Developer docs, technical blogs, content that mixes prose + interactive code
- Avoid when: Non-technical editors (need visual editor, use Sanity/Payload)

---

## Keystatic

### Overview
Git-based CMS with local-first editing. Content stored as files in your Git repo.
Works with Astro, Next.js, and Remix.

- **Current:** Keystatic 0.5+
- **Approach:** Schema-defined content → stored as files in Git
- **Modes:** Local (filesystem), GitHub (API-based)

### Key Patterns
```ts
// keystatic.config.ts
export default config({
  storage: { kind: 'github', repo: 'owner/repo' },
  collections: {
    posts: collection({
      label: 'Posts',
      slugField: 'title',
      path: 'content/posts/*',
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        content: fields.markdoc({ label: 'Content' }),
        date: fields.date({ label: 'Date' }),
      },
    }),
  },
});
```

### Picker_Ang Notes
- Choose when: Small team, Git-native workflows, no database needed for content
- Avoid when: Large content teams (need real-time collab), complex content models

---

## CMS Comparison Matrix

| CMS | Hosting | Editor UX | Developer UX | API | Pricing | Best For |
|-----|---------|-----------|-------------|-----|---------|----------|
| **Sanity** | Cloud | Excellent | Excellent | GROQ + REST | Generous free tier | Custom schemas, real-time |
| **Strapi** | Self-hosted | Good | Good | REST + GraphQL | Free (open-source) | Full control, self-hosted |
| **Payload** | Self-hosted | Good | Excellent | REST + GraphQL | Free (open-source) | TypeScript-first, Next.js |
| **Contentful** | Cloud | Excellent | Good | REST + GraphQL | Paid (enterprise) | Enterprise, multi-channel |
| **MDX** | Git | Developers only | Excellent | File-based | Free | Dev docs, technical blogs |
| **Keystatic** | Git/GitHub | Good | Good | File-based | Free | Small teams, Git workflows |

---

## A.I.M.S. Default: MDX (docs/blogs) + Sanity (dynamic content)

For developer documentation and blogs: **MDX** with Next.js.
For dynamic, editor-managed content: **Sanity** with GROQ queries.
For self-hosted requirements: **Payload CMS** embedded in Next.js.
