import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export const ChatMessageItem = ({ message, isOwnMessage, showHeader, avatar }) => {
  return (
    <div className={`flex gap-2 mb-4 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      {/* Avatar on left for received messages */}
      {!isOwnMessage && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={avatar} alt={message.user.name} />
          <AvatarFallback>{message.user.name?.[0]}</AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn('max-w-[75%] w-fit flex flex-col gap-1', {
          'items-end': isOwnMessage,
        })}
      >
        {showHeader && (
          <div
            className={cn("flex items-center gap-2 text-xs px-3", {
              "justify-end flex-row-reverse": isOwnMessage,
            })}
          >
            {!isOwnMessage && message.user?.name ? (
              <span className="text-foreground/70 font-medium truncate max-w-[10rem]">{message.user.name}</span>
            ) : null}
            <span className="text-foreground/50 text-xs">
              {new Date(message.createdAt).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </span>
          </div>
        )}
        <div
          className={cn(
            'py-3 px-4 text-sm w-fit',
            isOwnMessage 
              ? 'bg-primary text-primary-foreground rounded-[24px]' 
              : 'bg-white text-foreground rounded-[24px]'
          )}
        >
          {message.content}
        </div>
      </div>

      {/* Avatar on right for sent messages */}
      {isOwnMessage && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={avatar} alt={message.user.name} />
          <AvatarFallback>{message.user.name?.[0]}</AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}
