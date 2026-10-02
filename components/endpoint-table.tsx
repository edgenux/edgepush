"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { TablePanel } from "@/components/shell/table-panel"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Loader2, Eye, Power, Trash, Pencil, Zap, Plus, KeyRound } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useState } from "react"
import { EndpointDialog } from "@/components/endpoint-dialog"
import { Endpoint } from "@/lib/db/schema/endpoints"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/constants/endpoints"
import { Channel } from "@/lib/channels"
import { EndpointExample } from "@/components/endpoint-example"
import { useRouter } from "next/navigation"
import { deleteEndpoint, toggleEndpointStatus, testEndpoint } from "@/lib/services/endpoints"
import { Checkbox } from "@/components/ui/checkbox"
import { CreateEndpointGroupDialog } from "./create-endpoint-group-dialog"
import { EmptyScreen } from "@/components/shell/empty-screen"

interface EndpointTableProps {
  endpoints: Endpoint[]
  channels: Channel[]
  onEndpointsUpdate: () => void
  onGroupCreated: () => void
}

export function EndpointTable({ 
  endpoints,
  channels,
  onEndpointsUpdate,
  onGroupCreated,
}: EndpointTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [endpointToDelete, setEndpointToDelete] = useState<Endpoint | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isTesting, setIsTesting] = useState<string | null>(null)
  const { toast } = useToast()
  const [viewExample, setViewExample] = useState<Endpoint | null>(null)
  const router = useRouter()
  const [selectedEndpoints, setSelectedEndpoints] = useState<Endpoint[]>([])
  const [createGroupDialogOpen, setCreateGroupDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const filteredEndpoints = endpoints?.filter((endpoint) => {
    if (!searchQuery.trim()) return true
    
    const channel = channels.find(c => c.id === endpoint.channelId)
    const searchContent = [
      endpoint.id,
      endpoint.name,
      endpoint.rule,
      channel?.name,
    ].join(" ").toLowerCase()
    
    const keywords = searchQuery.toLowerCase().split(/\s+/)
    return keywords.every(keyword => searchContent.includes(keyword))
  }) ?? []

  const handleDelete = async () => {
    if (!endpointToDelete) return
    
    try {
      setIsDeleting(true)
      await deleteEndpoint(endpointToDelete.id)
      onEndpointsUpdate()
      toast({ description: "接口已删除" })
      router.refresh()
      setDeleteDialogOpen(false)
    } catch (error) {
      console.error('Error deleting endpoint:', error)
      toast({ 
        variant: "destructive",
        description: "删除失败，请重试" 
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleToggleStatus = async (id: string) => {
    try {
      setIsLoading(id)
      await toggleEndpointStatus(id)
      
      onEndpointsUpdate()
      
      toast({
        description: "推送接口状态已更新",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        description: error instanceof Error ? error.message : "操作失败",
      })
    } finally {
      setIsLoading(null)
    }
  }

  async function handleTest(endpoint: Endpoint) {
    setIsTesting(endpoint.id)
    try {
      await testEndpoint(
        endpoint.id,
        endpoint.rule,
      )
      toast({
        title: "测试成功",
        description: "消息已成功推送",
      })
    } catch (error) {
      console.error('Test endpoint error:', error)
      toast({
        title: "测试失败",
        description: error instanceof Error ? error.message : "请检查配置是否正确",
        variant: "destructive",
      })
    } finally {
      setIsTesting(null)
    }
  }

  const getStatusBadgeClass = (status: Endpoint["status"]) => {
    return STATUS_COLORS[status]
  }

  const toggleEndpointSelection = (endpoint: Endpoint) => {
    setSelectedEndpoints(prev => {
      const isSelected = prev.some(e => e.id === endpoint.id)
      if (isSelected) {
        return prev.filter(e => e.id !== endpoint.id)
      } else {
        return [...prev, endpoint]
      }
    })
  }

  const handleCreateGroup = () => {
    if (selectedEndpoints.length === 0) {
      toast({ 
        variant: "destructive", 
        description: "请至少选择一个接口" 
      })
      return
    }
    setCreateGroupDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="kumo-toolbar">
        <Input
          placeholder="搜索接口..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-9 w-full sm:max-w-sm"
        />
        <div className="kumo-toolbar-actions">
          {selectedEndpoints.length > 0 && (
            <Button 
              size="sm" 
              variant="outline" 
              className="gap-2" 
              onClick={handleCreateGroup}
            >
              <Plus className="h-4 w-4 shrink-0" />
              <span className="truncate">创建接口组 ({selectedEndpoints.length})</span>
            </Button>
          )}
          <EndpointDialog 
            channels={channels}
            onSuccess={onEndpointsUpdate}
          />
        </div>
      </div>

      {filteredEndpoints.length === 0 && !searchQuery ? (
        <EmptyScreen
          icon={<KeyRound className="h-5 w-5" />}
          headline="还没有接口"
          description="先创建一个推送接口，配好渠道和消息模板后就能发请求。"
        />
      ) : (
      <TablePanel minWidthClass="min-w-[48rem]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[44px]"></TableHead>
              <TableHead className="hidden lg:table-cell">ID</TableHead>
              <TableHead>名称</TableHead>
              <TableHead className="hidden sm:table-cell">推送渠道</TableHead>
              <TableHead className="hidden md:table-cell">消息模版</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="hidden lg:table-cell">创建时间</TableHead>
              <TableHead className="w-[56px] sm:w-[80px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEndpoints.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  未找到匹配的接口
                </TableCell>
              </TableRow>
            ) : (
              filteredEndpoints.map((endpoint) => {
                const channel = channels.find(c => c.id === endpoint.channelId)
                return (
                  <TableRow key={endpoint.id}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedEndpoints.some(e => e.id === endpoint.id)}
                        onCheckedChange={() => toggleEndpointSelection(endpoint)}
                      />
                    </TableCell>
                    <TableCell className="hidden max-w-[8rem] truncate font-mono text-xs lg:table-cell">{endpoint.id}</TableCell>
                    <TableCell className="max-w-[9rem] truncate font-medium sm:max-w-none">{endpoint.name}</TableCell>
                    <TableCell className="hidden max-w-[8rem] truncate sm:table-cell">{channel?.name}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Popover>
                        <PopoverTrigger className="text-left">
                          <code className="block max-w-[12rem] truncate font-mono text-sm hover:text-foreground">
                            {endpoint.rule}
                          </code>
                        </PopoverTrigger>
                        <PopoverContent className="w-[min(400px,calc(100vw-2rem))]">
                          <pre className="font-mono text-sm whitespace-pre-wrap break-all bg-muted p-2 rounded-md">
                            {JSON.stringify(JSON.parse(endpoint.rule || "{}"), null, 2)}
                          </pre>
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                    <TableCell>
                      <span className={getStatusBadgeClass(endpoint.status)}>
                        {STATUS_LABELS[endpoint.status]}
                      </span>
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap lg:table-cell">{endpoint.createdAt}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setViewExample(endpoint)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            查看示例
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleTest(endpoint)}
                            disabled={isTesting === endpoint.id || endpoint.status !== 'active'}
                          >
                            {isTesting === endpoint.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Zap className="mr-2 h-4 w-4" />
                            )}
                            测试推送
                          </DropdownMenuItem>
                          <EndpointDialog 
                            mode="edit"
                            endpoint={endpoint}
                            channels={channels}
                            onSuccess={onEndpointsUpdate}
                            icon={<Pencil className="h-4 w-4 mr-2" />}
                          />
                          <DropdownMenuItem
                            disabled={isLoading === endpoint.id}
                            onClick={() => handleToggleStatus(endpoint.id)}
                          >
                            <Power className="h-4 w-4 mr-2" />
                            {endpoint.status === 'active' ? '禁用' : '启用'}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-kumo-text-danger"
                            onClick={() => {
                              setEndpointToDelete(endpoint)
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            删除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
      </TablePanel>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除接口 {endpointToDelete?.name} 吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={handleDelete}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              确认
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EndpointExample
        endpoint={viewExample}
        open={!!viewExample}
        onOpenChange={(open) => !open && setViewExample(null)}
      />

      <CreateEndpointGroupDialog 
        open={createGroupDialogOpen} 
        onOpenChange={setCreateGroupDialogOpen}
        selectedEndpoints={selectedEndpoints}
        onSuccess={() => {
          setSelectedEndpoints([])
          onGroupCreated()
        }}
      />
    </div>
  )
} 