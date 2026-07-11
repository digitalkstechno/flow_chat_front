import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Search, Send, MessageSquare, Phone, MoreVertical, Check, CheckCheck,
    Loader2, AlertCircle, RefreshCw, ChevronLeft, X, Bot, Play, Pause, Mic, Smile,
    Maximize2, Minimize2
} from 'lucide-react';
import { getWhatsappChats, getWhatsappChatMessages, sendWhatsappChatMessage, getWhatsappTemplates } from '@/services/tenantService';
import { useTheme } from '@/context/ThemeContext';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Contact {
    _id: string;
    id?: string;
    chat_name?: string;
    whatsapp?: string;
    name?: string;
    phone?: string;
    lastMessage?: string;
    lastMessageTime?: string;
    unreadCount?: number;
    status?: string;
}

interface Message {
    _id: string;
    id?: string;
    message?: string;
    text?: string;
    body?: string;
    type?: string;
    direction?: 'inbound' | 'outbound' | 'sent' | 'received';
    from?: string;
    to?: string;
    timestamp?: string;
    createdAt?: string;
    status?: string;
    read?: boolean;
}

interface ChatPanelProps {
    slug: string;
    onContactsLoaded?: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(rawName: any): string {
    const name = String(rawName || '').trim();
    if (!name || name === 'undefined' || name === 'null') return '?';
    const parts = name.split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
}

function getAvatarColor(rawName: any): string {
    const name = String(rawName || '');
    const colors = [
        'from-emerald-500 to-teal-600',
        'from-blue-500 to-indigo-600',
        'from-violet-500 to-purple-600',
        'from-rose-500 to-pink-600',
        'from-amber-500 to-orange-600',
        'from-cyan-500 to-sky-600',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
}

function formatTime(val?: any): string {
    if (!val) return '';
    try {
        let d: Date;
        const num = Number(val);
        // Check if it is a Unix timestamp in seconds (10-digit number or string)
        if (!isNaN(num) && String(num).length === 10) {
            d = new Date(num * 1000);
        } else {
            d = new Date(val);
        }
        
        const now = new Date();
        // Strip hours to check calendar day difference
        const dDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const diffTime = nowDate.getTime() - dDate.getTime();
        const diffDays = Math.floor(diffTime / 86400000);
        
        if (diffDays === 0) {
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return d.toLocaleDateString([], { weekday: 'short' });
        }
        return d.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
    } catch {
        return '';
    }
}

function formatBubbleTime(val?: any): string {
    if (!val) return '';
    try {
        let d: Date;
        const num = Number(val);
        if (!isNaN(num) && String(num).length === 10) {
            d = new Date(num * 1000);
        } else {
            d = new Date(val);
        }
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
        return '';
    }
}

function getMessageTimestamp(m: any): number {
    if (!m) return 0;
    const raw = m.createdAt || m.timestamp || 0;
    const num = Number(raw);
    if (!isNaN(num) && String(num).length === 10) return num * 1000;
    if (raw) {
        try {
            return new Date(raw).getTime();
        } catch {
            return 0;
        }
    }
    return 0;
}

function formatMessageText(text: string) {
    if (!text) return null;
    
    let normalized = String(text)
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
        
    const lines = normalized.split('\n');
    return lines.map((line, lineIdx) => {
        const parts = line.split(/(\*[^*]+\*)/g);
        const renderedLine = parts.map((part, partIdx) => {
            if (part.startsWith('*') && part.endsWith('*')) {
                return <strong key={partIdx} className="font-bold">{part.slice(1, -1)}</strong>;
            }
            const italicParts = part.split(/(_[^_]+_)/g);
            return italicParts.map((subPart, subIdx) => {
                if (subPart.startsWith('_') && subPart.endsWith('_')) {
                    return <em key={subIdx} className="italic">{subPart.slice(1, -1)}</em>;
                }
                return subPart;
            });
        });
        return (
            <React.Fragment key={lineIdx}>
                {renderedLine}
                {lineIdx < lines.length - 1 && <br />}
            </React.Fragment>
        );
    });
}

function safeText(val: any): string {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return String(val);
    if (typeof val === 'object') {
        const sub = val.text || val.body || val.message || val.value || val.title;
        if (sub) {
            if (typeof sub === 'object') return safeText(sub);
            return String(sub);
        }
        for (const k of Object.keys(val)) {
            if (typeof val[k] === 'string') return val[k];
        }
    }
    return '';
}

function AudioPlayer({ src, outbound }: { src: string; outbound: boolean }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(err => console.log('Audio play failed:', err));
        }
    };

    const handleTimeUpdate = () => {
        if (!audioRef.current) return;
        setCurrentTime(audioRef.current.currentTime);
    };

    const handleLoadedMetadata = () => {
        if (!audioRef.current) return;
        setDuration(audioRef.current.duration);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!audioRef.current) return;
        const val = parseFloat(e.target.value);
        audioRef.current.currentTime = val;
        setCurrentTime(val);
    };

    const formatAudioTime = (time: number) => {
        if (isNaN(time) || !isFinite(time)) return '0:00';
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
    };

    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
    const progressColor = isDark ? '#53bdeb' : '#00a884';
    const trackBgColor = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)';

    return (
        <div className={`flex items-center gap-3 py-1.5 px-2 w-[280px] max-w-full font-sans select-none rounded-lg border shadow-inner ${
            isDark 
                ? 'bg-black/10 border-white/5 text-[#e9edef]' 
                : 'bg-black/5 border-black/5 text-[#111b21]'
        }`}>
            <audio 
                ref={audioRef}
                src={src}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleEnded}
                preload="metadata"
                className="hidden"
            />
            
            <button 
                onClick={togglePlay}
                type="button"
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95 shrink-0 hover:brightness-110 shadow-sm ${
                    outbound 
                        ? (isDark ? 'bg-[#00a884] text-white' : 'bg-emerald-500 text-white') 
                        : (isDark ? 'bg-[#00a884] text-white' : 'bg-[#00a884] text-white')
                }`}
                title={isPlaying ? 'Pause' : 'Play'}
            >
                {isPlaying ? (
                    <Pause className="w-4 h-4 fill-white text-white" />
                ) : (
                    <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                )}
            </button>

            <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                <input 
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-1 rounded-lg appearance-none cursor-pointer outline-none"
                    style={{
                        accentColor: progressColor,
                        background: `linear-gradient(to right, ${progressColor} 0%, ${progressColor} ${progressPercent}%, ${trackBgColor} ${progressPercent}%, ${trackBgColor} 100%)`
                    }}
                />
                <div className={`flex justify-between items-center text-[10px] font-medium leading-none ${
                    isDark ? 'text-[#8696a0]' : 'text-[#667781]'
                }`}>
                    <span>{formatAudioTime(currentTime)}</span>
                    <span>{duration ? formatAudioTime(duration) : '--:--'}</span>
                </div>
            </div>

            <div className="shrink-0 relative">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isDark 
                        ? (outbound ? 'bg-white/10 text-slate-300' : 'bg-white/5 text-slate-300')
                        : (outbound ? 'bg-black/10 text-slate-600' : 'bg-black/5 text-slate-600')
                }`}>
                    <Mic className="w-4 h-4" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#53bdeb] flex items-center justify-center">
                    <span className="text-[6px] text-white font-bold">✓</span>
                </div>
            </div>
        </div>
    );
}

function getSessionTimeRemaining(contact: any, messages: any[]): { active: boolean; display: string } {
    let lastInboundTime = 0;

    // 1. Check root-level last_seen (primary indicator of client activity)
    if (contact?.last_seen) {
        const val = Number(contact.last_seen);
        lastInboundTime = val > 9999999999 ? Math.floor(val / 1000) : val;
    }

    // 2. Check from contact last_interaction_props.ic_message (secondary/fallback)
    if (contact?.last_interaction_props?.ic_message?.timestamp) {
        const t = Number(contact.last_interaction_props.ic_message.timestamp);
        if (t > lastInboundTime) {
            lastInboundTime = t;
        }
    }

    // 3. Check messages array for newer inbound messages
    for (const msg of messages) {
        const isIncoming = msg.direction === 'inbound' || msg.direction === 'received' || msg.direction === 0 || String(msg.direction) === '0';
        if (isIncoming) {
            const t = getMessageTimestamp(msg) / 1000; // in seconds
            if (t > lastInboundTime) {
                lastInboundTime = t;
            }
        }
    }

    if (lastInboundTime === 0) {
        return { active: false, display: 'No Session' };
    }

    const now = Math.floor(Date.now() / 1000);
    const elapsed = now - lastInboundTime;
    const dayInSeconds = 24 * 3600;

    if (elapsed >= dayInSeconds || elapsed < 0) {
        return { active: false, display: 'No Session' };
    }

    const remaining = dayInSeconds - elapsed;
    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);

    const pad = (n: number) => String(n).padStart(2, '0');
    return { active: true, display: `${pad(hours)}:${pad(minutes)}` };
}

