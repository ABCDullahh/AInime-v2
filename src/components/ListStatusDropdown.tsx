import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Eye, Check, X, Heart, Bookmark, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ListStatus = 'SAVED' | 'LOVED' | 'WATCHING' | 'WATCHED' | 'DROPPED';

interface StatusOption {
    value: ListStatus;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    activeColor: string;
}

export const STATUS_OPTIONS: StatusOption[] = [
    { value: 'WATCHING', label: 'Watching', icon: Eye, color: 'text-[#d0bcff]', activeColor: '#d0bcff' },
    { value: 'WATCHED', label: 'Completed', icon: Check, color: 'text-emerald-400', activeColor: '#34d399' },
    { value: 'SAVED', label: 'Plan to Watch', icon: Bookmark, color: 'text-[#93ccff]', activeColor: '#93ccff' },
    { value: 'LOVED', label: 'Favorite', icon: Heart, color: 'text-[#f97316]', activeColor: '#f97316' },
    { value: 'DROPPED', label: 'Dropped', icon: X, color: 'text-slate-400', activeColor: '#94a3b8' },
];

interface ListStatusDropdownProps {
    currentStatus?: ListStatus;
    onStatusChange: (status: ListStatus) => void;
    onRemove?: () => void;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'button' | 'badge' | 'icon';
    className?: string;
}

