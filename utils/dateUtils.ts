
import { User, UserStatus, UserStatusData } from '../types';

export const calculateExpiryDate = (startDate: string, durationDays: number): string => {
  if (!startDate) return new Date().toISOString();
  
  const date = new Date(startDate);
  // Check if date is valid
  if (isNaN(date.getTime())) {
    // If invalid start date, default to today + duration
    const now = new Date();
    now.setDate(now.getDate() + durationDays);
    return now.toISOString();
  }
  
  date.setDate(date.getDate() + durationDays);
  return date.toISOString();
};

export const getUserStatus = (user: User): UserStatusData => {
  const now = new Date();
  
  if (!user.enrolled_classes || user.enrolled_classes.length === 0) {
    return {
      status: UserStatus.INACTIVE,
      daysRemaining: 0,
      color: 'bg-slate-100 text-slate-700 border-slate-200',
      label: 'Sem Plano',
      timeString: '-'
    };
  }

  if (user.status === UserStatus.PENDING_PAYMENT) {
    return {
      status: UserStatus.PENDING_PAYMENT,
      daysRemaining: 0,
      color: 'bg-blue-100 text-blue-700 border-blue-200',
      label: 'Pagamento Pendente',
      timeString: 'Aguardando'
    };
  }

  let expiryDateStr = user.subscription_end_date;
  // Handle missing or invalid date string
  if (!expiryDateStr) {
      expiryDateStr = new Date().toISOString(); 
  }

  let expiry = new Date(expiryDateStr);
  if (isNaN(expiry.getTime())) {
      // If invalid, assume expired/current time to allow UI to render safely
      expiry = new Date(); 
  }

  // Define expiry as the END of the expiry day (23:59:59)
  expiry.setHours(23, 59, 59, 999);

  const diffMs = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  // Calculate precise parts
  const isExpired = diffMs < 0;
  const absMs = Math.abs(diffMs);
  const days = Math.floor(absMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((absMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((absMs % (1000 * 60 * 60)) / (1000 * 60));

  let status: UserStatus;
  let color: string;
  let label: string;
  let timeString: string;

  if (isExpired) {
    status = UserStatus.EXPIRED;
    color = 'bg-rose-100 text-rose-700 border-rose-200';
    label = 'Expirado';
    // Logic: If expired < 24h ago, show hours. Else show days.
    if (days === 0) {
      timeString = `Há ${hours}h ${minutes}m`;
    } else {
      timeString = `Há ${days} dias`;
    }
  } else {
    // ACTIVE or WARNING logic
    if (diffMs <= (48 * 60 * 60 * 1000)) { // Less than 48 hours
      status = UserStatus.WARNING;
      color = 'bg-amber-100 text-amber-700 border-amber-200';
      label = 'Expira em breve';
      // Show format "28h 15m" or "02h 10m"
      const totalHours = Math.floor(absMs / (1000 * 60 * 60));
      timeString = `${totalHours}h ${minutes}m`;
    } else {
      status = UserStatus.ACTIVE;
      color = 'bg-emerald-100 text-emerald-700 border-emerald-200';
      label = 'Ativo';
      timeString = `${days} Dias`;
    }
  }

  return {
    status,
    daysRemaining: diffDays, 
    color,
    label,
    timeString
  };
};

export const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  
  try {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch (e) {
    return '-';
  }
};
