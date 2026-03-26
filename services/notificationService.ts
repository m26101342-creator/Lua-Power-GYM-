import { User, UserStatus } from '../types';
import { getUserStatus } from '../utils/dateUtils';

const STORAGE_KEY = 'gymlink_notifications_sent';

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) return false;
  
  if (Notification.permission === 'granted') return true;
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
};

export const checkAndScheduleNotifications = async (clients: User[]) => {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  const today = new Date().toISOString().split('T')[0];
  const sentLog = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  let hasUpdates = false;

  clients.forEach(client => {
    const statusData = getUserStatus(client);
    const key = `${client.id}-${today}`;

    // Verificamos se já notificamos este cliente hoje para evitar spam
    if (sentLog[key]) return;

    // Condição: Status Warning (<= 2 dias) ou Expired hoje (0 dias)
    if (statusData.status === UserStatus.WARNING || (statusData.status === UserStatus.EXPIRED && statusData.daysRemaining === 0)) {
      
      const now = new Date();
      const nineAM = new Date();
      nineAM.setHours(9, 0, 0, 0);

      // Se vence hoje (Dia D)
      if (statusData.daysRemaining === 0) {
        if (now >= nineAM) {
          // Já passou das 9h, notificar imediatamente
          new Notification(`🚨 Vencimento Hoje: ${client.name}`, {
            body: `O plano vence hoje! Envie uma mensagem de cobrança agora.`,
            icon: 'https://cdn-icons-png.flaticon.com/512/3523/3523063.png',
            tag: `expiry-${client.id}`
          });
          sentLog[key] = true;
          hasUpdates = true;
        } else {
          // Antes das 9h, agendar timeout
          const delay = nineAM.getTime() - now.getTime();
          // Só agenda se o delay for razoável (menos de 24h, o que é verdade aqui)
          setTimeout(() => {
            new Notification(`🚨 Vencimento Hoje: ${client.name}`, {
              body: `09:00 - O plano de ${client.name} vence hoje!`,
              icon: 'https://cdn-icons-png.flaticon.com/512/3523/3523063.png',
              tag: `expiry-${client.id}`
            });
            // Atualiza log no callback para evitar reenvio se a página for recarregada após o disparo
            const currentLog = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            currentLog[key] = true;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(currentLog));
          }, delay);
        }
      } 
      // Se é um dia de aviso (1 ou 2 dias antes)
      else if (statusData.status === UserStatus.WARNING) {
        new Notification(`⚠️ Vence em Breve: ${client.name}`, {
          body: `Faltam ${statusData.daysRemaining} dias para o vencimento.`,
          icon: 'https://cdn-icons-png.flaticon.com/512/3523/3523063.png',
          tag: `warning-${client.id}`
        });
        sentLog[key] = true;
        hasUpdates = true;
      }
    }
  });

  if (hasUpdates) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sentLog));
  }
};