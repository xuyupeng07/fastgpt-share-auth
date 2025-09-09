export interface Workflow {
  id: string
  name: string
  description: string
  logo?: string
  isVip?: boolean
  config?: any
  demo_url?: string
  author: {
    name: string
    avatar?: string
    isVerified?: boolean
  }
  category?: string
  category_name?: string
  likeCount?: number
  usageCount?: number
}

export type WorkflowCategory = string

export interface LinkConfig {
  url: string
  text: string
}