function getContactName(c: any): string {
    if (!c) return 'Unknown';
    
    // 1. Check profile.whatsapp.name (com.bot specific)
    if (c.profile?.whatsapp?.name) {
        const pName = c.profile.whatsapp.name;
        if (typeof pName === 'string' && pName.trim() !== '') return pName;
    }
    
    // 2. Check name.first_name and name.last_name
    if (c.name) {
        if (typeof c.name === 'object') {
            const fname = c.name.first_name || '';
            const lname = c.name.last_name || '';
            const combined = `${fname} ${lname}`.trim();
            // Don't return pure phone number as name if we can help it, but return it if it's the only option
            if (combined) return combined;
        } else if (typeof c.name === 'string') {
            return c.name;
        }
    }
    
    // 3. Fallbacks
    const val = c.chat_name || c.whatsapp || c.phone || 'Unknown';
    return String(val);
}

function getContactPhone(c: any): string {
    if (!c) return '';
    
    // 1. Check profile.whatsapp.identifier (com.bot specific)
    if (c.profile?.whatsapp?.identifier) {
        return String(c.profile.whatsapp.identifier);
    }
    
    // 2. Check name.first_name if it matches phone digit format
    if (c.name?.first_name) {
        const rawFn = String(c.name.first_name);
        const cleanFn = rawFn.replace(/[\s\-\(\)\+]/g, '');
        if (/^\d{8,16}$/.test(cleanFn)) {
            return rawFn;
        }
    }
    
    // 3. Standard fields (check string or nested value keys)
    const val = c.whatsapp || c.phone || '';
    if (val) {
        if (typeof val === 'object') {
            const sub = val.identifier || val.number || val.value || val.phone;
            if (sub && typeof sub !== 'object') return String(sub);
        } else {
            return String(val);
        }
    }
    
    // 4. Nested structures
    if (c.contact && typeof c.contact === 'object') {
        return getContactPhone(c.contact);
    }
    if (c.customer && typeof c.customer === 'object') {
        return getContactPhone(c.customer);
    }
    
    return '';
}

function getContactId(c: any): string {
    if (!c) return '';
    const id = c._id || c.id || c.chat_id || c.whatsapp || c.phone;
    return id ? String(id) : '';
}

function getContactLastMessage(c: any): string {
    if (!c) return '';
    if (c.lastMessage) return String(c.lastMessage);
    
    if (c.last_interaction_props) {
        const msg = c.last_interaction_props.message;
        const icMsg = c.last_interaction_props.ic_message;
        
        // Find whichever is newer
        const msgTime = msg?.timestamp || 0;
        const icMsgTime = icMsg?.timestamp || 0;
        
        if (msgTime && icMsgTime) {
            return msgTime > icMsgTime ? (msg.text || '') : (icMsg.text || '');
        }
        return (msg?.text || icMsg?.text || '');
    }
    return '';
}

function getContactLastMessageTime(c: any): string {
    if (!c) return '';
    if (c.lastMessageTime) return String(c.lastMessageTime);
    
    if (c.last_interaction_props) {
        const msg = c.last_interaction_props.message;
        const icMsg = c.last_interaction_props.ic_message;
        
        const msgTime = msg?.timestamp || 0;
        const icMsgTime = icMsg?.timestamp || 0;
        
        const newest = Math.max(msgTime, icMsgTime);
        if (newest) return String(newest);
    }
    if (c.last_seen) return String(c.last_seen);
    if (c.last_icm_timestamp) return String(c.last_icm_timestamp);
    if (c.updatedAt) return String(c.updatedAt);
    
    return '';
}

function getContactSortTime(c: any): number {
    if (!c) return 0;
    
    if (c.last_interaction_props) {
        const msg = c.last_interaction_props.message;
        const icMsg = c.last_interaction_props.ic_message;
        const msgTime = msg?.timestamp ? (Number(msg.timestamp) * (String(msg.timestamp).length === 10 ? 1000 : 1)) : 0;
        const icMsgTime = icMsg?.timestamp ? (Number(icMsg.timestamp) * (String(icMsg.timestamp).length === 10 ? 1000 : 1)) : 0;
        const newest = Math.max(msgTime, icMsgTime);
        if (newest) return newest;
    }
    
    if (c.last_seen) {
        const ls = Number(c.last_seen);
        return ls * (String(ls).length === 10 ? 1000 : 1);
    }
    if (c.last_icm_timestamp) {
        const lit = Number(c.last_icm_timestamp);
        return lit * (String(lit).length === 10 ? 1000 : 1);
    }
    
    if (c.updatedAt) return new Date(c.updatedAt).getTime();
    if (c.createdAt) return new Date(c.createdAt).getTime();
    
    return 0;
}

function getMessageText(m: any): string {
    if (!m) return '';
    
    // Helper to extract string from any potential value shape
    const extractString = (val: any): string => {
        if (!val) return '';
        if (typeof val === 'string') return val;
        if (typeof val === 'number') return String(val);
        if (typeof val === 'object') {
            // Check for list_reply title
            if (val.list_reply && typeof val.list_reply === 'object') {
                return val.list_reply.title || '';
            }
            // Check for button_reply title
            if (val.button_reply && typeof val.button_reply === 'object') {
                return val.button_reply.title || '';
            }
            
            const sub = val.body || val.text || val.message || val.value || val.content;
            if (sub) {
                if (typeof sub === 'object') {
                    return extractString(sub);
                }
                return String(sub);
            }
            for (const key of Object.keys(val)) {
                if (typeof val[key] === 'string' && val[key].trim() !== '') return val[key];
            }
        }
        return '';
    };

    // 1. Try nested content body first (com.bot specific message logs shape)
    if (m.content && typeof m.content === 'object') {
        const text = extractString(m.content);
        if (text) return text;
    }

    // 2. Try direct keys
    const directKeys = [m.message, m.text, m.body, m.content];
    for (const k of directKeys) {
        const str = extractString(k);
        if (str) return str;
    }

    // 3. If it's a template
    if (m.type === 'template') {
        if (m.template && typeof m.template === 'object') {
            return `Template: ${m.template.name || 'Meta Template'}`;
        }
        const str = extractString(m.text || m.message);
        if (str) return str;
        return 'Template Message';
    }
    
    // 4. Media fallbacks
    if (m.type === 'image') return '📷 Image';
    if (m.type === 'video') return '🎥 Video';
    if (m.type === 'audio') return '🎤 Audio';
    if (m.type === 'document') return '📄 Document';
    if (m.type === 'location') return '📍 Location';
    
    // 5. Object fallback
    if (typeof m === 'object') {
        const textVal = m.message || m.text || m.body;
        if (textVal) return String(textVal);
    }
    
    return `[${m.type || 'message'}]`;
}

function isOutbound(m: any): boolean {
    if (!m) return false;
    
    // Check direction
    const dir = m.direction;
    if (dir !== undefined && dir !== null) {
        const d = String(dir).toLowerCase();
        if (d === 'outbound' || d === 'outgoing' || d === 'sent' || d === '1') return true;
        if (d === 'inbound' || d === 'incoming' || d === 'received' || d === '0') return false;
    }
    
    // Check fromMe, from_me, is_from_me
    if (m.fromMe === true || m.from_me === true || m.is_from_me === true) return true;
    if (m.fromMe === false || m.from_me === false || m.is_from_me === false) return false;
    
    // Check sender
    if (m.sender) {
        const s = String(m.sender).toLowerCase();
        if (s === 'agent' || s === 'me' || s === 'business' || s === 'us') return true;
        if (s === 'customer' || s === 'client' || s === 'user') return false;
    }
    
    return false;
}

function groupMessagesByDate(messages: Message[]) {
    const groups: { date: string; messages: Message[] }[] = [];
    if (!messages || !Array.isArray(messages)) return groups;
    let lastDate = '';
    for (const msg of messages) {
        const raw = msg.createdAt || msg.timestamp || '';
        let date = '';
        if (raw) {
            try {
                let d: Date;
                const num = Number(raw);
                if (!isNaN(num) && String(num).length === 10) {
                    d = new Date(num * 1000);
                } else {
                    d = new Date(raw);
                }
                
                const now = new Date();
                const dDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
                const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const diffTime = nowDate.getTime() - dDate.getTime();
                const diffDays = Math.floor(diffTime / 86400000);
                
                if (diffDays === 0) date = 'Today';
                else if (diffDays === 1) date = 'Yesterday';
                else if (diffDays < 7) date = d.toLocaleDateString([], { weekday: 'long' });
                else date = d.toLocaleDateString([], { day: 'numeric', month: 'numeric', year: 'numeric' });
            } catch { 
                date = String(raw).split('T')[0]; 
            }
        }
        if (date !== lastDate) {
            groups.push({ date, messages: [] });
            lastDate = date;
        }
        groups[groups.length - 1].messages.push(msg);
    }
    return groups;
}

