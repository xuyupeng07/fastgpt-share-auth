"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { UsersTable } from "@/components/admin/users-table"
import { ConsumptionTable } from "@/components/admin/consumption-table"
import { RechargeTable } from "@/components/admin/recharge-table"


export function AdminTabs() {
  return (
    <Tabs defaultValue="users" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="users">用户管理</TabsTrigger>
        <TabsTrigger value="consumption">消费记录</TabsTrigger>
        <TabsTrigger value="recharge">充值记录</TabsTrigger>
      </TabsList>
      
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