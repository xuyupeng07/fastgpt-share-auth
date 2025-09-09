"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { UsersTable } from "@/components/admin/users-table"
import { ConsumptionTable } from "@/components/admin/consumption-table"
import { RechargeTable } from "@/components/admin/recharge-table"
import { Users, Activity, CreditCard, Workflow, FolderTree } from "lucide-react"
import WorkflowsTable from "@/components/admin/workflows-table"
import { CategoriesTable } from "@/components/admin/categories-table"


export function AdminTabs() {
  return (
    <Tabs defaultValue="workflows" className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="workflows" className="flex items-center space-x-2">
          <Workflow className="h-4 w-4" />
          <span>工作流管理</span>
        </TabsTrigger>
        <TabsTrigger value="categories" className="flex items-center space-x-2">
          <FolderTree className="h-4 w-4" />
          <span>分类管理</span>
        </TabsTrigger>
        <TabsTrigger value="users" className="flex items-center space-x-2">
          <Users className="h-4 w-4" />
          <span>用户管理</span>
        </TabsTrigger>
        <TabsTrigger value="consumption" className="flex items-center space-x-2">
          <Activity className="h-4 w-4" />
          <span>消费记录</span>
        </TabsTrigger>
        <TabsTrigger value="recharge" className="flex items-center space-x-2">
          <CreditCard className="h-4 w-4" />
          <span>充值记录</span>
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="workflows" className="mt-6">
        <WorkflowsTable />
      </TabsContent>
      
      <TabsContent value="categories" className="mt-6">
        <CategoriesTable />
      </TabsContent>
      
      <TabsContent value="users" className="mt-6">
        <UsersTable />
      </TabsContent>
      
      <TabsContent value="consumption" className="mt-6">
        <ConsumptionTable />
      </TabsContent>
      
      <TabsContent value="recharge" className="mt-6">
        <RechargeTable />
      </TabsContent>
    </Tabs>
  )
}