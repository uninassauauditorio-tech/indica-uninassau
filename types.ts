
export enum ReferralStatus {
  RECEIVED = 'Indicação Recebida',
  CONTACTED = 'Em Contato',
  INTERESTED = 'Interessado',
  DOCS_PENDING = 'Documentação Pendente',
  ENROLLED = 'Matriculado',
  NOT_CONVERTED = 'Não Convertido'
}

export interface Usuario {
  id: string;
  nome: string;
  perfil: 'admin' | 'funcionario';
  created_at: string;
}

export interface Funcionario {
  id: string;
  usuario_id: string;
  ativo: boolean;
  usuarios?: Usuario;
}

export interface Candidato {
  id: string;
  nome_completo: string;
  telefone: string;
  curso_interesse: string;
  cpf?: string;
  created_at: string;
}

export interface Indicacao {
  id: string;
  candidato_id: string;
  funcionario_id: string;
  status: ReferralStatus;
  created_at: string;
  candidatos?: Candidato;
  funcionarios?: Funcionario;
}

export interface HistoricoStatus {
  id: string;
  indicacao_id: string;
  status: string;
  alterado_por: string;
  data_alteracao: string;
}

export const getStatusColor = (status: ReferralStatus) => {
  switch (status) {
    case ReferralStatus.ENROLLED: return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    case ReferralStatus.RECEIVED: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
    case ReferralStatus.CONTACTED: return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    case ReferralStatus.INTERESTED: return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
    case ReferralStatus.DOCS_PENDING: return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    case ReferralStatus.NOT_CONVERTED: return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    default: return 'bg-slate-100 text-slate-700';
  }
};

export const maskCPF = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

export const maskPhone = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1');
};
