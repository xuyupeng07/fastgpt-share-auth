import connectDB from '@/lib/mongodb'
import mongoose from 'mongoose'

// 敏感词模型（复用API中的模型定义）
interface ISensitiveWord {
  word: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

const SensitiveWordSchema = new mongoose.Schema<ISensitiveWord>({
  word: { type: String, required: true, unique: true },
  category: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

const SensitiveWordModel = (mongoose.models.SensitiveWord as mongoose.Model<ISensitiveWord>) || mongoose.model<ISensitiveWord>('SensitiveWord', SensitiveWordSchema)

// 缓存敏感词列表，避免频繁查询数据库
let cachedSensitiveWords: string[] = []
let lastCacheUpdate = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5分钟缓存

/**
 * 从数据库获取敏感词列表
 */
export async function getSensitiveWords(): Promise<string[]> {
  try {
    const now = Date.now()
    
    // 如果缓存还有效，直接返回缓存
    if (cachedSensitiveWords.length > 0 && now - lastCacheUpdate < CACHE_DURATION) {
      return cachedSensitiveWords
    }
    
    await connectDB()
    const words = await SensitiveWordModel.find({}, 'word').lean().exec()
    
    // 更新缓存
    cachedSensitiveWords = words.map((item: any) => item.word)
    lastCacheUpdate = now
    
    return cachedSensitiveWords
  } catch (error) {
    console.error('获取敏感词列表失败:', error)
    // 如果数据库查询失败，返回缓存的数据或空数组
    return cachedSensitiveWords
  }
}

/**
 * 检查文本是否包含敏感词
 * @param text 要检查的文本
 * @returns 如果包含敏感词返回true，否则返回false
 */
export async function containsSensitiveWords(text: string): Promise<boolean> {
  if (!text || typeof text !== 'string') {
    return false
  }
  
  try {
    const sensitiveWords = await getSensitiveWords()
    
    // 转换为小写进行比较，提高检测准确性
    const lowerText = text.toLowerCase()
    
    return sensitiveWords.some(word => {
      const lowerWord = word.toLowerCase()
      return lowerText.includes(lowerWord)
    })
  } catch (error) {
    console.error('敏感词检测失败:', error)
    // 检测失败时，为了安全起见，返回false（不阻止）
    return false
  }
}

/**
 * 检查文本并返回匹配的敏感词
 * @param text 要检查的文本
 * @returns 匹配的敏感词数组
 */
export async function findSensitiveWords(text: string): Promise<string[]> {
  if (!text || typeof text !== 'string') {
    return []
  }
  
  try {
    const sensitiveWords = await getSensitiveWords()
    const lowerText = text.toLowerCase()
    const foundWords: string[] = []
    
    sensitiveWords.forEach(word => {
      const lowerWord = word.toLowerCase()
      if (lowerText.includes(lowerWord)) {
        foundWords.push(word)
      }
    })
    
    return foundWords
  } catch (error) {
    console.error('敏感词查找失败:', error)
    return []
  }
}

/**
 * 清除敏感词缓存（在敏感词更新时调用）
 */
export function clearSensitiveWordsCache(): void {
  cachedSensitiveWords = []
  lastCacheUpdate = 0
}

/**
 * 过滤文本中的敏感词（用*替换）
 * @param text 要过滤的文本
 * @param replacement 替换字符，默认为*
 * @returns 过滤后的文本
 */
export async function filterSensitiveWords(text: string, replacement: string = '*'): Promise<string> {
  if (!text || typeof text !== 'string') {
    return text
  }
  
  try {
    const sensitiveWords = await getSensitiveWords()
    let filteredText = text
    
    sensitiveWords.forEach(word => {
      const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
      filteredText = filteredText.replace(regex, replacement.repeat(word.length))
    })
    
    return filteredText
  } catch (error) {
    console.error('敏感词过滤失败:', error)
    return text
  }
}