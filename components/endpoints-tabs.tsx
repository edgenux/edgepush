"use client"

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Channel } from "@/lib/channels"
import { Endpoint } from "@/lib/db/schema/endpoints"
import { EndpointGroupWithEndpoints } from "@/types/endpoint-group"
import { getEndpointGroups } from "@/lib/services/endpoint-groups"
import { getEndpoints } from "@/lib/services/endpoints"
import { useToast } from "@/components/ui/use-toast"
import { EndpointTable } from "@/components/endpoint-table"
import { EndpointGroupTable } from "@/components/endpoint-group-table"
import { Spinner } from "@/components/shell/spinner"

export function EndpointsTabs({ initialEndpoints, channels }: { initialEndpoints: Endpoint[], channels: Channel[] }) {
  const [endpoints, setEndpoints] = useState<Endpoint[]>(initialEndpoints)
  const [groups, setGroups] = useState<EndpointGroupWithEndpoints[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("endpoints")
  const { toast } = useToast()

  const loadGroups = async () => {
    try {
      setLoading(true)
      const data = await getEndpointGroups()
      setGroups(data)
    } catch (error) {
      console.error('加载接口组失败:', error)
      toast({
        variant: "destructive",
        description: error instanceof Error ? error.message : "加载接口组失败"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadEndpoints = async () => {
    try {
      setLoading(true)
      const data = await getEndpoints() as Endpoint[]
      setEndpoints(data)
    } catch (error) {
      console.error('加载接口失败:', error)
      toast({
        variant: "destructive",
        description: error instanceof Error ? error.message : "加载接口失败"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    if (value === "groups") {
      loadGroups()
    } else {
      loadEndpoints()
    }
  }

  const switchToGroupsTab = () => {
    handleTabChange("groups")
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
      <TabsList className="h-auto w-full justify-start gap-1 rounded-none border-b bg-transparent p-0">
        <TabsTrigger
          value="endpoints"
          className="rounded-none border-b-2 border-transparent px-3 py-2 shadow-none data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
        >
          推送接口
        </TabsTrigger>
        <TabsTrigger
          value="groups"
          className="rounded-none border-b-2 border-transparent px-3 py-2 shadow-none data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
        >
          接口组
        </TabsTrigger>
      </TabsList>
      <TabsContent value="endpoints" className="mt-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : (
          <EndpointTable 
            endpoints={endpoints}
            onEndpointsUpdate={loadEndpoints}
            channels={channels}
            onGroupCreated={switchToGroupsTab}
          />
        )}
      </TabsContent>
      <TabsContent value="groups" className="mt-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : (
          <EndpointGroupTable 
            groups={groups}
            onGroupsUpdate={loadGroups}
          />
        )}
      </TabsContent>
    </Tabs>
  )
}
