'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
// Image import removed as it is not used

// 公司数据
const companies = [
  { id: '1', name: '阿里巴巴', logo: '/logos/阿里巴巴.svg', website: 'https://alibaba.com' },
  { id: '2', name: '中国电信', logo: '/logos/中国电信.svg', website: 'https://chinatelecom.com.cn' },
  { id: '3', name: '中国联通', logo: '/logos/中国联通.svg', website: 'https://chinaunicom.com.cn' },
  { id: '4', name: '宁德时代', logo: '/logos/宁德时代.svg', website: 'https://catl.com' },
  { id: '5', name: '希望软件', logo: '/logos/希望软件.svg', website: 'https://hope.com' },
  { id: '6', name: '企业微信', logo: '/logos/企业微信.svg', website: 'https://work.weixin.qq.com' },
  { id: '7', name: '钉钉', logo: '/logos/钉钉.svg', website: 'https://dingtalk.com' },
  { id: '8', name: '飞书', logo: '/logos/飞书.svg', website: 'https://feishu.cn' },
  { id: '9', name: 'AO史密斯', logo: '/logos/AO史密斯.png', website: 'https://aosmith.com.cn' },
  { id: '10', name: '华润啤酒', logo: '/logos/华润啤酒.png', website: 'https://crb.com.cn' },
  { id: '11', name: '天立教育', logo: '/logos/天立教育.png', website: 'https://tianli.com' },
  { id: '12', name: '广州华商学院', logo: '/logos/广州华商学院.png', website: 'https://gdhsc.edu.cn' },
  { id: '13', name: '香港教育大学', logo: '/logos/香港教育大学.png', website: 'https://eduhk.hk' }
];

interface CompanyScrollProps {
  direction?: 'left' | 'right';
  speed?: number;
  className?: string;
}

export function CompanyScroll({ 
  direction = 'right', 
  speed = 20, 
  className = '' 
}: CompanyScrollProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 状态管理 - 参考test.md的优化实现
  const stateRef = useRef({
    speed: speed / 10,           // 滚动速度，从参数读取并除以10适配动画帧率
    isRunning: true,    // 是否运行
    direction: direction === 'right' ? 1 : -1,      // 1: 向右, -1: 向左
    position: 0,        // 当前位置
    itemWidth: 200,     // 单个项目宽度
    itemsCount: companies.length, // 项目数量
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

  // 渐进式创建公司项 - 避免一次性DOM操作过多
  const createItemsProgressive = useCallback((index = 0) => {
    const track = scrollRef.current;
    if (!track) return;
    
    if (index >= companies.length * 2) { // 原始项+复制项
      // 所有项目创建完成后计算尺寸并开始动画
      const firstItem = track.querySelector('.company-item') as HTMLElement;
       if (firstItem) {
         stateRef.current.itemWidth = firstItem.offsetWidth + 32; // 包含margin
        stateRef.current.totalWidth = stateRef.current.itemWidth * stateRef.current.itemsCount;
        stateRef.current.isInitialized = true;
      }
      return;
    }
    
    // 创建单个项目
    const company = companies[index % companies.length];
    if (!company) return;
    
    const item = document.createElement('div');
      item.className = 'company-item flex-shrink-0 flex items-center justify-center p-3 mx-4 rounded-lg transition-all duration-300';
    item.innerHTML = `
        <div class="w-24 h-12 relative">
          <img
            src="${company.logo}"
            alt="${company.name}"
            class="w-full h-full object-contain"
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
  }, [isVisible, createItemsProgressive, animate]);

  // 窗口大小变化处理
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
  }, [createItemsProgressive]);

  // 鼠标悬停暂停功能
  const handleMouseEnter = () => {
    stateRef.current.isRunning = false;
  };
  
  const handleMouseLeave = () => {
    stateRef.current.isRunning = true;
  };
  
  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden w-4/5 mx-auto ${className} ${isVisible ? 'opacity-100' : 'opacity-0'} transition-opacity duration-600`}
    >
      {/* 渐变遮罩层已移除 */}
      
      {/* 滚动容器 */}
      <div 
        ref={scrollRef}
        className="flex py-4"
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
  );
}

// 导出不同方向的滚动组件
export const CompanyScrollRight = () => <CompanyScroll direction="right" speed={15} />;
export const CompanyScrollLeft = () => <CompanyScroll direction="left" speed={18} />;