"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Badge } from "@workspace/ui/components/badge"
import { toast } from 'sonner'

interface Config {
  siteName: string
  apiBaseUrl: string
  maxTokens: number
  defaultModel: string
  enableRegistration: boolean
  maintenanceMode: boolean
  systemMessage: string
}

export function ConfigPanel() {
  const [config, setConfig] = useState<Config>({
    siteName: 'FastGPT',
    apiBaseUrl: 'http://localhost:3000',
    maxTokens: 4000,
    defaultModel: 'gpt-3.5-turbo',
    enableRegistration: true,
    maintenanceMode: false,
    systemMessage: '欢迎使用FastGPT系统'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)


  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/config')
      if (response.ok) {
        const data = await response.json()
        setConfig(data)
      }
    } catch (error) {
      console.error('获取配置失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      })

      if (response.ok) {
        toast.success('配置保存成功')
      } else {
        toast.error('配置保存失败')
      }
    } catch (error) {
      console.error('保存配置失败:', error)
      toast.error('配置保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof Config, value: string | number | boolean) => {
    setConfig(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>系统配置</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">加载中...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Basic Settings */}
      <Card>
        <CardHeader>
          <CardTitle>基础设置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="siteName">站点名称</Label>
              <Input
                id="siteName"
                value={config.siteName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  handleInputChange('siteName', e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiBaseUrl">API基础URL</Label>
              <Input
                id="apiBaseUrl"
                value={config.apiBaseUrl}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  handleInputChange('apiBaseUrl', e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxTokens">最大Token数</Label>
              <Input
                id="maxTokens"
                type="number"
                value={config.maxTokens}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  handleInputChange('maxTokens', parseInt(e.target.value) || 0)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultModel">默认模型</Label>
              <Input
                id="defaultModel"
                value={config.defaultModel}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  handleInputChange('defaultModel', e.target.value)
                }
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="systemMessage">系统消息</Label>
            <Input
              id="systemMessage"
              value={config.systemMessage}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                handleInputChange('systemMessage', e.target.value)
              }
              placeholder="系统欢迎消息或公告"
            />
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>系统状态</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>用户注册</Label>
                <p className="text-sm text-muted-foreground">允许新用户注册账户</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={config.enableRegistration ? 'default' : 'secondary'}>
                  {config.enableRegistration ? '开启' : '关闭'}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleInputChange('enableRegistration', !config.enableRegistration)}
                >
                  {config.enableRegistration ? '关闭' : '开启'}
                </Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>维护模式</Label>
                <p className="text-sm text-muted-foreground">开启后系统将进入维护状态</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={config.maintenanceMode ? 'destructive' : 'default'}>
                  {config.maintenanceMode ? '维护中' : '正常'}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleInputChange('maintenanceMode', !config.maintenanceMode)}
                >
                  {config.maintenanceMode ? '关闭维护' : '开启维护'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle>系统信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">运行中</div>
              <div className="text-sm text-muted-foreground">系统状态</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">v1.0.0</div>
              <div className="text-sm text-muted-foreground">系统版本</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">24h</div>
              <div className="text-sm text-muted-foreground">运行时间</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? '保存中...' : '保存配置'}
        </Button>

      </div>
    </div>
  )
}