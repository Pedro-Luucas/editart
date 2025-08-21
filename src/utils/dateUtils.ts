/**
 * Funções utilitárias para formatação de datas
 */

/**
 * Formata uma data/hora completa para o formato brasileiro
 * @param dateString - String da data no formato ISO 8601/RFC3339 ou similar
 * @returns Data formatada como "dd/mm/yyyy HH:mm"
 */
export function formatDateTime(dateString: string): string {
  if (!dateString) {
    console.warn('formatDateTime: dateString is empty or null');
    return "Data inválida";
  }
  
  try {
    // Tenta criar a data de várias formas
    let date: Date;
    
    // Se já é uma string ISO válida, usa diretamente
    if (dateString.includes('T') || dateString.includes('Z') || dateString.match(/[+-]\d{2}:\d{2}$/)) {
      date = new Date(dateString);
    } else {
      // Tenta formatos alternativos
      date = new Date(dateString);
    }
    
    // Verifica se a data é válida
    if (isNaN(date.getTime())) {
      console.warn('formatDateTime: Invalid date string:', dateString);
      return "Data inválida";
    }
    
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Erro ao formatar data:', error, 'Input:', dateString);
    return "Data inválida";
  }
}

/**
 * Formata apenas a data (sem hora) para o formato brasileiro
 * @param dateString - String da data no formato ISO 8601/RFC3339 ou similar
 * @returns Data formatada como "dd/mm/yyyy"
 */
export function formatDateOnly(dateString: string): string {
  if (!dateString) {
    console.warn('formatDateOnly: dateString is empty or null');
    return "Data inválida";
  }
  
  try {
    // Tenta criar a data de várias formas
    let date: Date;
    
    // Se já é uma string ISO válida, usa diretamente
    if (dateString.includes('T') || dateString.includes('Z') || dateString.match(/[+-]\d{2}:\d{2}$/)) {
      date = new Date(dateString);
    } else {
      // Tenta formatos alternativos
      date = new Date(dateString);
    }
    
    // Verifica se a data é válida
    if (isNaN(date.getTime())) {
      console.warn('formatDateOnly: Invalid date string:', dateString);
      return "Data inválida";
    }
    
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Erro ao formatar data:', error, 'Input:', dateString);
    return "Data inválida";
  }
}

/**
 * Formata uma data para o formato de input HTML (yyyy-mm-dd)
 * @param dateString - String da data no formato ISO 8601 ou similar
 * @returns Data formatada como "yyyy-mm-dd"
 */
export function formatDateForInput(dateString: string): string {
  if (!dateString) return "";
  
  try {
    const date = new Date(dateString);
    
    // Verifica se a data é válida
    if (isNaN(date.getTime())) {
      return "";
    }
    
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.error('Erro ao formatar data para input:', error);
    return "";
  }
}

/**
 * Converte uma data do formato de input HTML (yyyy-mm-dd) para o formato esperado pelo backend
 * @param inputDate - Data no formato "yyyy-mm-dd"
 * @returns Data no formato ISO 8601 ou string vazia se inválida
 */
export function convertInputDateToBackend(inputDate: string): string {
  if (!inputDate) return "";
  
  try {
    const date = new Date(inputDate + 'T00:00:00Z');
    
    // Verifica se a data é válida
    if (isNaN(date.getTime())) {
      return "";
    }
    
    return date.toISOString();
  } catch (error) {
    console.error('Erro ao converter data para backend:', error);
    return "";
  }
}
