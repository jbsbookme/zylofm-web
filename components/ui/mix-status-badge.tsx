'use client';

import { Clock, CheckCircle, XCircle, Loader2, Eye } from 'lucide-react';

type MixStatus = 'PENDING' | 'PUBLISHED' | 'REJECTED' | 'PROCESSING' | 'DRAFT';

interface MixStatusBadgeProps {
  status: MixStatus | string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<string, {
  icon: React.ElementType;
  label: string;
  bgColor: string;
  textColor: string;
  iconColor: string;
}> = {
  PENDING: {
    icon: Clock,
    label: 'Pendiente',
    bgColor: 'bg-amber-500/15',
    textColor: 'text-amber-300',
    iconColor: 'text-amber-400',
  },
  PUBLISHED: {
    icon: CheckCircle,
    label: 'Publicado',
    bgColor: 'bg-emerald-500/15',
    textColor: 'text-emerald-300',
    iconColor: 'text-emerald-400',
  },
  REJECTED: {
    icon: XCircle,
    label: 'Rechazado',
    bgColor: 'bg-red-500/15',
    textColor: 'text-red-300',
    iconColor: 'text-red-400',
  },
  PROCESSING: {
    icon: Loader2,
    label: 'Procesando',
    bgColor: 'bg-blue-500/20',
    textColor: 'text-blue-400',
    iconColor: 'text-blue-500',
  },
  DRAFT: {
    icon: Eye,
    label: 'Borrador',
    bgColor: 'bg-zinc-500/20',
    textColor: 'text-zinc-400',
    iconColor: 'text-zinc-500',
  },
};

const sizeClasses = {
  sm: {
    container: 'px-1.5 py-0.5 text-xs gap-1',
    icon: 'w-3 h-3',
  },
  md: {
    container: 'px-2 py-1 text-xs gap-1.5',
    icon: 'w-3.5 h-3.5',
  },
  lg: {
    container: 'px-3 py-1.5 text-sm gap-2',
    icon: 'w-4 h-4',
  },
};

export function MixStatusBadge({ status, showLabel = true, size = 'md' }: MixStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.PENDING;
  const sizeClass = sizeClasses[size];
  const Icon = config.icon;
  const isProcessing = status === 'PROCESSING';

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${config.bgColor} ${config.textColor} ${sizeClass.container}`}
    >
      <Icon className={`${sizeClass.icon} ${config.iconColor} ${isProcessing ? 'animate-spin' : ''}`} />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}

export function getStatusInfo(status: string) {
  return statusConfig[status] || statusConfig.PENDING;
}
