"use client"

import { useState } from "react"
import { Loader2, Trash, Eye, Power, Send, Layers } from "lucide-react"

import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TablePanel } from "@/components/shell/table-panel"
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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { EndpointGroupWithEndpoints } from "@/types/endpoint-group"
import { deleteEndpointGroup, toggleEndpointGroupStatus, testEndpointGroup } from "@/lib/services/endpoint-groups"
import { formatDate } from "@/lib/utils"
import { EmptyScreen } from "@/components/shell/empty-screen"
import { EndpointGroupExample } from "./endpoint-group-example"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"

interface EndpointGroupTableProps {
  groups: EndpointGroupWithEndpoints[]
  onGroupsUpdate: () => void
}

export function EndpointGroupTable({ groups, onGroupsUpdate }: EndpointGroupTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [groupToDelete, setGroupToDelete] = useState<EndpointGroupWithEndpoints | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [viewExample, setViewExample] = useState<EndpointGroupWithEndpoints | null>(null)
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [isTesting, setIsTesting] = useState<string | null>(null)
  const { toast } = useToast()
  
  const filteredGroups = groups.filter((group) => {
    if (!searchQuery.trim()) return true
    
    const searchContent = [
      group.id,
      group.name,
      ...group.endpoints.map(e => e.name)
    ].join(" ").toLowerCase()
    
    const keywords = searchQuery.toLowerCase().split(/\s+/)
    return keywords.every(keyword => searchContent.includes(keyword))
  })
  
  const handleDelete = async () => {
    if (!groupToDelete) return
    
    try {
      setIsDeleting(true)
      await deleteEndpointGroup(groupToDelete.id)
      onGroupsUpdate()
      toast({ description: "接口组已删除" })
      setDeleteDialogOpen(false)
    } catch (error) {
      console.error('Error deleting endpoint group:', error)
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
      await toggleEndpointGroupStatus(id)
      
      onGroupsUpdate()
      toast({
        description: "接口组状态已更新",
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
  
  const handleTest = async (group: EndpointGroupWithEndpoints) => {
    if (group.endpoints.length === 0) {
      toast({
        variant: "destructive",
        description: "接口组内没有接口，无法测试"
      })
      return
    }

    // 检查是否所有接口都有规则
    const hasInvalidRule = group.endpoints.some(e => !e.rule)
    if (hasInvalidRule) {
      toast({
        variant: "destructive",
        description: "接口组中存在未配置规则的接口"
      })
      return
    }

    setIsTesting(group.id)
    try {
      const result = await testEndpointGroup(group)
      toast({
        title: "测试结果",
        description: `成功: ${result.successCount}, 失败: ${result.failedCount}`,
        variant: result.failedCount > 0 ? "destructive" : "default"
      })
    } catch (error) {
      toast({
        variant: "destructive",
        description: error instanceof Error ? error.message : "测试失败"
      })
    } finally {
      setIsTesting(null)
    }
  }
  
  const getStatusBadgeClass = (status: "active" | "inactive") => {
    return status === "active"
      ? "kumo-badge kumo-badge-success"
      : "kumo-badge kumo-badge-neutral"
  }
  
  return (
    <div className="space-y-4">
      <div className="kumo-toolbar">
        <Input
          placeholder="搜索接口组..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-9 w-full sm:max-w-sm"
        />
      </div>

      {filteredGroups.length === 0 && !searchQuery ? (
        <EmptyScreen
          icon={<Layers className="h-5 w-5" />}
          headline="还没有接口组"
          description="在接口列表里勾选多个接口，就可以把它们合成一组一起推送。"
        />
      ) : (
      <TablePanel minWidthClass="min-w-[30rem]">
          <TableHeader>
            <TableRow>
              <TableHead className="hidden md:table-cell">ID</TableHead>
              <TableHead>名称</TableHead>
              <TableHead className="whitespace-nowrap">接口数</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="hidden lg:table-cell">创建时间</TableHead>
              <TableHead className="w-[56px] sm:w-[80px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredGroups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  没有找到接口组
                </TableCell>
              </TableRow>
            ) : (
              filteredGroups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell className="hidden max-w-[8rem] truncate font-mono text-xs md:table-cell">
                    {group.id}
                  </TableCell>
                  <TableCell className="max-w-[10rem] truncate font-medium sm:max-w-none">{group.name}</TableCell>
                  <TableCell>{group.endpoints.length}</TableCell>
                  <TableCell>
                    <span className={getStatusBadgeClass(group.status)}>
                      {group.status === "active" ? "启用" : "禁用"}
                    </span>
                  </TableCell>
                  <TableCell className="hidden whitespace-nowrap lg:table-cell">{formatDate(group.createdAt)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewExample(group)}>
                          <Eye className="mr-2 h-4 w-4" />
                          查看示例
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleTest(group)}
                          disabled={isTesting === group.id || group.status === "inactive"}
                        >
                          {isTesting === group.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="mr-2 h-4 w-4" />
                          )}
                          测试推送
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleToggleStatus(group.id)}
                          disabled={isLoading === group.id}
                        >
                          <Power className="mr-2 h-4 w-4" />
                          {isLoading === group.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            group.status === "active" ? "禁用" : "启用"
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => {
                            setGroupToDelete(group)
                            setDeleteDialogOpen(true)
                          }}
                          className="text-kumo-text-danger"
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
      </TablePanel>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除接口组 {groupToDelete?.name} 吗？此操作不会删除组内的接口，但无法撤销。
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
      
      <EndpointGroupExample
        group={viewExample}
        open={!!viewExample}
        onOpenChange={(open) => !open && setViewExample(null)}
      />
    </div>
  )
} 