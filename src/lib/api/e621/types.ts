// E621 API Types based on OpenAPI specification
export interface E621Post {
  id: number
  created_at: string
  updated_at: string
  file: {
    width: number
    height: number
    ext: string
    size: number
    md5: string
    url: string | null
  }
  preview: {
    width: number
    height: number
    url: string | null
  }
  sample: {
    has: boolean
    height: number | null
    width: number | null
    url: string | null
    alternates: {
      has: boolean
      original?: {
        type: string
        height: number | null
        width: number | null
        urls: (string | null)[]
      }
      variants?: {
        webm?: {
          type: string
          height: number | null
          width: number | null
          urls: (string | null)[]
        }
        mp4?: {
          type: string
          height: number | null
          width: number | null
          urls: (string | null)[]
        }
      }
      samples?: {
        '720p'?: {
          type: string
          height: number | null
          width: number | null
          urls: (string | null)[]
        }
        '480p'?: {
          type: string
          height: number | null
          width: number | null
          urls: (string | null)[]
        }
        original?: {
          type: string
          height: number | null
          width: number | null
          urls: (string | null)[]
        }
      }
    }
  }
  score: {
    up: number
    down: number
    total: number
  }
  tags: {
    general: string[]
    species: string[]
    character: string[]
    copyright: string[]
    artist: string[]
    invalid: string[]
    lore: string[]
    meta: string[]
  }
  locked_tags: string[]
  change_seq: number
  flags: {
    pending: boolean
    flagged: boolean
    note_locked: boolean
    status_locked: boolean
    rating_locked: boolean
    deleted: boolean
  }
  rating: 's' | 'q' | 'e'
  fav_count: number
  sources: string[]
  pools: number[]
  relationships: {
    parent_id: number | null
    has_children: boolean
    has_active_children: boolean
    children: number[]
  }
  approver_id: number | null
  uploader_id: number
  description: string
  comment_count: number
  is_favorited: boolean
  has_notes: boolean
  duration: number | null
  bg_color: string | null
  // Additional fields from official API
  tag_count: number
  tag_count_general: number
  tag_count_species: number
  tag_count_character: number
  tag_count_copyright: number
  tag_count_artist: number
  tag_count_invalid: number
  tag_count_lore: number
  tag_count_meta: number
  is_comment_disabled: boolean
  is_comment_locked: boolean
  has_large: boolean
  has_visible_children: boolean
  children_ids: string | null
  generated_samples: string[] | null
}

export interface E621Pool {
  id: number
  name: string
  created_at: string
  updated_at: string
  creator_id: number
  description: string
  is_active: boolean
  category: string
  post_ids: number[]
  creator_name: string
  post_count: number
}

// Tag details
export interface E621Tag {
  id: number
  name: string
  post_count: number
  related_tags: string
  related_tags_updated_at: string
  category: number // 0: General, 1: Artist, 3: Copyright, 4: Character, 5: Species, 6: Invalid, 7: Meta, 8: Lore
  is_locked: boolean
  created_at: string
  updated_at: string
}

// Enhanced search parameters based on the API documentation
export interface SearchParams {
  // Main search parameters
  tags?: string
  limit?: number // Max 320
  page?: number // Max 750
  
  // Content filtering
  rating?: ('s' | 'q' | 'e')[] // s = safe, q = questionable, e = explicit
  blacklist?: string[]
  
  // Special search options
  md5?: string
  random?: boolean | string
  
  // Sorting options
  order?: string // 'id', 'score', 'favcount', 'created_at', 'updated_at', 'comment_count', 'score_asc', etc.
  
  // Advanced options
  include_deleted?: boolean
  include_flagged?: boolean
}

// Comment types
export interface E621Comment {
  id: number
  created_at: string
  updated_at: string
  post_id: number
  creator_id: number
  creator_name: string
  body: string
  score: number
  is_hidden: boolean
  is_sticky: boolean
  warning_type: string | null
  warning_user_id: number | null
}

export interface CommentSearchParams {
  post_id?: number
  creator_id?: number
  creator_name?: string
  body_matches?: string
  limit?: number // Max 320
  page?: number
  order?: string // 'id', 'score', 'created_at', 'updated_at'
}
