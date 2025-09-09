'use client'

import React, { useState, useMemo } from 'react'
import { Button } from './ui/button'
import { Badge } from '@workspace/ui/components/badge'
import { Input } from './ui/input'
import { WorkflowCard } from './WorkflowCard'
import { Workflow } from '../lib/types'

interface WorkflowGridProps {
  workflows: Workflow[]
  onTryWorkflow?: (workflow: Workflow) => void
  onLike?: (workflowId: string) => void
  authToken?: string | null
}

type SortOption = 'latest' | 'popular' | 'mostUsed'

const categories = [
  '全部',
  '客服助手',
  '办公助手', 
  '编程助手',
  '学习助手',
  '生活助手',
  '创作助手',
  '其他'
]

export function WorkflowGrid({ workflows, onTryWorkflow, onLike, authToken }: WorkflowGridProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('全部')
  const [sortBy, setSortBy] = useState<SortOption>('latest')

  // 过滤和排序工作流
  const filteredAndSortedWorkflows = useMemo(() => {
    let filtered = workflows

    // 搜索过滤
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        workflow =>
          workflow.name.toLowerCase().includes(query) ||
          workflow.description.toLowerCase().includes(query) ||
          workflow.author.name.toLowerCase().includes(query)
      )
    }

    // 分类过滤
    if (selectedCategory !== '全部') {
      filtered = filtered.filter(workflow => workflow.category === selectedCategory)
    }

    // 排序
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return (b.likeCount || 0) - (a.likeCount || 0)
        case 'mostUsed':
          return (b.usageCount || 0) - (a.usageCount || 0)
        case 'latest':
        default:
          return b.id.localeCompare(a.id) // 简单的按ID排序，实际项目中应该用创建时间
      }
    })

    return sorted
  }, [workflows, searchQuery, selectedCategory, sortBy])

  return (
    <div className="space-y-6">
      {/* 搜索栏 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="搜索工作流..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      {/* 现代化筛选区域 */}
      <div className="space-y-4 sm:space-y-6">
        {/* 响应式筛选布局 */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
          {/* 排序选项 */}
          <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1 w-fit">
            <button
              onClick={() => setSortBy('popular')}
              className={`rounded-md px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-all duration-200 ${
                sortBy === 'popular' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/70 hover:scale-105 hover:shadow-sm'
              }`}
            >
              热门度
            </button>
            <button
              onClick={() => setSortBy('mostUsed')}
              className={`rounded-md px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-all duration-200 ${
                sortBy === 'mostUsed' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/70 hover:scale-105 hover:shadow-sm'
              }`}
            >
              使用量
            </button>
            <button
              onClick={() => setSortBy('latest')}
              className={`rounded-md px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-all duration-200 ${
                sortBy === 'latest' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/70 hover:scale-105 hover:shadow-sm'
              }`}
            >
              最新
            </button>
          </div>

          {/* 分类筛选 - 响应式滚动 */}
          <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 lg:pb-0 lg:flex-wrap lg:justify-end scrollbar-hide">
            {categories.map((category) => {
              const categoryCount = category === '全部' 
                ? filteredAndSortedWorkflows.length 
                : workflows.filter(w => w.category === category).length
              
              return (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                    selectedCategory === category 
                      ? 'bg-gray-900 text-white shadow-md hover:bg-gray-800' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {category}
                  {selectedCategory === category && (
                    <Badge variant="secondary" className="ml-1 sm:ml-2 bg-white/20 text-white border-0 text-xs">
                      {categoryCount}
                    </Badge>
                  )}
                </Button>
              )
            })}
          </div>
        </div>
      </div>

      {/* 搜索结果提示 */}
      {searchQuery && (
        <div className="text-sm text-gray-600">
          找到 {filteredAndSortedWorkflows.length} 个相关工作流
        </div>
      )}

      {/* 工作流网格 */}
      {filteredAndSortedWorkflows.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAndSortedWorkflows.map((workflow) => (
            <WorkflowCard
              key={workflow.id}
              workflow={workflow}
              onTryWorkflow={onTryWorkflow}
              onLike={onLike}
              authToken={authToken}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-2">
            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47.881-6.08 2.33" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">没有找到工作流</h3>
          <p className="text-gray-500">尝试调整搜索条件或分类筛选</p>
        </div>
      )}
    </div>
  )
}

export default WorkflowGrid