/** Shared dropdown menu rendered via portal with fixed positioning */
function DropdownMenu({
    currentStatus,
    onStatusChange,
    onRemove,
    onClose,
    buttonRect,
    align = 'left',
    menuWidth = 256,
    showHeader = false,
}: {
    currentStatus?: ListStatus;
    onStatusChange: (status: ListStatus) => void;
    onRemove?: () => void;
    onClose: () => void;
    buttonRect: DOMRect;
    align?: 'left' | 'right';
    menuWidth?: number;
    showHeader?: boolean;
}) {
    const menuRef = useRef<HTMLDivElement>(null);

    // Calculate position: prefer below, flip above if no room
    const spaceBelow = window.innerHeight - buttonRect.bottom - 8;
    const estimatedMenuHeight = 320; // rough estimate
    const placeAbove = spaceBelow < estimatedMenuHeight && buttonRect.top > estimatedMenuHeight;

    let top: number;
    if (placeAbove) {
        top = buttonRect.top - 8; // will use bottom anchor via transform
    } else {
        top = buttonRect.bottom + 8;
    }

    let left: number;
    if (align === 'right') {
        left = Math.max(8, buttonRect.right - menuWidth);
    } else {
        left = Math.min(buttonRect.left, window.innerWidth - menuWidth - 8);
    }

    // Click outside handler
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        }
        // Use setTimeout to avoid the same click that opened the menu from closing it
        const timer = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
        }, 0);
        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    // Close on scroll (the fixed position won't follow the button)
    useEffect(() => {
        const handleScroll = () => onClose();
        window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
        return () => window.removeEventListener('scroll', handleScroll, true);
    }, [onClose]);

    const handleStatusClick = (status: ListStatus, e: React.MouseEvent) => {
        e.stopPropagation();
        onStatusChange(status);
        onClose();
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        onRemove?.();
        onClose();
    };

    return createPortal(
        <div
            ref={menuRef}
            className="animate-fade-in"
            style={{
                position: 'fixed',
                top: placeAbove ? undefined : top,
                bottom: placeAbove ? (window.innerHeight - buttonRect.top + 8) : undefined,
                left,
                width: menuWidth,
                zIndex: 9999,
                background: 'rgba(21, 27, 45, 0.95)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 20px 60px -15px rgba(0,0,0,0.5)',
                borderRadius: '1rem',
                overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Optional header */}
            {showHeader && (
                <div className="px-5 pt-4 pb-2">
                    <span className="text-[0.65rem] tracking-[0.2em] font-black uppercase text-slate-500">
                        Set watch status
                    </span>
                </div>
            )}

            {/* Options */}
            <div className={showHeader ? "px-2 pb-2" : "p-1.5"}>
                {STATUS_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const isActive = option.value === currentStatus;
                    return (
                        <button
                            key={option.value}
                            onClick={(e) => handleStatusClick(option.value, e)}
                            className={cn(
                                "w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all duration-200 group/item",
                                isActive
                                    ? "bg-[#23293c]"
                                    : "hover:bg-[#23293c]/60"
                            )}
                        >
                            {showHeader ? (
                                <div
                                    className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
                                        isActive ? "scale-110" : "group-hover/item:scale-105"
                                    )}
                                    style={{
                                        background: isActive ? `${option.activeColor}20` : 'rgba(35,41,60,0.5)',
                                    }}
                                >
                                    <Icon className={cn(
                                        "w-4 h-4 transition-colors",
                                        isActive ? option.color : "text-slate-400 group-hover/item:" + option.color
                                    )} />
                                </div>
                            ) : (
                                <Icon className={cn("w-4 h-4", option.color)} />
                            )}
                            <span className={cn(
                                "font-semibold text-sm",
                                isActive ? option.color : "text-[#dce1fb]/80"
                            )}>
                                {option.label}
                            </span>
                            {isActive && (
                                showHeader ? (
                                    <div className="ml-auto w-5 h-5 rounded-full bg-[#f97316]/20 flex items-center justify-center">
                                        <Check className="w-3 h-3 text-[#f97316]" />
                                    </div>
                                ) : (
                                    <Check className="w-4 h-4 ml-auto text-[#f97316]" />
                                )
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Remove action */}
            {currentStatus && onRemove && (
                <div className="px-1.5 pb-1.5">
                    <div className="h-[1px] bg-white/5 mx-2 mb-1.5" />
                    <button
                        onClick={handleRemove}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all duration-200"
                    >
                        {showHeader ? (
                            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                                <X className="w-4 h-4" />
                            </div>
                        ) : (
                            <X className="w-4 h-4" />
                        )}
                        <span className="font-semibold text-sm">Remove from List</span>
                    </button>
                </div>
            )}
        </div>,
        document.body
    );
}

export function ListStatusDropdown({
    currentStatus,
    onStatusChange,
    onRemove,
    size = 'md',
    variant = 'button',
    className,
}: ListStatusDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);

    const handleClose = useCallback(() => {
        setIsOpen(false);
    }, []);

    const toggleDropdown = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isOpen && buttonRef.current) {
            setButtonRect(buttonRef.current.getBoundingClientRect());
        }
        setIsOpen(!isOpen);
    };

    const currentOption = STATUS_OPTIONS.find(opt => opt.value === currentStatus);

    // Icon-only variant for compact displays
    if (variant === 'icon') {
        return (
            <div className={cn("relative", className)}>
                <button
                    ref={buttonRef}
                    onClick={toggleDropdown}
                    className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                        currentStatus
                            ? "bg-[#23293c] hover:bg-[#2e3447]"
                            : "bg-[#f97316] text-[#582200] hover:scale-105"
                    )}
                >
                    {currentOption ? (
                        <currentOption.icon className={cn("w-5 h-5", currentOption.color)} />
                    ) : (
                        <Plus className="w-5 h-5" />
                    )}
                </button>

                {isOpen && buttonRect && (
                    <DropdownMenu
                        currentStatus={currentStatus}
                        onStatusChange={onStatusChange}
                        onRemove={onRemove}
                        onClose={handleClose}
                        buttonRect={buttonRect}
                        align="right"
                        menuWidth={224}
                    />
                )}
            </div>
        );
    }

    // Badge variant for showing current status
    if (variant === 'badge' && currentStatus) {
        return (
            <div className={cn("relative", className)}>
                <button
                    ref={buttonRef}
                    onClick={toggleDropdown}
                    className="flex items-center gap-2 px-5 py-2 rounded-full transition-all duration-300 hover:scale-105"
                    style={{
                        background: `${currentOption!.activeColor}15`,
                        border: `1px solid ${currentOption!.activeColor}30`,
                    }}
                >
                    {currentOption && <currentOption.icon className={cn("w-4 h-4", currentOption.color)} />}
                    <span className={cn("font-bold text-xs tracking-wide", currentOption!.color)}>
                        {currentOption!.label}
                    </span>
                    <ChevronDown className={cn(
                        "w-3 h-3 transition-transform duration-300",
                        currentOption!.color,
                        isOpen && "rotate-180"
                    )} />
                </button>

                {isOpen && buttonRect && (
                    <DropdownMenu
                        currentStatus={currentStatus}
                        onStatusChange={onStatusChange}
                        onRemove={onRemove}
                        onClose={handleClose}
                        buttonRect={buttonRect}
                        align="left"
                        menuWidth={224}
                    />
                )}
            </div>
        );
    }

    // Default button variant - Editorial pill style
    return (
        <div className={cn("relative", className)}>
            <button
                ref={buttonRef}
                onClick={toggleDropdown}
                className={cn(
                    "inline-flex items-center gap-2.5 rounded-full font-bold tracking-tight transition-all duration-300 hover:scale-105 active:scale-95",
                    size === 'sm' && "text-xs px-4 py-2",
                    size === 'md' && "text-sm px-6 py-3",
                    size === 'lg' && "text-base px-8 py-4",
                    currentStatus
                        ? ""
                        : "bg-[#f97316] text-[#582200] hover:shadow-[0_0_30px_-5px_rgba(249,115,22,0.4)]"
                )}
                style={currentStatus ? {
                    background: `${currentOption!.activeColor}12`,
                    border: `1.5px solid ${currentOption!.activeColor}40`,
                    color: currentOption!.activeColor,
                } : undefined}
            >
                {currentOption ? (
                    <>
                        <currentOption.icon className="w-4 h-4" />
                        <span>{currentOption.label}</span>
                    </>
                ) : (
                    <>
                        <Plus className="w-4 h-4" />
                        <span>Add to List</span>
                    </>
                )}
                <ChevronDown className={cn(
                    "w-4 h-4 transition-transform duration-300",
                    isOpen && "rotate-180"
                )} />
            </button>

            {isOpen && buttonRect && (
                <DropdownMenu
                    currentStatus={currentStatus}
                    onStatusChange={onStatusChange}
                    onRemove={onRemove}
                    onClose={handleClose}
                    buttonRect={buttonRect}
                    align="left"
                    menuWidth={256}
                    showHeader
                />
            )}
        </div>
    );
}
