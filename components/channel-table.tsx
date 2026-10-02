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
import { MoreHorizontal, Loader2, LayoutGrid } from "lucide-react"
import { useState, useEffect } from "react"
import { ChannelDialog } from "@/components/channel-dialog"
import { Channel, CHANNEL_LABELS } from "@/lib/channels"
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
import { useRouter } from "next/navigation"
import { deleteChannel } from "@/lib/services/channels"
import { EmptyScreen } from "@/components/shell/empty-screen"

interface ChannelTableProps {
  channels: Channel[]
}

export function ChannelTable({ channels }: ChannelTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [channelsState, setChannels] = useState(channels)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [channelToDelete, setChannelToDelete] = useState<Channel | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    setChannels(channels)
  }, [channels])

  const filteredChannels = channelsState.filter((channel) => {
    if (!searchQuery.trim()) return true
    
    const searchContent = [
      channel.id,
      channel.name,
      CHANNEL_LABELS[channel.type]
    ].join(" ").toLowerCase()
    
    const keywords = searchQuery.toLowerCase().split(/\s+/)
    return keywords.every(keyword => searchContent.includes(keyword))
  })

  const handleDelete = async () => {
    if (!channelToDelete) return
    
    try {
      setIsDeleting(true)
      await deleteChannel(channelToDelete.id)
      toast({ title: '删除成功' })
      router.refresh()
      setChannels(channelsState.filter(c => c.id !== channelToDelete.id))
      setDeleteDialogOpen(false)
    } catch (error) {
      console.error('Error deleting channel:', error)
      toast({ 
        title: '删除失败',
        variant: 'destructive'
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const getStatusBadgeClass = (status: Channel["status"]) => {
      return status === "active"
        ? "kumo-badge kumo-badge-success"
        : "kumo-badge kumo-badge-neutral"
  }

  const getStatusText = (status: Channel["status"]) => {
    return status === "active" ? "正常" : "禁用"
  }

  const getChannelText = (type: Channel["type"]) => {
    return CHANNEL_LABELS[type]
  }

  return (
    <div className="space-y-4">
      <div className="kumo-toolbar">
        <Input
          placeholder="搜索渠道..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-9 w-full sm:max-w-sm"
        />
        <div className="kumo-toolbar-actions">
          <ChannelDialog />
        </div>
      </div>

      {filteredChannels.length === 0 && !searchQuery ? (
        <EmptyScreen
          icon={<LayoutGrid className="h-5 w-5" />}
          headline="还没有渠道"
          description="先添加一个推送渠道，之后就可以为它创建接口。"
        />
      ) : (
      <TablePanel minWidthClass="min-w-[36rem]">
          <TableHeader>
            <TableRow>
              <TableHead className="hidden md:table-cell">ID</TableHead>
              <TableHead>名称</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="hidden lg:table-cell">创建时间</TableHead>
              <TableHead className="w-[56px] sm:w-[80px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredChannels.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  未找到匹配的渠道
                </TableCell>
              </TableRow>
            ) : (
              filteredChannels.map((channel) => (
                <TableRow key={channel.id}>
                  <TableCell className="hidden max-w-[8rem] truncate font-mono text-xs md:table-cell">{channel.id}</TableCell>
                  <TableCell className="max-w-[10rem] truncate font-medium sm:max-w-none">{channel.name}</TableCell>
                  <TableCell className="whitespace-nowrap">{getChannelText(channel.type)}</TableCell>
                  <TableCell>
                    <span className={getStatusBadgeClass(channel.status)}>
                      {getStatusText(channel.status)}
                    </span>
                  </TableCell>
                  <TableCell className="hidden whitespace-nowrap lg:table-cell">{channel.createdAt}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <ChannelDialog 
                          mode="edit"
                          channel={channel}
                        />
                        <DropdownMenuItem 
                          className="text-kumo-text-danger"
                          onClick={() => {
                            setChannelToDelete(channel)
                            setDeleteDialogOpen(true)
                          }}
                        >
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
              确定要删除渠道 {channelToDelete?.name} 吗？此操作无法撤销。
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
    </div>
  )
} 