export interface StockAsset {
  id: string
  title: string
  category: 'architecture' | 'nature' | 'tech' | 'abstract' | 'minimal' | 'dark'
  url: string
  thumbUrl: string
  author: string
  tags: string[]
}

export const STOCK_ASSET_CATEGORIES = [
  { id: 'all', label: 'All Media' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'nature', label: 'Nature' },
  { id: 'tech', label: 'Tech & Workspace' },
  { id: 'abstract', label: 'Abstract & 3D' },
  { id: 'minimal', label: 'Minimal & Textures' },
  { id: 'dark', label: 'Dark Mood' },
  { id: 'uploads', label: 'My Uploads' },
] as const

export const STOCK_ASSETS: StockAsset[] = [
  // Architecture
  {
    id: 'arch-1',
    title: 'Modern Glass Tower',
    category: 'architecture',
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=85',
    thumbUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=75',
    author: 'Sean Pollock',
    tags: ['building', 'skyscraper', 'urban', 'modern', 'glass'],
  },
  {
    id: 'arch-2',
    title: 'Geometric Concrete Façade',
    category: 'architecture',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1600&q=85',
    thumbUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=75',
    author: 'Simone Hutsch',
    tags: ['brutalist', 'geometric', 'facade', 'lines', 'shadows'],
  },
  {
    id: 'arch-3',
    title: 'Minimal Spiral Staircase',
    category: 'architecture',
    url: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1600&q=85',
    thumbUrl: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=400&q=75',
    author: 'Tobi',
    tags: ['interior', 'stairs', 'curves', 'monochrome'],
  },
  // Nature
  {
    id: 'nat-1',
    title: 'Misty Alpine Pines',
    category: 'nature',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=85',
    thumbUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=75',
    author: 'Bailey Zindel',
    tags: ['forest', 'mountains', 'fog', 'trees', 'green'],
  },
  {
    id: 'nat-2',
    title: 'Dramatic Coastal Cliffs',
    category: 'nature',
    url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1600&q=85',
    thumbUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=400&q=75',
    author: 'Luca Bravo',
    tags: ['ocean', 'cliffs', 'mist', 'sunset', 'water'],
  },
  {
    id: 'nat-3',
    title: 'Dolomites Mountain Ridge',
    category: 'nature',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=85',
    thumbUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=75',
    author: 'Kalon Egodage',
    tags: ['alps', 'peaks', 'sky', 'rock', 'wilderness'],
  },
  // Tech & Workspace
  {
    id: 'tech-1',
    title: 'Minimalist Engineering Desk',
    category: 'tech',
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=85',
    thumbUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=75',
    author: 'Alexandre Debiève',
    tags: ['code', 'hardware', 'motherboard', 'silicon', 'future'],
  },
  {
    id: 'tech-2',
    title: 'Clean Workspace Setup',
    category: 'tech',
    url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1600&q=85',
    thumbUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=400&q=75',
    author: 'Christopher Gower',
    tags: ['laptop', 'desk', 'workspace', 'coffee', 'keyboard'],
  },
  {
    id: 'tech-3',
    title: 'Ultrawide Creative Studio',
    category: 'tech',
    url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1600&q=85',
    thumbUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=400&q=75',
    author: 'Luke Peters',
    tags: ['monitor', 'audio', 'studio', 'dark', 'setup'],
  },
  // Abstract & 3D
  {
    id: 'abs-1',
    title: 'Fluid Gradient Hologram',
    category: 'abstract',
    url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1600&q=85',
    thumbUrl: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=400&q=75',
    author: 'Lucas Benjamin',
    tags: ['fluid', 'gradient', 'mesh', 'colors', 'vibrant'],
  },
  {
    id: 'abs-2',
    title: 'Dark Neon Topography',
    category: 'abstract',
    url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1600&q=85',
    thumbUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=400&q=75',
    author: 'Milad Fakurian',
    tags: ['waves', 'neon', 'dark', '3d', 'glow'],
  },
  {
    id: 'abs-3',
    title: 'Iridescent Glass Distortion',
    category: 'abstract',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=85',
    thumbUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=75',
    author: 'Steve Johnson',
    tags: ['glass', 'crystal', 'distortion', 'light', 'refraction'],
  },
  // Minimal & Textures
  {
    id: 'min-1',
    title: 'Smooth Slate Concrete',
    category: 'minimal',
    url: 'https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?auto=format&fit=crop&w=1600&q=85',
    thumbUrl: 'https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?auto=format&fit=crop&w=400&q=75',
    author: 'Bernard Hermant',
    tags: ['stone', 'texture', 'grey', 'minimal', 'surface'],
  },
  {
    id: 'min-2',
    title: 'Soft Paper Grain Texture',
    category: 'minimal',
    url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1600&q=85',
    thumbUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=400&q=75',
    author: 'Annie Spratt',
    tags: ['paper', 'grain', 'warm', 'clean', 'plain'],
  },
  // Dark Mood
  {
    id: 'dark-1',
    title: 'Deep Obsidian Cosmic Aura',
    category: 'dark',
    url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1600&q=85',
    thumbUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=400&q=75',
    author: 'Greg Rakozy',
    tags: ['space', 'stars', 'night', 'galaxy', 'dark'],
  },
  {
    id: 'dark-2',
    title: 'Midnight Urban Monolith',
    category: 'dark',
    url: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=1600&q=85',
    thumbUrl: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=400&q=75',
    author: 'Mitchell Luo',
    tags: ['city', 'dark', 'fog', 'monolith', 'atmosphere'],
  },
]

export function filterStockAssets(
  assets: StockAsset[],
  category: string,
  searchQuery: string,
): StockAsset[] {
  let filtered = assets

  if (category && category !== 'all' && category !== 'uploads') {
    filtered = filtered.filter((a) => a.category === category)
  }

  const query = searchQuery.trim().toLowerCase()
  if (query) {
    filtered = filtered.filter((a) => {
      const titleMatch = a.title.toLowerCase().includes(query)
      const authorMatch = a.author.toLowerCase().includes(query)
      const tagMatch = a.tags.some((t) => t.toLowerCase().includes(query))
      return titleMatch || authorMatch || tagMatch
    })
  }

  return filtered
}
