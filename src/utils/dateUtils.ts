/**
 * Formata uma data TIMESTAMPTZ do banco de dados para exibição
 * @param dateString - String no formato "2025-08-15 19:54:24.059309-03"
 * @returns String formatada como "15/08/2025 19:54"
 */
export function formatDateTime(dateString: string): string {
  try {
    // Remove os microssegundos e converte para um formato que o Date pode processar
    const cleanDateString = dateString.replace(/(\.\d{6})([+-]\d{2})$/, '$2:00');
    
    const date = new Date(cleanDateString);
    
    if (isNaN(date.getTime())) {
      return 'Data inválida';
    }
    
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo'
    });
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return 'Data inválida';
  }
}

/**
 * Formata apenas a data (sem horário) de uma string TIMESTAMPTZ
 * @param dateString - String no formato "2025-08-15 19:54:24.059309-03"
 * @returns String formatada como "15/08/2025"
 */
export function formatDate(dateString: string): string {
  try {
    const cleanDateString = dateString.replace(/(\.\d{6})([+-]\d{2})$/, '$2:00');
    const date = new Date(cleanDateString);
    
    if (isNaN(date.getTime())) {
      return 'Data inválida';
    }
    
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'America/Sao_Paulo'
    });
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return 'Data inválida';
  }
}

/**
 * Formata apenas o horário de uma string TIMESTAMPTZ
 * @param dateString - String no formato "2025-08-15 19:54:24.059309-03"
 * @returns String formatada como "19:54"
 */
export function formatTime(dateString: string): string {
  try {
    const cleanDateString = dateString.replace(/(\.\d{6})([+-]\d{2})$/, '$2:00');
    const date = new Date(cleanDateString);
    
    if (isNaN(date.getTime())) {
      return 'Horário inválido';
    }
    
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo'
    });
  } catch (error) {
    console.error('Erro ao formatar horário:', error);
    return 'Horário inválido';
  }
}
