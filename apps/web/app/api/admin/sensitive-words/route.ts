import { NextRequest, NextResponse } from 'next/server'
import { validateToken } from '@/lib/jwt'
import connectDB from '@/lib/mongodb'
import mongoose from 'mongoose'
import { clearSensitiveWordsCache } from '@/lib/sensitive-words'

// 敏感词模型
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

// 验证管理员权限的辅助函数
async function verifyAdminAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: '未提供认证令牌', status: 401 }
  }

  const token = authHeader.substring(7)
  const result = await validateToken(token)
  
  if (!result.success) {
    return { error: '认证失败', status: 401 }
  }

  // 这里需要检查用户是否为管理员，暂时简化处理
  return { success: true, userId: result.data?.userId }
}

// GET - 获取所有敏感词
export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const authResult = await verifyAdminAuth(request)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    await connectDB()
    const words = await SensitiveWordModel.find({}).sort({ createdAt: -1 }).lean()
    
    return NextResponse.json({ 
      success: true, 
      data: words.map((word: any) => ({
        id: word._id.toString(),
        word: word.word,
        category: word.category,
        createdAt: word.createdAt,
        updatedAt: word.updatedAt
      }))
    })
  } catch (error) {
    console.error('获取敏感词失败:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}

// POST - 添加敏感词
export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const authResult = await verifyAdminAuth(request)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { word, category } = await request.json()
    
    if (!word || !category) {
      return NextResponse.json({ error: '敏感词和分类不能为空' }, { status: 400 })
    }

    await connectDB()
    
    // 检查是否已存在
    const existing = await SensitiveWordModel.findOne({ word: word.trim() })
    if (existing) {
      return NextResponse.json({ error: '该敏感词已存在' }, { status: 400 })
    }
    
    const newWord = new SensitiveWordModel({
      word: word.trim(),
      category: category.trim()
    })
    
    const result = await newWord.save()
    
    // 清除缓存，确保敏感词检测使用最新数据
    clearSensitiveWordsCache()
    
    return NextResponse.json({ 
      success: true, 
      data: {
        id: result._id.toString(),
        word: result.word,
        category: result.category,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt
      }
    })
  } catch (error) {
    console.error('添加敏感词失败:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}

// PUT - 更新敏感词
export async function PUT(request: NextRequest) {
  try {
    // 验证管理员权限
    const authResult = await verifyAdminAuth(request)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { id, word, category } = await request.json()
    
    if (!id || !word || !category) {
      return NextResponse.json({ error: 'ID、敏感词和分类不能为空' }, { status: 400 })
    }

    await connectDB()
    
    // 检查是否存在同名的其他记录
    const existing = await SensitiveWordModel.findOne({ 
      word: word.trim(), 
      _id: { $ne: id } 
    })
    if (existing) {
      return NextResponse.json({ error: '该敏感词已存在' }, { status: 400 })
    }
    
    const result = await SensitiveWordModel.findByIdAndUpdate(
      id,
      { 
        word: word.trim(),
        category: category.trim(),
        updatedAt: new Date()
      },
      { new: true }
    )
    
    if (!result) {
      return NextResponse.json({ error: '敏感词不存在' }, { status: 404 })
    }
    
    // 清除缓存，确保敏感词检测使用最新数据
    clearSensitiveWordsCache()
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('更新敏感词失败:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}

// DELETE - 删除敏感词
export async function DELETE(request: NextRequest) {
  try {
    // 验证管理员权限
    const authResult = await verifyAdminAuth(request)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID不能为空' }, { status: 400 })
    }

    await connectDB()
    
    const result = await SensitiveWordModel.findByIdAndDelete(id)
    
    if (!result) {
      return NextResponse.json({ error: '敏感词不存在' }, { status: 404 })
    }
    
    // 清除缓存，确保敏感词检测使用最新数据
    clearSensitiveWordsCache()
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('删除敏感词失败:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}