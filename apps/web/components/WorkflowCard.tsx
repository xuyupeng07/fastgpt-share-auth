'use client'

import React, { useState, useRef } from 'react'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { Tooltip } from './ui/tooltip'
import { Workflow } from '../lib/types'
import { Users, Heart } from 'lucide-react'
import Image from 'next/image'

interface WorkflowCardProps {
  workflow: Workflow
  index?: number
  onTryWorkflow?: (workflow: Workflow) => void
  onLike?: (workflowId: string) => void
  authToken?: string | null
}

export function WorkflowCard({ workflow, index = 0, onTryWorkflow, onLike, authToken }: WorkflowCardProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(workflow.likeCount || 0)
  const logoRef = useRef<HTMLDivElement>(null)



  const handleTryWorkflow = () => {
    // 使用与原项目相同的跳转逻辑
    if (authToken && workflow.demo_url) {
      const fastgptUrl = `${workflow.demo_url}&authToken=${authToken}`
      window.open(fastgptUrl, '_blank')
    } else if (!authToken) {
      // 未登录时跳转到登录页
      window.location.href = '/login'
    }
    onTryWorkflow?.(workflow)
  }

  const handleLike = () => {
    if (!isLiked) {
      setIsLiked(true)
      setLikeCount(prev => prev + 1)
      onLike?.(workflow.id)
    }
  }

  return (
    <div className="workflow-card w-full h-48 sm:h-52 lg:h-56 group relative">
      {workflow.isVip && (
        <div className="absolute top-3 right-0 z-10">
          <div className="relative bg-gradient-to-r from-amber-50 via-yellow-100 to-amber-50 text-amber-700 px-1.5 py-0 rounded-tl-lg rounded-bl-lg shadow-sm backdrop-blur-sm overflow-hidden group">
            {/* 简洁光泽动效 */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-200/30 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-800 ease-out"></div>
            {/* 清新内部光效 */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-transparent"></div>
            <span className="relative text-xs font-bold tracking-wide" style={{fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif', textShadow: '0 0.5px 1px rgba(180,83,9,0.15)'}}>VIP</span>
          </div>
        </div>
      )}
      
      <Card className="workflow-card h-full flex flex-col hover:shadow-md transition-all duration-300 border border-gray-100/50 bg-white rounded-xl overflow-hidden p-1 sm:p-1.5">
        {/* 主要内容区域 */}
        <div className="flex-1 px-3 sm:px-4 lg:px-5 pt-2 sm:pt-3 pb-1 sm:pb-1.5 overflow-hidden">
          {/* 顶部区域：logo和基本信息 */}
          <div className="flex gap-2 sm:gap-2.5 -mb-1">
            {/* 左侧logo */}
            <div ref={logoRef} className="w-14 h-14 flex items-center justify-center overflow-hidden rounded-lg border-2 border-transparent shadow-lg" style={{
              boxShadow: '0 6px 16px rgba(0, 0, 0, 0.12), 0 3px 6px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)'
            }}>
              <Image
                src={workflow.logo || '/fastgpt.svg'}
                alt={workflow.name}
                width={56}
                height={56}
                className="max-w-full max-h-full object-contain"
                style={{
                  imageRendering: 'auto'
                } as React.CSSProperties}
                unoptimized={false}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/fastgpt.svg'
                }}
              />
            </div>
            
            {/* 右侧信息 */}
            <div className="flex-1 min-w-0">
              {/* 标题 */}
              <div className="mb-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 line-clamp-1 flex-1">
                    {workflow.name}
                  </h3>
                </div>
              </div>
              
              {/* 作者信息 */}
              <div className="flex items-center gap-1 sm:gap-1.5 mb-0.5 mt-0.5 sm:mt-1">
                <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center border border-gray-100 shadow-sm overflow-hidden">
                  <Image
                    src={(workflow.author?.name === 'FastGPT Team' || workflow.author?.name === 'FastGPT团队' || !workflow.author?.name) ? "/fastgpt.svg" : "/community.svg"}
                    alt={(workflow.author?.name === 'FastGPT Team' || workflow.author?.name === 'FastGPT团队' || !workflow.author?.name) ? "FastGPT" : "社区贡献者"}
                    width={20}
                    height={20}
                    className="max-w-full max-h-full object-contain"
                    style={{
                      imageRendering: 'auto'
                    } as React.CSSProperties}
                    unoptimized
                  />
                </div>
                <span className="text-xs sm:text-sm font-medium text-gray-700">
                  {/* 显示实际作者名称 */}
                  {workflow.author?.name || 'FastGPT团队'}
                </span>
                {/* 只有FastGPT团队才显示认证标志 */}
                {(workflow.author?.name === 'FastGPT Team' || workflow.author?.name === 'FastGPT团队' || !workflow.author?.name) && (
                  <div className="w-3.5 h-3.5 rounded-full bg-blue-500 flex items-center justify-center ml-0.5">
                    <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* 描述 */}
           <Tooltip content={workflow.description}>
             <p className="text-xs sm:text-sm text-gray-500 line-clamp-4 sm:line-clamp-3 leading-relaxed mt-1 sm:mt-2 lg:mt-2.5 cursor-pointer">
               {workflow.description}
             </p>
           </Tooltip>
        </div>

        {/* 底部统计和操作 */}
        <div className="flex items-center justify-between px-3 sm:px-4 lg:px-5 py-1.5 sm:py-2 border-t border-gray-100 flex-shrink-0 bg-gray-50/30">
          {/* 统计信息 */}
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-gray-500">
            <span className="flex items-center gap-0.5 sm:gap-1">
              <Users className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              <span className="font-medium">{(workflow.usageCount || 0) > 999 ? `${Math.floor((workflow.usageCount || 0)/1000)}k` : (workflow.usageCount || 0)}</span>
            </span>
            <div className="relative">
              <button 
                onClick={handleLike}
                className={`flex items-center gap-1 transition-colors hover:text-red-500 ${
                  isLiked ? 'text-red-500' : 'text-gray-500'
                } cursor-pointer`}
              >
                <Heart 
                  className={`w-2.5 h-2.5 sm:w-3 sm:h-3 transition-all ${
                    isLiked ? 'fill-current' : ''
                  }`} 
                />
                <span className="font-medium">{likeCount || 0}</span>
              </button>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-1 sm:gap-1.5">
            <Tooltip content={
               authToken && workflow.demo_url
                 ? "快速体验" 
                 : !authToken
                   ? "跳转至FastGPT登录页，扫码登录后系统将自动创建该工作流"
                   : "联系FastGPT商务团队获取更多工作流模板"
             }>
               <Button 
                 type="button"
                 size="sm"
                 onClick={handleTryWorkflow}
                 className={`border-0 rounded-lg px-1.5 sm:px-2 lg:px-2.5 py-0.5 sm:py-1 text-xs font-medium transition-all duration-200 h-5 sm:h-6 ${
                   (!authToken && !workflow.demo_url)
                     ? 'bg-gray-400 cursor-not-allowed text-gray-200'
                     : 'bg-gray-900 hover:bg-gray-800 text-white'
                 }`}
                 disabled={!authToken && !workflow.demo_url}
               >
                 Try
               </Button>
             </Tooltip>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default WorkflowCard