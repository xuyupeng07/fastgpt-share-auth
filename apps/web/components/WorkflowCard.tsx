'use client'

import React, { useState, useRef } from 'react'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { Tooltip } from './ui/tooltip'
import { Workflow } from '../lib/types'
import { Users, Heart } from 'lucide-react'
import Image from 'next/image'
import { LoginDialog } from './auth/login-dialog'

interface WorkflowCardProps {
  workflow: Workflow
  index?: number
  onTryWorkflow?: (workflow: Workflow) => void
  onLike?: (workflowId: string, newLikeCount: number) => void
  authToken?: string | null
}

export function WorkflowCard({ workflow, index = 0, onTryWorkflow, onLike, authToken }: WorkflowCardProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(workflow.likeCount || 0)
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const logoRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)



  const handleTryWorkflow = async () => {
    // 增加使用量
    try {
      await fetch(`/api/workflows/${workflow.id}/usage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
    } catch (error) {
      console.error('Error updating usage count:', error)
    }
    
    // 使用与原项目相同的跳转逻辑
    if (authToken && workflow.demo_url) {
      const fastgptUrl = `${workflow.demo_url}&authToken=${authToken}`
      window.open(fastgptUrl, '_blank')
    } else if (!authToken) {
      // 未登录时打开登录悬浮框
      setShowLoginDialog(true)
    }
    onTryWorkflow?.(workflow)
  }

  const handleLoginSuccess = () => {
    setShowLoginDialog(false)
    // 登录成功后可以刷新页面或重新获取用户信息
    window.location.reload()
  }

  const handleLike = async () => {
    if (isLiked) return
    
    try {
      const response = await fetch(`/api/workflows/${workflow.id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setIsLiked(true)
          setLikeCount(result.data.likeCount)
          onLike?.(workflow.id, result.data.likeCount)
        } else {
          console.error('API response error:', result.message)
        }
      } else {
        console.error('Failed to like workflow')
      }
    } catch (error) {
      console.error('Error liking workflow:', error)
    }
  }

  return (
    <div ref={cardRef} className="workflow-card w-full h-48 sm:h-52 lg:h-56 group relative transform transition-all duration-300 ease-out hover:scale-105 hover:z-10">
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
      
      <Card className="workflow-card h-full flex flex-col hover:shadow-2xl hover:shadow-black/20 transition-all duration-300 ease-out border border-border bg-card rounded-xl overflow-visible p-1 sm:p-1.5 relative">
        {/* 主要内容区域 */}
        <div className="flex-1 px-3 sm:px-4 lg:px-5 pt-2 sm:pt-3 pb-12 sm:pb-14 overflow-visible">
          {/* 顶部区域：logo和基本信息 */}
          <div className="flex gap-2 sm:gap-2.5 -mb-1">
            {/* 左侧logo */}
            <div ref={logoRef} className="w-14 h-14 flex items-center justify-center overflow-hidden rounded-lg border-2 border-transparent shadow-lg" style={{
              boxShadow: '0 6px 16px rgba(0, 0, 0, 0.12), 0 3px 6px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)'
            }}>
              <Image
                src={workflow.avatar || workflow.logo || '/fastgpt.svg'}
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
                  <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-card-foreground line-clamp-1 flex-1">
                    {workflow.name}
                  </h3>
                </div>
              </div>
              
              {/* 作者信息 */}
              <div className="flex items-center gap-1 sm:gap-1.5 mb-0.5 mt-0.5 sm:mt-1">
                <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center border border-border shadow-sm overflow-hidden">
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
                <span className="text-xs sm:text-sm font-medium text-muted-foreground">
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
           <Tooltip 
             content={workflow.description}
             side="top"
             anchorRef={cardRef}
           >
             <p className="text-xs sm:text-sm text-muted-foreground line-clamp-4 leading-relaxed mt-1 sm:mt-2 lg:mt-2.5 cursor-pointer hover:text-foreground transition-colors">
               {workflow.description}
             </p>
           </Tooltip>
        </div>

        {/* 底部统计和操作 - 绝对定位 */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 sm:px-4 lg:px-5 py-1.5 sm:py-2 border-t border-border bg-muted/30 rounded-b-xl">
          {/* 统计信息 */}
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-0.5 sm:gap-1">
              <Users className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              <span className="font-medium">{(workflow.usageCount || 0) > 999 ? `${Math.floor((workflow.usageCount || 0)/1000)}k` : (workflow.usageCount || 0)}</span>
            </span>
            <div className="relative">
              <button 
                onClick={handleLike}
                className={`flex items-center gap-1 transition-colors hover:text-red-500 ${
                  isLiked ? 'text-red-500' : 'text-muted-foreground'
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
            <Tooltip 
              content={
                authToken && workflow.demo_url
                  ? "快速体验" 
                  : !authToken
                    ? "登录后可使用"
                    : "联系FastGPT商务团队获取更多工作流模板"
              }
              side="top"
            >
               <Button 
                 type="button"
                 size="sm"
                 onClick={handleTryWorkflow}
                 className={`border-0 rounded-lg px-1.5 sm:px-2 lg:px-2.5 py-0.5 sm:py-1 text-xs font-medium transition-all duration-200 h-5 sm:h-6 ${
                   (!authToken && !workflow.demo_url)
                     ? 'bg-muted cursor-not-allowed text-muted-foreground'
                     : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                 }`}
                 disabled={!authToken && !workflow.demo_url}
               >
                 Try
               </Button>
             </Tooltip>
          </div>
        </div>
      </Card>
      
      {/* 登录对话框 */}
      <LoginDialog 
        open={showLoginDialog} 
        onOpenChange={setShowLoginDialog}
        onSuccess={handleLoginSuccess}
      />
    </div>
  )
}

export default WorkflowCard