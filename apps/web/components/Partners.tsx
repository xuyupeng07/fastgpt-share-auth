'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ExternalLink, Users, Award, Zap } from 'lucide-react';
import { partners, categoryIcons, categoryLabels, type Partner } from '@/data/partners';

// 简化的合作伙伴数据，直接嵌入组件中
const simplePartners = [
  { id: '1', logo: '/logos/openai-logo.svg' },
  { id: '2', logo: '/logos/anthropic.svg' },
  { id: '3', logo: '/logos/claude-color.svg' },
  { id: '4', logo: '/logos/gemini-color.svg' },
  { id: '5', logo: '/logos/deepseek-color.svg' },
  { id: '6', logo: '/logos/doubao-color.svg' },
  { id: '7', logo: '/logos/kimi-color.svg' },
  { id: '8', logo: '/logos/moonshot.svg' },
  { id: '9', logo: '/logos/zhipu-color.svg' },
  { id: '10', logo: '/logos/hunyuan-color.svg' },
  { id: '11', logo: '/logos/minimax-color.svg' },
  { id: '12', logo: '/logos/siliconcloud-color.svg' },
  { id: '13', logo: '/logos/qwen-color.svg' },
  { id: '14', logo: '/logos/wenxin-color.svg' },
  { id: '15', logo: '/logos/grok.svg' },
  { id: '16', logo: '/logos/internlm.svg' },
  { id: '17', logo: '/logos/baai.svg' },
  { id: '18', logo: '/logos/kling-color.svg' },
  { id: '19', logo: '/logos/flux.svg' },
  { id: '20', logo: '/logos/stability-color.svg' },
  { id: '21', logo: '/logos/ollama.svg' },
  { id: '22', logo: '/logos/xinference-color.svg' },
  { id: '23', logo: '/logos/mcp.svg' },
  { id: '24', logo: '/logos/jina.svg' },
  { id: '25', logo: '/logos/searchapi.svg' },
  { id: '26', logo: '/logos/doc2x-color.svg' },
  { id: '27', logo: '/logos/bocha.png' },
  { id: '28', logo: '/logos/alibabacloud-color.svg' },
  { id: '29', logo: '/logos/tencentcloud-color.svg' },
  { id: '30', logo: '/logos/MongoDB.svg' },
  { id: '31', logo: '/logos/MySQL.svg' },
  { id: '32', logo: '/logos/OceanBase.svg' },
  { id: '33', logo: '/logos/redis.svg' },
  { id: '34', logo: '/logos/github.svg' },
  { id: '35', logo: '/logos/arxiv_.png' },
  { id: '36', logo: '/logos/飞书.svg' },
  { id: '37', logo: '/logos/钉钉.svg' },
  { id: '38', logo: '/logos/企业微信.svg' }
];
import { CompanyScrollRight, CompanyScrollLeft } from './CompanyScroll';

// 图标映射
const iconMap = {
  technology: Zap,
  enterprise: Award,
  education: Users,
  startup: ExternalLink
};

interface PartnersProps {
  variant?: 'full' | 'compact' | 'featured';
  showCategories?: boolean;
  maxItems?: number;
}

