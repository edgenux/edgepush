"use client"

import { LogOut } from "lucide-react"
import { signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface UserNavProps {
  user: {
    name?: string | null
    image?: string | null
    username?: string | null
  }
  variant?: "header" | "sidebar"
}

export function UserNav({ user, variant = "header" }: UserNavProps) {
  const router = useRouter()
  const name = user.name || user.username || "未知用户"
  const initials = name?.charAt(0).toUpperCase() || "U"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === "sidebar" ? (
          <Button
            variant="ghost"
            className="h-auto w-full justify-start gap-2 rounded-md px-2 py-1.5 font-medium"
          >
            <Avatar className="h-7 w-7">
              <AvatarImage src={user.image || ""} alt={name} />
              <AvatarFallback className="bg-kumo-recessed text-xs font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <span className="min-w-0 flex-1 truncate text-left text-sm font-medium">
              {name}
            </span>
          </Button>
        ) : (
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.image || ""} alt={name} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className={cn("w-56", variant === "sidebar" && "w-52")}
        align={variant === "sidebar" ? "start" : "end"}
        side={variant === "sidebar" ? "top" : "bottom"}
        forceMount
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{name}</p>
            {user.username && (
              <p className="text-xs leading-none text-muted-foreground">
                @{user.username}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            signOut({
              redirect: false,
            })
            router.push("/")
            router.refresh()
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>退出登录</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