// ─── Contact Card ─────────────────────────────────────────────────────────────

function ContactCard({ contact, isActive, onClick }: { contact: Contact; isActive: boolean; onClick: () => void }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const name = getContactName(contact);
    const phone = getContactPhone(contact);
    const initials = getInitials(name);
    const avatarColor = getAvatarColor(name);
    const lastMsg = getContactLastMessage(contact);
    const time = formatTime(getContactLastMessageTime(contact));

    return (
        <button
            id={`contact-${getContactId(contact)}`}
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors border-b group ${
                isDark 
                    ? `hover:bg-white/5 border-white/5 ${isActive ? 'bg-white/10' : ''}` 
                    : `hover:bg-slate-50 border-slate-100 ${isActive ? 'bg-slate-100' : ''}`
            }`}
        >
            <div className={`shrink-0 w-12 h-12 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
                {initials}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <span className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-[#111b21]'}`}>{name}</span>
                    {time && <span className={`text-[10px] shrink-0 ${isDark ? 'text-[#8696a0]' : 'text-[#667781]'}`}>{time}</span>}
                </div>
                <div className="flex items-center justify-between gap-1 mt-0.5">
                    <span className={`text-xs truncate ${isDark ? 'text-[#8696a0]' : 'text-[#667781]'}`}>{lastMsg || phone}</span>
                    {contact.unreadCount ? (
                        <span className="shrink-0 w-5 h-5 rounded-full bg-[#25d366] text-white text-[10px] font-bold flex items-center justify-center">
                            {contact.unreadCount}
                        </span>
                    ) : null}
                </div>
            </div>
        </button>
    );
}

function MessageBubbleContent({ message, onPreview }: { message: any; onPreview: (url: string, type: string, filename?: string) => void }) {
    const text = getMessageText(message);
    
    // Check if message content has structured details
    const content = message.content;
    const isTemplate = message.type === 'template';
    const isInteractive = message.type === 'interactive';
    const isImage = message.type === 'image';
    const isVideo = message.type === 'video';
    const isAudio = message.type === 'audio';
    const isDocument = message.type === 'document' || message.type === 'file';
    const mediaUrl = content?.link || content?.url || message.link || message.url || '';

    // Render Rich Media Attachments (Image, Video, Audio, Document)
    if (isImage && mediaUrl) {
        return (
            <div className="space-y-1.5 max-w-sm">
                <img 
                    src={mediaUrl} 
                    alt="Image Attachment" 
                    className="w-full h-auto rounded border border-white/10 shadow-sm max-h-64 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                    onClick={() => onPreview(mediaUrl, 'image', 'Image Attachment')}
                />
                {content?.caption && <p className="text-xs mt-1 text-[#e9edef]">{formatMessageText(safeText(content.caption))}</p>}
            </div>
        );
    }
    
    if (isVideo && mediaUrl) {
        return (
            <div className="space-y-1.5 max-w-sm relative group">
                <video 
                    src={mediaUrl} 
                    className="w-full h-auto rounded border border-white/10 shadow-sm max-h-64 object-cover cursor-pointer"
                    onClick={() => onPreview(mediaUrl, 'video', 'Video Attachment')}
                />
                <div 
                    className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-70 group-hover:opacity-90 transition-opacity cursor-pointer rounded"
                    onClick={() => onPreview(mediaUrl, 'video', 'Video Attachment')}
                >
                    <span className="text-xl text-white bg-[#202c33]/90 hover:bg-[#2a3942] p-2.5 rounded-full shadow border border-white/10 flex items-center justify-center">▶️</span>
                </div>
                {content?.caption && <p className="text-xs mt-1 text-[#e9edef]">{formatMessageText(safeText(content.caption))}</p>}
            </div>
        );
    }
    
    if (isAudio && mediaUrl) {
        const outbound = isOutbound(message);
        return (
            <div className="py-1">
                <AudioPlayer src={mediaUrl} outbound={outbound} />
            </div>
        );
    }
    
    if (isDocument && mediaUrl) {
        const filename = content?.filename || content?.name || 'Document Attachment';
        return (
            <div 
                className="flex items-center gap-3 p-2.5 rounded bg-black/20 border border-white/5 max-w-xs shadow-inner cursor-pointer hover:bg-black/30 transition-colors"
                onClick={() => onPreview(mediaUrl, 'document', filename)}
            >
                <div className="w-10 h-10 rounded bg-[#202c33] flex items-center justify-center border border-white/10 text-slate-300">
                    📄
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{filename}</p>
                    <p className="text-[10px] text-[#8696a0] mt-0.5">Document</p>
                </div>
                <button 
                    className="p-1.5 rounded-full hover:bg-white/10 text-[#53bdeb] hover:text-white transition-colors text-sm"
                    title="Preview document"
                >
                    🔍
                </button>
            </div>
        );
    }

    if ((isTemplate || isInteractive) && content && typeof content === 'object') {
        const header = content.header;
        const body = content.body;
        const footer = content.footer;
        const buttons = content.buttons || [];
        
        const type = content.type;
        const action = content.action;
        
        // Interactive list message: just body text + select option button (matching real WhatsApp Web)
        if (isInteractive && type === 'list' && action) {
            const listBodyText = body ? safeText(body.text || body) : '';
            return (
                <div className="space-y-1.5 max-w-sm">
                    {listBodyText && <div className="text-sm">{formatMessageText(listBodyText)}</div>}
                    <div className="mt-2 border-t border-white/5 pt-2">
                        <button className="w-full py-1.5 px-3 rounded text-center text-xs font-semibold select-none bg-white/10 hover:bg-white/15 active:bg-white/20 transition-all text-[#53bdeb] hover:text-white border border-white/5 flex items-center justify-center gap-1.5 shadow-sm">
                            📋 {action.button || 'Select Option'}
                        </button>
                    </div>
                </div>
            );
        }
        
        // Fallback for interactive selection replies (e.g. list_reply) to render as simple text
        if (isInteractive && type === 'list_reply') {
            return <span>{formatMessageText(text)}</span>;
        }
        
        const headerText = header ? safeText(header.text || header) : '';
        const bodyText = body ? safeText(body) : '';
        const footerText = footer ? safeText(footer) : '';

        return (
            <div className="space-y-1.5 max-w-sm">
                {/* 1. Header Rendering */}
                {header && typeof header === 'object' && (
                    <div className="mb-1 border-b border-white/5 pb-1">
                        {header.format === 'IMAGE' && (header.image?.link || header.image?.url) && (
                            <img 
                                src={header.image.link || header.image.url} 
                                alt="Template Header Image" 
                                className="w-full h-auto rounded max-h-48 object-cover mb-1 border border-white/5 shadow-sm cursor-pointer hover:opacity-95 transition-opacity"
                                onClick={() => onPreview(header.image.link || header.image.url, 'image', 'Template Header Image')}
                            />
                        )}
                        {header.format === 'VIDEO' && (header.video?.link || header.video?.url) && (
                            <div className="relative group mb-1">
                                <video 
                                    src={header.video.link || header.video.url} 
                                    className="w-full h-auto rounded max-h-48 object-cover cursor-pointer border border-white/5 shadow-sm"
                                    onClick={() => onPreview(header.video.link || header.video.url, 'video', 'Template Header Video')}
                                />
                                <div 
                                    className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-70 group-hover:opacity-90 transition-opacity cursor-pointer rounded"
                                    onClick={() => onPreview(header.video.link || header.video.url, 'video', 'Template Header Video')}
                                >
                                    <span className="text-sm text-white bg-[#202c33]/90 hover:bg-[#2a3942] p-2 rounded-full border border-white/10 shadow-sm flex items-center justify-center">▶️</span>
                                </div>
                            </div>
                        )}
                        {header.format === 'DOCUMENT' && (header.document?.link || header.document?.url) && (
                            <div 
                                className="flex items-center gap-3 p-2.5 rounded bg-black/20 border border-white/5 max-w-xs shadow-inner cursor-pointer hover:bg-black/30 transition-colors mb-1"
                                onClick={() => onPreview(header.document.link || header.document.url, 'document', 'Template Document')}
                            >
                                <div className="w-8 h-8 rounded bg-[#202c33] flex items-center justify-center border border-white/10 text-slate-300 text-xs">
                                    📄
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-white truncate">Template Document</p>
                                </div>
                                <button className="p-1 rounded-full hover:bg-white/10 text-[#53bdeb] text-xs">
                                    🔍
                                </button>
                            </div>
                        )}
                        {header.format === 'TEXT' && headerText && (
                            <div className="text-xs font-bold text-[#8696a0] tracking-wide uppercase">
                                {headerText}
                            </div>
                        )}
                    </div>
                )}
                
                {/* 2. Body Rendering */}
                {bodyText && (
                    <div className="text-sm">
                        {formatMessageText(bodyText)}
                    </div>
                )}
                
                {/* 3. Footer Rendering */}
                {footerText && (
                    <div className="text-[10px] text-[#8696a0]">
                        {footerText}
                    </div>
                )}
                
                {/* 4. Buttons Rendering */}
                {buttons.length > 0 && (
                    <div className="flex flex-col gap-1.5 mt-2 border-t border-white/5 pt-2">
                        {buttons.map((btn: any, btnIdx: number) => {
                            const label = safeText(btn.text || btn);
                            const cleanLabel = label.replace(/^Text:\s*/i, '');
                            return (
                                <button
                                    key={btnIdx}
                                    className="w-full py-1.5 px-3 rounded text-center text-xs font-semibold select-none bg-white/10 hover:bg-white/15 active:bg-white/20 transition-all text-[#53bdeb] hover:text-white border border-white/5 flex items-center justify-center gap-1.5"
                                >
                                    {cleanLabel}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }
    
    return <span>{formatMessageText(text)}</span>;
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ message, onPreview }: { message: Message; onPreview: (url: string, type: string, filename?: string) => void }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const outbound = isOutbound(message);
    const time = formatBubbleTime(message.createdAt || message.timestamp);

    return (
        <div className={`flex ${outbound ? 'justify-end' : 'justify-start'} mb-1.5`}>
            <div
                className={`relative max-w-[70%] px-3 py-2 rounded-[8px] shadow-sm text-sm leading-relaxed ${
                    outbound
                        ? (isDark ? 'bg-[#005c4b] text-[#e9edef]' : 'bg-[#d9fdd3] text-[#111b21]') + ' rounded-tr-none'
                        : (isDark ? 'bg-[#202c33] text-[#e9edef]' : 'bg-[#ffffff] text-[#111b21]') + ' rounded-tl-none'
                }`}
                style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}
            >
                <MessageBubbleContent message={message} onPreview={onPreview} />
                <div className={`flex items-center gap-1 mt-1 ${outbound ? 'justify-end' : 'justify-start'}`}>
                    <span className={`text-[10px] ${isDark ? 'text-[#8696a0]' : 'text-[#667781]'}`}>{time}</span>
                    {outbound && (
                        <span className="text-[#53bdeb]">
                            {message.status === 'read' ? <CheckCheck className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                        </span>
                    )}
                </div>
                {/* Tail */}
                <div
                    className={`absolute top-0 w-0 h-0 ${
                        outbound
                            ? `right-[-6px] border-l-[6px] ${isDark ? 'border-l-[#005c4b]' : 'border-l-[#d9fdd3]'} border-t-[6px] border-t-transparent`
                            : `left-[-6px] border-r-[6px] ${isDark ? 'border-r-[#202c33]' : 'border-r-[#ffffff]'} border-t-[6px] border-t-transparent`
                    }`}
                />
            </div>
        </div>
    );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyChatState() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    return (
        <div className={`flex-1 flex flex-col items-center justify-center gap-4 ${isDark ? 'bg-[#222e35]' : 'bg-[#f8f9fa] border-l border-slate-100'}`}>
            <div className={`w-20 h-20 rounded-full flex items-center justify-center ${isDark ? 'bg-[#202c33]' : 'bg-[#e9edef]'}`}>
                <MessageSquare className={`w-10 h-10 ${isDark ? 'text-[#8696a0]' : 'text-[#667781]'}`} />
            </div>
            <div className="text-center space-y-1.5">
                <h3 className={`text-xl font-light ${isDark ? 'text-[#e9edef]' : 'text-[#41525d]'}`}>WhatsApp Chats</h3>
                <p className={`text-sm max-w-xs text-center leading-relaxed ${isDark ? 'text-[#8696a0]' : 'text-[#667781]'}`}>
                    Select a chat from the left panel to view the conversation and send messages.
                </p>
            </div>
        </div>
    );
}

// ─── Main ChatPanel ───────────────────────────────────────────────────────────

export default function ChatPanel({ slug, onContactsLoaded }: ChatPanelProps) {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [contactsLoading, setContactsLoading] = useState(true);
    const [contactsError, setContactsError] = useState('');
    const [contactsPage, setContactsPage] = useState(1);
    const [hasMoreContacts, setHasMoreContacts] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchInput, setSearchInput] = useState('');

    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [messagesError, setMessagesError] = useState('');
    const [messagesPage, setMessagesPage] = useState(1);
    const [hasMoreMessages, setHasMoreMessages] = useState(true);
    const [messageInput, setMessageInput] = useState('');
    const [sending, setSending] = useState(false);
    const [sendError, setSendError] = useState('');
    const [previewMedia, setPreviewMedia] = useState<{ url: string; type: string; filename?: string } | null>(null);

    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [isFullscreen, setIsFullscreen] = useState(false);

    // ── Keyboard Shortcuts (Esc to close chat or exit fullscreen, Alt+C to toggle fullscreen, / to search) ──
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (isFullscreen) {
                    setIsFullscreen(false);
                    e.preventDefault();
                } else if (selectedContact) {
                    setSelectedContact(null);
                    e.preventDefault();
                }
            }
            
            // Fullscreen toggle shortcut: Alt + C
            if (e.altKey && e.key.toLowerCase() === 'c') {
                setIsFullscreen(prev => !prev);
                e.preventDefault();
            }

            // Search focus shortcut: / (when not inside inputs) or Alt + S
            const isInputFocused = document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA';
            if (e.key === '/' && !isInputFocused) {
                const searchEl = document.getElementById('chat-search-input');
                if (searchEl) {
                    searchEl.focus();
                    e.preventDefault();
                }
            } else if (e.altKey && e.key.toLowerCase() === 's') {
                const searchEl = document.getElementById('chat-search-input');
                if (searchEl) {
                    searchEl.focus();
                    e.preventDefault();
                }
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [isFullscreen, selectedContact]);
    
    const [templates, setTemplates] = useState<any[]>([]);
    const [templatesDropdownOpen, setTemplatesDropdownOpen] = useState(false);
    const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
    const [headerSearchOpen, setHeaderSearchOpen] = useState(false);
    const [headerSearchQuery, setHeaderSearchQuery] = useState('');

    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const emojiRef = useRef<HTMLDivElement>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isInitialLoadRef = useRef(true);
    const activeContactIdRef = useRef<string | null>(null);

    // ── Load Contacts ─────────────────────────────────────────────────────────

    const loadContacts = useCallback(async (page: number, search: string, append = false) => {
        if (!slug) return;
        setContactsLoading(true);
        setContactsError('');
        try {
            const res = await getWhatsappChats(slug, page, 1000, search);
            const responseData = res?.data;
            let list: Contact[] = [];
            if (Array.isArray(responseData)) {
                list = responseData;
            } else if (responseData && Array.isArray(responseData.data)) {
                list = responseData.data;
            } else if (responseData && Array.isArray(responseData.chats)) {
                list = responseData.chats;
            } else if (responseData && Array.isArray(responseData.contacts)) {
                list = responseData.contacts;
            } else if (res && Array.isArray(res.data)) {
                list = res.data;
            } else if (res && Array.isArray(res.chats)) {
                list = res.chats;
            } else if (res && Array.isArray(res.contacts)) {
                list = res.contacts;
            }

            if (append) {
                setContacts(prev => {
                    const combined = [...prev, ...list];
                    return combined.sort((a, b) => getContactSortTime(b) - getContactSortTime(a));
                });
            } else {
                const sorted = [...list].sort((a, b) => getContactSortTime(b) - getContactSortTime(a));
                setContacts(sorted);
            }
            setHasMoreContacts(list.length === 1000);
        } catch (err: any) {
            setContactsError(err.response?.data?.message || err.message || 'Failed to load chats');
        } finally {
            setContactsLoading(false);
            if (onContactsLoaded) onContactsLoaded();
        }
    }, [slug]);

    // Load Meta WhatsApp templates
    useEffect(() => {
        if (slug) {
            getWhatsappTemplates(slug)
                .then(res => {
                    const list = res?.data || res?.templates || res || [];
                    if (Array.isArray(list)) {
                        // Filter for APPROVED templates only
                        const approved = list.filter((t: any) => t.status === 'APPROVED');
                        setTemplates(approved);
                    }
                })
                .catch(err => console.error('Failed to load templates:', err));
        }
    }, [slug]);

    // Auto-resize input textarea height
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
        }
    }, [messageInput]);

    // Handle clicks outside dropdown/emoji pickers to close them
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setTemplatesDropdownOpen(false);
            }
            if (emojiRef.current && !emojiRef.current.contains(event.target as Node)) {
                setEmojiPickerOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectEmoji = (emoji: string) => {
        const textarea = textareaRef.current;
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const currentText = messageInput;
            const updatedText = currentText.substring(0, start) + emoji + currentText.substring(end);
            setMessageInput(updatedText);
            
            const newCursorPos = start + emoji.length;
            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(newCursorPos, newCursorPos);
            }, 50);
        } else {
            setMessageInput(prev => prev + emoji);
        }
        setEmojiPickerOpen(false);
    };

    const handleSelectTemplate = (template: any) => {
        const bodyText = template.components?.find((c: any) => c.type === 'BODY')?.text || '';
        setMessageInput(bodyText);
        setTemplatesDropdownOpen(false);
        setTimeout(() => textareaRef.current?.focus(), 50);
    };

    useEffect(() => {
        setContactsPage(1);
        loadContacts(1, searchQuery, false);
    }, [loadContacts, searchQuery]);

    // ── Search debounce ───────────────────────────────────────────────────────

    const handleSearchChange = (val: string) => {
        setSearchInput(val);
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => {
            setSearchQuery(val);
        }, 400);
    };

    // ── Load Messages ─────────────────────────────────────────────────────────

    const loadMessages = useCallback(async (contact: Contact, page: number, append = false) => {
        if (!slug || !contact) return;
        const targetContactId = getContactId(contact);
        setMessagesLoading(true);
        setMessagesError('');

        // Store scroll heights for scroll-anchoring/preservation on prepending
        let prevScrollHeight = 0;
        let prevScrollTop = 0;
        const container = messagesContainerRef.current;
        if (append && container) {
            prevScrollHeight = container.scrollHeight;
            prevScrollTop = container.scrollTop;
        }

        try {
            const res = await getWhatsappChatMessages(slug, targetContactId, page, 20);
            
            // Discard concurrent responses if the user switched active contacts in the meantime
            if (activeContactIdRef.current !== targetContactId) {
                return;
            }

            const responseData = res?.data;
            let list: Message[] = [];
            if (Array.isArray(responseData)) {
                list = responseData;
            } else if (responseData && Array.isArray(responseData.data)) {
                list = responseData.data;
            } else if (responseData && Array.isArray(responseData.messages)) {
                list = responseData.messages;
            } else if (res && Array.isArray(res.data)) {
                list = res.data;
            } else if (res && Array.isArray(res.messages)) {
                list = res.messages;
            }

            setMessages(prev => {
                const combined = [...prev, ...list];
                const unique = combined.filter((msg, index, self) => 
                    self.findIndex(m => {
                        const mId = m.id || m._id;
                        const msgId = msg.id || msg._id;
                        if (mId && msgId && mId === msgId) return true;
                        
                        const mTime = m.createdAt || m.timestamp;
                        const msgTime = msg.createdAt || msg.timestamp;
                        if (mTime && msgTime && mTime === msgTime && getMessageText(m) === getMessageText(msg)) return true;
                        
                        return false;
                    }) === index
                );
                return unique.sort((a, b) => getMessageTimestamp(a) - getMessageTimestamp(b));
            });

            // Update contact preview text and bubble up contact card in sidebar
            if (list.length > 0 && !append) {
                let newestMsg: any = list[0];
                let newestTime = getMessageTimestamp(newestMsg);
                for (const m of list) {
                    const t = getMessageTimestamp(m);
                    if (t > newestTime) {
                        newestMsg = m;
                        newestTime = t;
                    }
                }
                
                const newestMsgText = getMessageText(newestMsg);
                const newestMsgTime = newestMsg.createdAt || newestMsg.timestamp;
                
                setContacts(prev => {
                    return prev.map((c: any) => {
                        if (getContactId(c) === getContactId(contact)) {
                            return {
                                ...c,
                                lastMessage: newestMsgText,
                                lastMessageTime: newestMsgTime,
                                last_interaction_props: {
                                    ...c.last_interaction_props,
                                    message: newestMsg.direction === 'outbound' || newestMsg.direction === 'sent' || newestMsg.direction === 1 || String(newestMsg.direction) === '1' ? {
                                        direction: 1,
                                        timestamp: newestMsgTime,
                                        text: newestMsgText
                                    } : c.last_interaction_props?.message,
                                    ic_message: newestMsg.direction === 'inbound' || newestMsg.direction === 'received' || newestMsg.direction === 0 || String(newestMsg.direction) === '0' ? {
                                        direction: 0,
                                        timestamp: newestMsgTime,
                                        text: newestMsgText
                                    } : c.last_interaction_props?.ic_message
                                }
                            };
                        }
                        return c;
                    }).sort((a, b) => getContactSortTime(b) - getContactSortTime(a));
                });
            }

            if (append && container && prevScrollHeight > 0) {
                // Adjust scroll position after rendering to avoid jumping
                setTimeout(() => {
                    const diff = container.scrollHeight - prevScrollHeight;
                    container.scrollTop = prevScrollTop + diff;
                }, 30);
            } else if (!append) {
                let shouldScroll = isInitialLoadRef.current;
                
                if (container) {
                    const scrollPosition = container.scrollHeight - container.scrollTop - container.clientHeight;
                    if (scrollPosition < 150) {
                        shouldScroll = true;
                    }
                }
                
                if (shouldScroll) {
                    setTimeout(() => {
                        if (messagesContainerRef.current) {
                            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
                        }
                        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
                        isInitialLoadRef.current = false;
                    }, 50);
                }
            }
            setHasMoreMessages(list.length === 20);
        } catch (err: any) {
            setMessagesError(err.response?.data?.message || err.message || 'Failed to load messages');
        } finally {
            setMessagesLoading(false);
        }
    }, [slug]);

    const handleSelectContact = (contact: Contact) => {
        const contactId = getContactId(contact);
        activeContactIdRef.current = contactId;
        isInitialLoadRef.current = true;
        setSelectedContact(contact);
        setMessages([]);
        setMessagesPage(1);
        setHasMoreMessages(true);
        setSendError('');
        setMessageInput('');
        loadMessages(contact, 1, false);

        // Start polling for new messages every 10s
        if (pollingRef.current) clearInterval(pollingRef.current);
        pollingRef.current = setInterval(() => {
            loadMessages(contact, 1, false);
        }, 10000);
    };

    useEffect(() => {
        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, []);

    // ── Send Message ──────────────────────────────────────────────────────────

    const handleSend = async () => {
        if (!selectedContact || !messageInput.trim() || sending) return;
        const phone = getContactPhone(selectedContact);
        if (!phone) {
            setSendError('No phone number for this contact.');
            return;
        }
        setSending(true);
        setSendError('');
        const text = messageInput.trim();
        setMessageInput('');
        try {
            await sendWhatsappChatMessage(slug, getContactId(selectedContact), { to: phone, message: text });
            
            // Update contacts list to bubble this contact to the top with the new message preview
            setContacts(prev => {
                return prev.map((c: any) => {
                    if (getContactId(c) === getContactId(selectedContact)) {
                        return {
                            ...c,
                            lastMessage: `You: ${text}`,
                            lastMessageTime: new Date().toISOString(),
                            last_interaction_props: {
                                ...c.last_interaction_props,
                                message: {
                                    direction: 1,
                                    timestamp: Math.floor(Date.now() / 1000),
                                    text: text
                                }
                            }
                        };
                    }
                    return c;
                }).sort((a, b) => getContactSortTime(b) - getContactSortTime(a));
            });

            // Optimistic: add to messages
            const optimistic: Message = {
                _id: `opt_${Date.now()}`,
                message: text,
                direction: 'outbound',
                createdAt: new Date().toISOString(),
                status: 'sent'
            };
            setMessages(prev => [...prev, optimistic]);
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
        } catch (err: any) {
            setSendError(err.response?.data?.message || err.message || 'Failed to send message');
            setMessageInput(text); // restore
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // ── Load More Messages (scroll up) ────────────────────────────────────────

    const handleMessagesScroll = () => {
        const container = messagesContainerRef.current;
        if (!container || !hasMoreMessages || messagesLoading || !selectedContact) return;
        if (container.scrollTop < 80) {
            const nextPage = messagesPage + 1;
            setMessagesPage(nextPage);
            loadMessages(selectedContact, nextPage, true);
        }
    };

    // ── Load More Contacts (scroll) ───────────────────────────────────────────

    const handleContactsScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const el = e.currentTarget;
        if (!hasMoreContacts || contactsLoading) return;
        if (el.scrollHeight - el.scrollTop - el.clientHeight < 100) {
            const nextPage = contactsPage + 1;
            setContactsPage(nextPage);
            loadContacts(nextPage, searchQuery, true);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────

    const selectedName = selectedContact ? getContactName(selectedContact) : '';
    const selectedPhone = selectedContact ? getContactPhone(selectedContact) : '';
    const selectedInitials = selectedName ? getInitials(selectedName) : '?';
    const selectedColor = selectedName ? getAvatarColor(selectedName) : 'from-gray-500 to-gray-600';
    const filteredMessages = messages.filter(msg => {
        if (!headerSearchQuery.trim()) return true;
        const text = getMessageText(msg).toLowerCase();
        return text.includes(headerSearchQuery.toLowerCase());
    });
    const messageGroups = groupMessagesByDate(filteredMessages);
    const session = getSessionTimeRemaining(selectedContact, messages);

    if (contactsLoading && contacts.length === 0) {
        return <WhatsAppSplashLoader />;
    }

    return (
        <>
            <style dangerouslySetInnerHTML={{__html: `
                .scrollbar-whatsapp::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }
                .scrollbar-whatsapp::-webkit-scrollbar-track {
                    background: transparent;
                }
                .scrollbar-whatsapp::-webkit-scrollbar-thumb {
                    background: rgba(80, 100, 110, 0.3);
                    border-radius: 3px;
                }
                .scrollbar-whatsapp::-webkit-scrollbar-thumb:hover {
                    background: rgba(80, 100, 110, 0.5);
                }
            `}} />
            <div className={`flex h-full rounded-2xl overflow-hidden shadow-2xl border ${
                isFullscreen 
                    ? 'fixed inset-0 z-[9999] rounded-none border-none' 
                    : `relative ${isDark ? 'border-white/10' : 'border-slate-200'}`
            }`} style={{ 
                background: isDark ? '#111b21' : '#ffffff', 
                minHeight: 0, 
                height: isFullscreen ? '100vh' : '100%' 
            }}>
                {/* ── Left: Contact List ──────────────────────────────────────────────── */}
                <div className={`flex flex-col w-[340px] shrink-0 border-r ${isDark ? 'border-white/5' : 'border-slate-100'}`} style={{ background: isDark ? '#111b21' : '#ffffff' }}>

                {/* Header */}
                <div className={`flex items-center justify-between px-4 py-4 border-b ${isDark ? 'border-white/5' : 'border-slate-100'}`} style={{ background: isDark ? '#202c33' : '#f0f2f5' }}>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#25d366] to-[#128c7e] flex items-center justify-center">
                            <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h2 className={`font-semibold text-sm leading-tight ${isDark ? 'text-[#e9edef]' : 'text-[#111b21]'}`}>WhatsApp Chats</h2>
                            <p className={`text-[10px] ${isDark ? 'text-[#8696a0]' : 'text-[#667781]'}`}>{contacts.length} contacts</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                        <button
                            id="toggle-fullscreen-btn-left"
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            className={`p-1.5 rounded-full transition-colors ${
                                isDark 
                                    ? 'hover:bg-white/10 text-[#8696a0] hover:text-[#e9edef]' 
                                    : 'hover:bg-black/5 text-[#54656f] hover:text-[#111b21]'
                            }`}
                            title={isFullscreen ? "Exit Fullscreen (Esc)" : "Fullscreen Mode (Alt + C)"}
                        >
                            {isFullscreen ? <Minimize2 className="w-4.5 h-4.5" /> : <Maximize2 className="w-4.5 h-4.5" />}
                        </button>
                        <button
                            id="refresh-contacts-btn"
                            onClick={() => { setContactsPage(1); loadContacts(1, searchQuery, false); }}
                            className={`p-1.5 rounded-full transition-colors ${
                                isDark 
                                    ? 'hover:bg-white/10 text-[#8696a0] hover:text-[#e9edef]' 
                                    : 'hover:bg-black/5 text-[#54656f] hover:text-[#111b21]'
                            }`}
                            title="Refresh"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="px-3 py-2.5" style={{ background: isDark ? '#111b21' : '#ffffff' }}>
                    <div className="relative">
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isDark ? 'text-[#8696a0]' : 'text-[#667781]'}`} />
                        <input
                            id="chat-search-input"
                            type="text"
                            value={searchInput}
                            onChange={e => handleSearchChange(e.target.value)}
                            placeholder="Search contacts..."
                            className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg focus:outline-none transition-colors ${
                                isDark 
                                    ? 'text-[#e9edef] placeholder-[#8696a0] bg-[#202c33]' 
                                    : 'text-[#111b21] placeholder-[#667781] bg-[#f0f2f5]'
                            }`}
                        />
                        {searchInput && (
                            <button
                                onClick={() => { setSearchInput(''); setSearchQuery(''); }}
                                className={`absolute right-2.5 top-1/2 -translate-y-1/2 ${
                                    isDark ? 'text-[#8696a0] hover:text-[#e9edef]' : 'text-[#667781] hover:text-[#111b21]'
                                }`}
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Contacts */}
                <div
                    className="flex-1 overflow-y-auto scrollbar-whatsapp"
                    onScroll={handleContactsScroll}
                    style={{ background: isDark ? '#111b21' : '#ffffff' }}
                >
                    {contactsError ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3 px-4 text-center">
                            <AlertCircle className="w-8 h-8 text-red-400" />
                            <p className="text-[#8696a0] text-xs leading-relaxed">{contactsError}</p>
                            <button
                                onClick={() => loadContacts(1, searchQuery, false)}
                                className="text-[#25d366] text-xs font-semibold hover:underline"
                            >
                                Retry
                            </button>
                        </div>
                    ) : contactsLoading && contacts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <Loader2 className="w-6 h-6 text-[#25d366] animate-spin" />
                            <span className="text-[#8696a0] text-xs">Loading chats...</span>
                        </div>
                    ) : contacts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3 px-4 text-center">
                            <MessageSquare className="w-8 h-8 text-[#8696a0]" />
                            <p className="text-[#8696a0] text-xs">
                                {searchQuery ? `No contacts matching "${searchQuery}"` : 'No contacts found'}
                            </p>
                        </div>
                    ) : (
                        <>
                            {contacts.map(contact => (
                                <ContactCard
                                    key={getContactId(contact)}
                                    contact={contact}
                                    isActive={getContactId(selectedContact) === getContactId(contact)}
                                    onClick={() => handleSelectContact(contact)}
                                />
                            ))}
                            {contactsLoading && (
                                <div className="flex justify-center py-3">
                                    <Loader2 className="w-4 h-4 text-[#25d366] animate-spin" />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* ── Right: Chat Window ──────────────────────────────────────────────── */}
            {!selectedContact ? (
                <EmptyChatState />
            ) : (
                <div className="flex-1 flex flex-col min-w-0" style={{ background: isDark ? '#0b141a' : '#efeae2' }}>

                    {/* Chat Header */}
                    <div
                        className={`flex items-center gap-3 px-4 py-3 border-b shrink-0 ${
                            isDark ? 'border-white/5 bg-[#202c33]' : 'border-slate-100 bg-[#f0f2f5]'
                        }`}
                    >
                        <div className={`shrink-0 w-10 h-10 rounded-full bg-gradient-to-br ${selectedColor} flex items-center justify-center text-white font-bold text-sm`}>
                            {selectedInitials}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <h3 className={`font-semibold text-sm truncate ${isDark ? 'text-[#e9edef]' : 'text-[#111b21]'}`}>{selectedName}</h3>
                                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold select-none shrink-0 flex items-center gap-1 ${
                                    session.active 
                                        ? 'bg-[#00a884]/20 text-[#00a884] border border-[#00a884]/20' 
                                        : 'bg-[#53bdeb]/15 text-[#53bdeb] border border-[#53bdeb]/20'
                                }`}>
                                    {session.active && <span className="animate-pulse">🕒</span>} {session.display}
                                </span>
                            </div>
                            <p className={`${isDark ? 'text-[#8696a0]' : 'text-[#667781]'} text-xs truncate`}>{selectedPhone}</p>
                        </div>
                        <div className="flex items-center gap-1">
                            {headerSearchOpen && (
                                <div className="relative animate-fade-in mr-1">
                                    <input 
                                        type="text"
                                        placeholder="Search messages..."
                                        value={headerSearchQuery}
                                        onChange={e => setHeaderSearchQuery(e.target.value)}
                                        className={`pl-8 pr-7 py-1 text-xs rounded-lg focus:outline-none w-48 ${
                                            isDark 
                                                ? 'bg-[#2a3942] text-[#e9edef] placeholder-[#8696a0]' 
                                                : 'bg-white text-[#111b21] placeholder-[#667781] border border-slate-200'
                                        }`}
                                    />
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8696a0]" />
                                    {headerSearchQuery && (
                                        <button 
                                            onClick={() => setHeaderSearchQuery('')}
                                            className={`absolute right-2 top-1/2 -translate-y-1/2 ${
                                                isDark ? 'text-[#8696a0] hover:text-white' : 'text-[#667781] hover:text-[#111b21]'
                                            }`}
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            )}
                            <button
                                onClick={() => {
                                    setHeaderSearchOpen(!headerSearchOpen);
                                    if (headerSearchOpen) setHeaderSearchQuery('');
                                }}
                                className={`p-2 rounded-full transition-colors ${
                                    isDark 
                                        ? 'hover:bg-white/10 text-[#8696a0] hover:text-[#e9edef]' 
                                        : 'hover:bg-black/5 text-[#54656f] hover:text-[#111b21]'
                                }`}
                                title="Search messages"
                            >
                                <Search className="w-4 h-4" />
                            </button>
                            <button
                                id="toggle-fullscreen-btn-right"
                                onClick={() => setIsFullscreen(!isFullscreen)}
                                className={`p-2 rounded-full transition-colors ${
                                    isDark 
                                        ? 'hover:bg-white/10 text-[#8696a0] hover:text-[#e9edef]' 
                                        : 'hover:bg-black/5 text-[#54656f] hover:text-[#111b21]'
                                }`}
                                title={isFullscreen ? "Exit Fullscreen (Esc)" : "Fullscreen Mode (Alt + C)"}
                            >
                                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                            </button>
                            <button
                                id="refresh-messages-btn"
                                onClick={() => {
                                    loadMessages(selectedContact, 1, false);
                                    loadContacts(1, searchQuery, false);
                                }}
                                className={`p-2 rounded-full transition-colors ${
                                    isDark 
                                        ? 'hover:bg-white/10 text-[#8696a0] hover:text-[#e9edef]' 
                                        : 'hover:bg-black/5 text-[#54656f] hover:text-[#111b21]'
                                }`}
                                title="Refresh"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div
                        ref={messagesContainerRef}
                        onScroll={handleMessagesScroll}
                        className="flex-1 overflow-y-auto scrollbar-whatsapp px-6 py-4"
                        style={{
                            backgroundColor: isDark ? '#0b141a' : '#efeae2',
                            backgroundImage: isDark ? "url('/whatsapp_bg_dark.jpg')" : "url('/whatsapp_bg_light.jpg')",
                            backgroundRepeat: 'repeat',
                            backgroundSize: '360px',
                            backgroundBlendMode: isDark ? 'normal' : 'multiply',
                            opacity: 0.99
                        }}
                    >
                        {/* Load More Button */}
                        {hasMoreMessages && !messagesLoading && messages.length > 0 && (
                            <div className="flex justify-center mb-4">
                                <button
                                    id="load-more-messages-btn"
                                    onClick={() => {
                                        const nextPage = messagesPage + 1;
                                        setMessagesPage(nextPage);
                                        loadMessages(selectedContact, nextPage, true);
                                    }}
                                    className={`text-xs transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${isDark ? 'text-[#8696a0] hover:text-[#e9edef] border-transparent bg-[#202c33]' : 'text-[#667781] hover:text-[#111b21] border-slate-200 bg-white'}`}
                                >
                                    <ChevronLeft className="w-3 h-3" />
                                    Load older messages
                                </button>
                            </div>
                        )}

                        {/* Top loader for scrolling up pagination */}
                        {messagesLoading && messages.length > 0 && (
                            <div className="flex justify-center mb-4 py-2 shrink-0">
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-md ${isDark ? 'bg-[#202c33] border-white/5' : 'bg-white border-slate-100'}`}>
                                    <Loader2 className="w-3.5 h-3.5 text-[#25d366] animate-spin" />
                                    <span className={`text-[11px] font-semibold ${isDark ? 'text-[#8696a0]' : 'text-[#667781]'}`}>Loading older messages...</span>
                                </div>
                            </div>
                        )}

                        {/* Top loader */}
                        {messagesLoading && messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full gap-3">
                                <Loader2 className="w-6 h-6 text-[#25d366] animate-spin" />
                                <span className="text-[#8696a0] text-xs">Loading messages...</span>
                            </div>
                        )}

                        {/* Messages Error */}
                        {messagesError && (
                            <div className="flex flex-col items-center justify-center h-full gap-3">
                                <AlertCircle className="w-8 h-8 text-red-400" />
                                <p className="text-[#8696a0] text-xs text-center">{messagesError}</p>
                                <button
                                    onClick={() => loadMessages(selectedContact, 1, false)}
                                    className="text-[#25d366] text-xs font-semibold hover:underline"
                                >
                                    Retry
                                </button>
                            </div>
                        )}

                        {/* No Messages */}
                        {!messagesLoading && !messagesError && messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full gap-3">
                                <MessageSquare className="w-10 h-10 text-[#8696a0]" />
                                <p className="text-[#8696a0] text-sm">No messages yet</p>
                                <p className="text-[#8696a0] text-xs">Start a conversation by typing a message below</p>
                            </div>
                        )}

                        {/* Message Groups */}
                        {messageGroups.map((group, gi) => (
                            <div key={gi}>
                                {group.date && (
                                    <div className="flex justify-center my-4">
                                        <span
                                            className={`text-[11px] font-medium px-3 py-1 rounded-full border ${isDark ? 'text-[#8696a0] border-transparent' : 'text-[#54656f] bg-white border-slate-100 shadow-sm'}`}
                                            style={{ background: isDark ? '#202c33' : undefined }}
                                        >
                                            {group.date}
                                        </span>
                                    </div>
                                )}
                                {group.messages.map(msg => (
                                    <MessageBubble 
                                        key={msg.id || msg._id} 
                                        message={msg} 
                                        onPreview={(url, type, filename) => setPreviewMedia({ url, type, filename })}
                                    />
                                ))}
                            </div>
                        ))}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Send Error */}
                    {sendError && (
                        <div className="px-4 py-2 text-xs text-red-400 text-center border-t border-red-900/30" style={{ background: '#1a1010' }}>
                            ⚠ {sendError}
                            <button onClick={() => setSendError('')} className="ml-2 text-red-300 hover:underline">Dismiss</button>
                        </div>
                    )}

                    {/* Input Bar / Session Ended Alert */}
                    {/* Input Bar / Session Ended Alert */}
                    {!session.active ? (
                        <div 
                            className={`flex items-center justify-between px-6 py-4 border-t shrink-0 text-sm select-none ${
                                isDark ? 'border-white/5 bg-[#202c33] text-[#8696a0]' : 'border-slate-100 bg-[#f0f2f5] text-[#667781]'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-sm">🔒</span>
                                <span className="text-xs">Free conversation session ended</span>
                            </div>
                            <div className="flex items-center gap-4 text-base opacity-75">
                                <span className="cursor-not-allowed">😀</span>
                                <span className="cursor-not-allowed">📎</span>
                                <span className="cursor-not-allowed">🤖</span>
                                <span className="cursor-not-allowed">⚙️</span>
                            </div>
                        </div>
                    ) : (
                        <div
                            className={`flex items-end gap-2.5 px-4 py-3 border-t shrink-0 relative ${
                                isDark ? 'border-white/5 bg-[#202c33]' : 'border-slate-100 bg-[#f0f2f5]'
                            }`}
                        >
                            {/* Emoji Picker Popover */}
                            {emojiPickerOpen && (
                                <div 
                                    ref={emojiRef}
                                    className={`absolute bottom-full left-4 mb-2 p-3 rounded-2xl shadow-2xl border z-[60] w-64 ${
                                        isDark 
                                            ? 'bg-[#233138] border-white/10 text-white' 
                                            : 'bg-white border-slate-200 text-slate-800'
                                    }`}
                                >
                                    <div className="flex justify-between items-center mb-2 pb-1 border-b border-white/5">
                                        <span className={`text-[10px] font-black uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Quick Emojis</span>
                                        <button onClick={() => setEmojiPickerOpen(false)} className={`p-0.5 rounded-full ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-150'}`}><X className="w-3 h-3" /></button>
                                    </div>
                                    <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto">
                                        {['😀', '😂', '🤣', '😊', '😍', '👍', '🙏', '❤️', '🔥', '🎉', '👏', '🙌', '✨', '💡', '💬', '📞', '📍', '✅', '❌', '⚠️'].map(emoji => (
                                            <button 
                                                key={emoji}
                                                type="button"
                                                onClick={() => handleSelectEmoji(emoji)}
                                                className={`text-xl p-1 rounded transition-all hover:scale-125 ${
                                                    isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'
                                                }`}
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Templates Dropdown Popover */}
                            {templatesDropdownOpen && (
                                <div 
                                    ref={dropdownRef}
                                    className={`absolute bottom-full left-12 mb-2 p-3.5 rounded-2xl shadow-2xl border z-[60] w-80 max-h-80 flex flex-col ${
                                        isDark 
                                            ? 'bg-[#233138] border-white/10 text-white' 
                                            : 'bg-white border-slate-200 text-slate-800'
                                    }`}
                                >
                                    <div className="flex justify-between items-center mb-2 pb-1.5 border-b border-[#8696a0]/15 shrink-0">
                                        <span className={`text-[10px] font-black uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Select Quick Template</span>
                                        <button onClick={() => setTemplatesDropdownOpen(false)} className={`p-0.5 rounded-full ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-150'}`}><X className="w-3 h-3" /></button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto space-y-1.5 scrollbar-whatsapp pr-1">
                                        {templates.length === 0 ? (
                                            <div className={`text-center py-6 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                No approved WhatsApp templates found.
                                            </div>
                                        ) : (
                                            templates.map(t => {
                                                const bodyText = t.components?.find((c: any) => c.type === 'BODY')?.text || '';
                                                return (
                                                    <button 
                                                        key={t.id || t.name}
                                                        type="button"
                                                        onClick={() => handleSelectTemplate(t)}
                                                        className={`w-full text-left p-2.5 rounded-xl border transition-all text-xs flex flex-col gap-1 ${
                                                            isDark 
                                                                ? 'border-white/5 hover:bg-white/5 hover:border-white/10' 
                                                                : 'border-slate-100 hover:bg-slate-50 hover:border-slate-200'
                                                        }`}
                                                    >
                                                        <span className="font-extrabold text-[10px] tracking-wider uppercase text-blue-600 dark:text-blue-400">{t.name}</span>
                                                        <span className={`truncate w-full font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{bodyText}</span>
                                                    </button>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Emoji Action Button */}
                            <button
                                type="button"
                                onClick={() => setEmojiPickerOpen(!emojiPickerOpen)}
                                className={`p-2.5 rounded-xl shrink-0 transition-colors ${
                                    isDark 
                                        ? 'text-[#8696a0] hover:text-[#e9edef] hover:bg-white/5' 
                                        : 'text-[#54656f] hover:text-[#111b21] hover:bg-black/5'
                                }`}
                                title="Emojis"
                            >
                                <Smile className="w-5 h-5" />
                            </button>

                            {/* Template Action Button */}
                            <button
                                type="button"
                                onClick={() => setTemplatesDropdownOpen(!templatesDropdownOpen)}
                                className={`p-2.5 rounded-xl shrink-0 transition-colors ${
                                    isDark 
                                        ? 'text-[#8696a0] hover:text-[#e9edef] hover:bg-white/5' 
                                        : 'text-[#54656f] hover:text-[#111b21] hover:bg-black/5'
                                }`}
                                title="Quick Reply Template"
                            >
                                <Bot className="w-5 h-5" />
                            </button>

                            {/* Text Input Area */}
                            <textarea
                                ref={textareaRef}
                                id="chat-message-input"
                                value={messageInput}
                                onChange={e => setMessageInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type a message..."
                                rows={1}
                                className={`flex-1 resize-none rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors border-none`}
                                style={{
                                    background: isDark ? '#2a3942' : '#ffffff',
                                    color: isDark ? '#e9edef' : '#111b21',
                                    maxHeight: 120,
                                    minHeight: 44,
                                    lineHeight: '1.5'
                                }}
                            />

                            {/* Send Action Button */}
                            <button
                                id="send-message-btn"
                                onClick={handleSend}
                                disabled={!messageInput.trim() || sending}
                                className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all disabled:opacity-40"
                                style={{ background: messageInput.trim() ? '#25d366' : (isDark ? '#374151' : '#e9edef') }}
                                title="Send message (Enter)"
                            >
                                {sending ? (
                                    <Loader2 className={`w-4 h-4 animate-spin ${isDark ? 'text-white' : 'text-slate-400'}`} />
                                ) : (
                                    <Send className={`w-4 h-4 ${messageInput.trim() ? 'text-white' : (isDark ? 'text-[#8696a0]' : 'text-[#667781]')}`} />
                                )}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
        
         {/* Fullscreen Media Preview Overlay Modal */}
        {previewMedia && (
            <div 
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-6 select-none animate-fade-in"
                onClick={() => setPreviewMedia(null)}
            >
                <div 
                    className={`relative rounded-2xl max-w-4xl w-full max-h-[85vh] flex flex-col border shadow-2xl overflow-hidden animate-zoom-in ${isDark ? 'bg-[#222e35] border-white/10' : 'bg-white border-slate-200'}`}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className={`flex items-center justify-between px-6 py-4 border-b shrink-0 ${isDark ? 'bg-[#202c33] border-white/5' : 'bg-[#f0f2f5] border-slate-200'}`}>
                        <div className="min-w-0">
                            <h3 className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-[#111b21]'}`}>
                                {previewMedia.filename || `${previewMedia.type.toUpperCase()} Preview`}
                            </h3>
                            <p className={`text-[10px] mt-0.5 uppercase tracking-wider font-bold ${isDark ? 'text-[#8696a0]' : 'text-[#667781]'}`}>
                                {previewMedia.type} Attachment
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <a 
                                href={previewMedia.url} 
                                download 
                                target="_blank" 
                                rel="noreferrer"
                                className={`p-2 rounded-xl transition-all text-xs font-bold flex items-center gap-1.5 border shadow-sm shrink-0 ${isDark ? 'bg-white/5 hover:bg-white/10 text-[#53bdeb] hover:text-white border-white/5' : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-100'}`}
                            >
                                📥 Download
                            </a>
                            <button 
                                onClick={() => setPreviewMedia(null)}
                                className={`p-2 rounded-xl transition-colors border ${isDark ? 'bg-white/5 hover:bg-white/10 text-[#8696a0] hover:text-[#e9edef] border-white/5' : 'bg-slate-100 hover:bg-slate-200 text-[#54656f] hover:text-[#111b21] border-slate-200'}`}
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className={`flex-1 overflow-auto p-8 flex items-center justify-center min-h-[300px] ${isDark ? 'bg-[#0b141a]' : 'bg-[#efeae2]'}`}>
                        {previewMedia.type === 'image' && (
                            <img 
                                src={previewMedia.url} 
                                alt="Preview" 
                                className="max-w-full max-h-[60vh] rounded-lg border border-white/5 shadow-md object-contain select-text"
                            />
                        )}
                        {previewMedia.type === 'video' && (
                            <video 
                                src={previewMedia.url} 
                                controls 
                                autoPlay
                                className="max-w-full max-h-[60vh] rounded-lg border border-white/5 shadow-md object-contain"
                            />
                        )}
                        {previewMedia.type === 'audio' && (
                            <div className={`w-full max-w-md p-6 rounded-xl border shadow-lg flex flex-col items-center gap-4 ${isDark ? 'bg-[#222e35] border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                                <span className="text-4xl">🎵</span>
                                <audio 
                                    src={previewMedia.url} 
                                    controls 
                                    autoPlay
                                    className="w-full font-sans"
                                />
                                <p className="text-xs text-[#8696a0] text-center">Audio Clip Player</p>
                            </div>
                        )}
                        {previewMedia.type !== 'image' && previewMedia.type !== 'video' && previewMedia.type !== 'audio' && (
                            <div className="text-center p-8 rounded-xl bg-[#222e35] border border-white/5 shadow-lg max-w-sm">
                                <span className="text-5xl block mb-4">📄</span>
                                <h4 className="text-sm font-bold text-white mb-2">{previewMedia.filename || 'File Attachment'}</h4>
                                <p className="text-xs text-[#8696a0] mb-6 leading-relaxed">
                                    This file type cannot be previewed directly in the browser. Click below to download and view.
                                </p>
                                <a 
                                    href={previewMedia.url} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#25d366] hover:bg-[#1db954] active:scale-95 text-white text-xs font-bold transition-all shadow-md"
                                >
                                    Download Document
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
        </>
    );
}

export function WhatsAppSplashLoader() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                const increment = Math.floor(Math.random() * 20) + 15;
                return Math.min(prev + increment, 100);
            });
        }, 120);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className={`flex-1 flex flex-col items-center justify-center select-none h-full w-full rounded-2xl p-6 min-h-[450px] ${
            isDark ? 'bg-[#0b141a] text-[#e9edef]' : 'bg-[#f8f9fa] text-[#111b21]'
        }`}>
            <div className="flex flex-col items-center max-w-xs w-full text-center">
                {/* WhatsApp Logo */}
                <div className={`mb-8 animate-pulse ${isDark ? 'text-[#3b4a54]' : 'text-[#a6b1b7]'}`}>
                    <svg viewBox="0 0 448 512" className={`w-14 h-14 ${isDark ? 'fill-[#3b4a54]' : 'fill-[#a6b1b7]'}`} xmlns="http://www.w3.org/2000/svg">
                        <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
                    </svg>
                </div>

                {/* WhatsApp Title */}
                <h1 className={`text-lg font-semibold tracking-wider mb-6 ${isDark ? 'text-[#e9edef]' : 'text-[#41525d]'}`}>WhatsApp</h1>

                {/* Progress Bar Container */}
                <div className={`w-[240px] h-[3px] rounded-full overflow-hidden mb-8 relative ${isDark ? 'bg-[#2a3942]' : 'bg-[#e9edef]'}`}>
                    <div 
                        className="h-full bg-[#00a884] rounded-full transition-all duration-150 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* End-to-end encrypted footer */}
                <div className={`flex items-center justify-center gap-1.5 text-xs w-full ${isDark ? 'text-[#8696a0]' : 'text-[#667781]'}`}>
                    <svg viewBox="0 0 24 24" className={`w-3.5 h-3.5 ${isDark ? 'fill-[#8696a0]' : 'fill-[#667781]'}`} xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                    </svg>
                    <span className={`text-[11px] ${isDark ? 'text-[#8696a0]' : 'text-[#667781]'}`}>End-to-end encrypted</span>
                </div>
            </div>
        </div>
    );
}