export function Partners({ 
  variant = 'full', 
  showCategories = true, 
  maxItems 
}: PartnersProps) {
  const displayPartners = maxItems ? partners.slice(0, maxItems) : partners;
  const featuredPartners = partners.filter(p => p.featured);
  
  // Add this missing state declaration
  const [isPaused, setIsPaused] = useState(false);
  
  // 重新排列顺序：让OpenAI在中间位置，Anthropic在其左边
  const reorderedPartners = [
    partners.find(p => p.id === '2'), // Anthropic
    partners.find(p => p.id === '1'), // OpenAI
    ...partners.filter(p => p.id !== '1' && p.id !== '2') // 显示所有其他合作伙伴
  ].filter(Boolean) as Partner[];
  
  const partnersToShow = variant === 'featured' ? featuredPartners : (variant === 'compact' ? reorderedPartners : displayPartners);

  if (variant === 'compact') {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    
    // 状态管理 - 使用CompanyScroll的稳定实现
    // 从环境变量读取滚动速度
    const scrollSpeed = parseInt(process.env.NEXT_PUBLIC_CARROUSEL_SCROLL_SPEED_LEFT || '15');
    const stateRef = useRef({
      speed: scrollSpeed / 15,           // 滚动速度，减慢速度提升用户体验
      isRunning: true,    // 是否运行
      direction: -1,      // 1: 向右, -1: 向左（改为向左滚动）
      position: 0,        // 当前位置
      itemWidth: 200,     // 单个项目宽度
      itemsCount: simplePartners.length, // 项目数量
      totalWidth: 0,      // 总宽度(原始项目)
      lastFrameTime: 0,   // 上一帧时间戳
      isInitialized: false // 是否完成初始化
    });

    // 入场动画检测
    useEffect(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry && entry.isIntersecting) {
            setIsVisible(true);
          }
        },
        { threshold: 0.1 }
      );

      if (containerRef.current) {
        observer.observe(containerRef.current);
      }

      return () => observer.disconnect();
    }, []);

    // 渐进式创建合作伙伴项 - 避免一次性DOM操作过多
    const createItemsProgressive = useCallback((index = 0) => {
      const track = scrollRef.current;
      if (!track) return;
      
      if (index >= simplePartners.length * 2) { // 原始项+复制项
        // 所有项目创建完成后计算尺寸并开始动画
        const firstItem = track.querySelector('.partner-item') as HTMLElement;
         if (firstItem) {
           stateRef.current.itemWidth = firstItem.offsetWidth + 32; // 包含margin
          stateRef.current.totalWidth = stateRef.current.itemWidth * stateRef.current.itemsCount;
          stateRef.current.isInitialized = true;
        }
        return;
      }
      
      // 创建单个项目
    const partner = simplePartners[index % simplePartners.length];
    if (!partner) return;
    
    const item = document.createElement('div');
    item.className = 'partner-item flex-shrink-0 flex items-center justify-center p-3 mx-4 rounded-lg';
    item.innerHTML = `
      <div class="w-24 h-12 relative">
        <img
          src="${partner.logo}"
          alt="Partner ${partner.id}"
          class="w-full h-full object-contain filter"
          loading="lazy"
        />
      </div>
    `;
      track.appendChild(item);
      
      // 下一帧继续创建，避免阻塞主线程
      requestAnimationFrame(() => createItemsProgressive(index + 1));
    }, []);

    // 优化的动画循环
    const animate = useCallback((timestamp: number) => {
      const state = stateRef.current;
      const track = scrollRef.current;
      
      // 未初始化完成不执行动画
      if (!state.isInitialized || !track) {
        requestAnimationFrame(animate);
        return;
      }
      
      // 计算时间差
      if (!state.lastFrameTime) state.lastFrameTime = timestamp;
      const deltaTime = timestamp - state.lastFrameTime;
      const frameInterval = 16; // 约60fps
      
      if (deltaTime >= frameInterval) {
        if (state.isRunning) {
          // 计算移动距离
          const moveDistance = (state.speed * deltaTime) / frameInterval;
          state.position += state.direction * moveDistance;
          
          // 循环逻辑
          if (state.position >= state.totalWidth) {
            state.position -= state.totalWidth;
          } else if (state.position <= 0) {
            state.position += state.totalWidth;
          }
          
          // 应用位置
          track.style.transform = `translateX(-${state.position}px)`;
        }
        // 无论是否运行都要更新时间戳，避免暂停后恢复时跳跃
        state.lastFrameTime = timestamp;
      }
      
      requestAnimationFrame(animate);
    }, []);

    // 初始化和动画启动
    useEffect(() => {
      if (!isVisible || !scrollRef.current) return;
      
      // 清空容器
      scrollRef.current.innerHTML = '';
      stateRef.current.isInitialized = false;
      stateRef.current.position = 0;
      stateRef.current.lastFrameTime = 0;
      
      // 使用requestIdleCallback在浏览器空闲时开始创建
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          createItemsProgressive();
          requestAnimationFrame(animate);
        });
      } else {
        // 降级处理
        setTimeout(() => {
          createItemsProgressive();
          requestAnimationFrame(animate);
        }, 100);
      }
    }, [isVisible]);

    // 窗口大小变化处理 - 使用CompanyScroll的稳定逻辑
    useEffect(() => {
      const handleResize = () => {
        const state = stateRef.current;
        const track = scrollRef.current;
        if (!state.isInitialized || !track) return;
        
        const ratio = state.position / state.totalWidth;
        // 清空并重新渐进式创建项目
        track.innerHTML = '';
        state.isInitialized = false;
        createItemsProgressive();
        // 恢复位置比例
        state.position = ratio * state.totalWidth;
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 鼠标悬停暂停功能
    const handleMouseEnter = () => {
      stateRef.current.isRunning = false;
    };
    
    const handleMouseLeave = () => {
      stateRef.current.isRunning = true;
    };
    
    return (
      <section className="py-8 bg-gradient-to-r from-gray-50 to-blue-50/30 dark:from-gray-900 dark:to-gray-800/30 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">生态集成伙伴</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">携手全球领先科技企业，共建开放AI技术生态体系</p>
          </div>
        </div>
        
        {/* 合作伙伴滚动区域 */}
        <div 
          ref={containerRef}
          className={`relative overflow-hidden w-4/5 mx-auto mb-8 ${isVisible ? 'opacity-100' : 'opacity-0'} transition-opacity duration-600`}
        >
          {/* 渐变遮罩层已移除 */}
          
          {/* 滚动容器 */}
          <div 
            ref={scrollRef}
            className="flex px-4"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{
              willChange: 'transform',
              backfaceVisibility: 'hidden',
              perspective: '1000px',
              transform: 'translateZ(0)' // 强制硬件加速
            }}
          >
            {/* 项目将通过JavaScript动态生成 */}
          </div>
        </div>
        
        {/* 公司图标滚动区域 - 使用独立组件 */}
        <CompanyScrollRight />
      </section>
    );
  }

  return (
    <section className="py-12 sm:py-16 bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-700/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* 标题区域 */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              合作伙伴
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              与全球领先的技术公司和企业合作，共同推动AI技术的发展和应用
            </p>
          </motion.div>
        </div>

        {/* 特色合作伙伴 */}
        {variant === 'full' && (
          <div className="mb-12">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 text-center">核心合作伙伴</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredPartners.map((partner, index) => (
                <motion.div
                  key={partner.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700"
                >
                  <a
                    href={partner.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 relative mr-4">
                        <Image
                          src={partner.logo}
                          alt={partner.name}
                          fill
                          className="object-contain"
                          sizes="48px"
                          unoptimized
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                          {partner.name}
                        </h4>
                        <div className="flex items-center mt-1">
                          {React.createElement(iconMap[partner.category], {
                            className: "w-3 h-3 text-gray-400 dark:text-gray-500 mr-1"
                          })}
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {categoryLabels[partner.category]}
                          </span>
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                      {partner.description}
                    </p>
                  </a>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* 所有合作伙伴网格 */}
        {variant === 'full' && (
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 text-center">生态伙伴</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
              {partners.filter(p => !p.featured).map((partner, index) => (
                <motion.a
                  key={partner.id}
                  href={partner.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className="group bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-700"
                >
                  <div className="w-full h-16 relative mb-3 transition-all duration-300">
                    <Image
                      src={partner.logo}
                      alt={partner.name}
                      fill
                      className="object-contain"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                      unoptimized
                    />
                  </div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white text-center group-hover:text-blue-600 transition-colors">
                    {partner.name}
                  </h4>
                </motion.a>
              ))}
            </div>
          </div>
        )}

        {/* 简化版本 - 仅显示logo */}
        {variant === 'featured' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredPartners.map((partner, index) => (
              <motion.a
                key={partner.id}
                href={partner.website}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700 text-center"
              >
                <div className="w-20 h-20 relative mx-auto mb-4 transition-all duration-300">
                  <Image
                    src={partner.logo}
                    alt={partner.name}
                    fill
                    className="object-contain"
                    sizes="80px"
                    unoptimized
                  />
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                  {partner.name}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                  {partner.description}
                </p>
              </motion.a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// 导出默认配置的组件变体
export const PartnersCompact = () => <Partners variant="compact" maxItems={6} />;
export const PartnersFeatured = () => <Partners variant="featured" />;
export const PartnersFull = () => <Partners variant="full" />;