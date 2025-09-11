import { Wrench, Save, RefreshCw, FileText, UserPlus, AlertTriangle, X, Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { invoke } from '@tauri-apps/api/core';
import { useState } from 'react';

interface SettingsProps {
  user?: {
    id: string;
    login: string;
    role: string;
  };
  onNavigate?: (page: string) => void;
}



export default function Settings({ user, onNavigate }: SettingsProps) {



  const [backupStatus, setBackupStatus] = useState<string | null>(null);
  const [showBackupConfirm, setShowBackupConfirm] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [userForm, setUserForm] = useState({
    login: '',
    password: '',
    role: 'user' as 'admin' | 'user'
  });
  const [userFormErrors, setUserFormErrors] = useState<Record<string, string>>({});

  async function handleCreateBackup() {
    try {
      const result = await invoke<string>('create_database_backup');
      setBackupStatus(result);
      setShowBackupConfirm(false);
      alert(result); // ou use toast
    } catch (err) {
      console.error(err);
      alert('Falha ao criar backup');
    }
  }
  
  async function handleRestoreBackup() {
    try {
      const result = await invoke<string>('restore_database_backup');
      setBackupStatus(result);
      setShowRestoreConfirm(false);
      alert(result);
    } catch (err) {
      console.error(err);
      alert('Falha ao restaurar backup');
    }
  }
  
  async function handleGetBackupInfo() {
    try {
      const info = await invoke<string | null>('get_backup_info');
      setBackupStatus(info);
      console.log(backupStatus)
    } catch (err) {
      console.error(err);
      alert('Falha ao buscar informações do backup');
    }
  }

  function validateUserForm() {
    const errors: Record<string, string> = {};
    
    if (!userForm.login.trim()) {
      errors.login = 'Login é obrigatório';
    } else if (userForm.login.length < 3) {
      errors.login = 'Login deve ter pelo menos 3 caracteres';
    }
    
    if (!userForm.password.trim()) {
      errors.password = 'Senha é obrigatória';
    } else if (userForm.password.length < 6) {
      errors.password = 'Senha deve ter pelo menos 6 caracteres';
    }
    
    setUserFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleCreateUser() {
    if (!validateUserForm()) {
      return;
    }

    try {
      await invoke('create_user', {
        createUserDto: {
          login: userForm.login.trim(),
          password: userForm.password,
          role: userForm.role
        }
      });
      
      // Reset form and close modal
      setUserForm({ login: '', password: '', role: 'user' });
      setUserFormErrors({});
      setShowUserModal(false);
      alert('Usuário criado com sucesso!');
    } catch (err) {
      console.error(err);
      alert(`Falha ao criar usuário: ${err}`);
    }
  }

  function handleUserFormChange(field: string, value: string) {
    setUserForm(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (userFormErrors[field]) {
      setUserFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  }
  

  return (
    <div className="max-w-5xl mx-auto">
      <div className="border-b border-primary-600 pb-4 mb-6">
        <h1 className="text-2xl font-bold text-gradient-secondary mb-2">
          Configurações
        </h1>
        <p className="text-primary-300">
          Personalize sua experiência no EditArt
        </p>
      </div>

      <div className="space-y-6">

        {/* Seção Administração - Apenas para Admin */}
        {user?.role === "admin" && (
          <div className="glass-effect p-6 rounded-xl border-l-4 border-l-amber-500">
            <h2 className="text-lg font-bold text-primary-100 mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-amber-400" />
              Administração
            </h2>
            <p className="text-primary-400 text-sm mb-4">
              Funcionalidades exclusivas para administradores
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={() => setShowUserModal(true)}
                className="px-6 py-3 rounded-xl font-medium hover-lift transition-all"
              >
                <span className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Cadastrar Usuário
                </span>
              </Button>
            </div>
          </div>
        )}

        {/* Ações */}
        <div className="glass-effect p-6 rounded-xl">
          <h2 className="text-lg font-bold text-primary-100 mb-4 flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            Manutenção
          </h2>
          
          <div className="flex flex-wrap gap-4">
          <Button
  onClick={() => setShowBackupConfirm(true)}
  className="px-6 py-3 rounded-xl font-medium hover-lift transition-all"
>
  <span className="flex items-center gap-2">
    <Save className="w-4 h-4" />
    Fazer Backup
  </span>
</Button>

<Button
  onClick={() => setShowRestoreConfirm(true)}
  className="px-6 py-3 rounded-xl font-medium hover-lift transition-all"
>
  <span className="flex items-center gap-2">
    <RefreshCw className="w-4 h-4" />
    Restaurar Backup
  </span>
</Button>

<Button
  onClick={handleGetBackupInfo}
  variant="outline"
  className="px-6 py-3 text-primary-300 rounded-xl font-medium transition-all"
>
  <span className="flex items-center gap-2">
    <FileText className="w-4 h-4" />
    Informações do Backup
  </span>
</Button>

          </div>
        </div>
      </div>

      {/* Modal de Confirmação para Backup */}
      {showBackupConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-effect p-6 rounded-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-primary-100 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Confirmar Backup
              </h3>
              <button
                onClick={() => setShowBackupConfirm(false)}
                className="text-primary-400 hover:text-primary-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-primary-300 mb-6">
              Tem certeza que deseja criar um backup do banco de dados? Esta operação pode levar alguns minutos.
            </p>
            
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowBackupConfirm(false)}
                className="px-4 py-2 text-primary-300"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateBackup}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700"
              >
                <span className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Confirmar Backup
                </span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação para Restaurar */}
      {showRestoreConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-effect p-6 rounded-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-primary-100 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Confirmar Restauração
              </h3>
              <button
                onClick={() => setShowRestoreConfirm(false)}
                className="text-primary-400 hover:text-primary-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4 mb-4">
              <p className="text-red-300 text-sm font-medium mb-2">⚠️ ATENÇÃO:</p>
              <p className="text-red-200 text-sm">
                Esta operação irá substituir todos os dados atuais pelos dados do backup. 
                Todos os dados não salvos serão perdidos permanentemente.
              </p>
            </div>
            
            <p className="text-primary-300 mb-6">
              Tem certeza absoluta que deseja restaurar o backup? Esta ação não pode ser desfeita.
            </p>
            
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowRestoreConfirm(false)}
                className="px-4 py-2 text-primary-300"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleRestoreBackup}
                className="px-4 py-2 bg-red-600 hover:bg-red-700"
              >
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Confirmar Restauração
                </span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cadastro de Usuário */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-effect p-6 rounded-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-primary-100 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-400" />
                Cadastrar Novo Usuário
              </h3>
              <button
                onClick={() => {
                  setShowUserModal(false);
                  setUserForm({ login: '', password: '', role: 'user' });
                  setUserFormErrors({});
                }}
                className="text-primary-400 hover:text-primary-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Login Field */}
              <div>
                <Label htmlFor="login" className="text-primary-200 text-sm font-medium">
                  Login *
                </Label>
                <Input
                  id="login"
                  type="text"
                  value={userForm.login}
                  onChange={(e) => handleUserFormChange('login', e.target.value)}
                  placeholder="Digite o login do usuário"
                  className={`mt-1 ${userFormErrors.login ? 'border-red-500' : ''}`}
                />
                {userFormErrors.login && (
                  <p className="text-red-400 text-xs mt-1">{userFormErrors.login}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <Label htmlFor="password" className="text-primary-200 text-sm font-medium">
                  Senha *
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={userForm.password}
                    onChange={(e) => handleUserFormChange('password', e.target.value)}
                    placeholder="Digite a senha"
                    className={`pr-10 ${userFormErrors.password ? 'border-red-500' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary-400 hover:text-primary-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {userFormErrors.password && (
                  <p className="text-red-400 text-xs mt-1">{userFormErrors.password}</p>
                )}
              </div>

              {/* Role Field */}
              <div>
                <Label htmlFor="role" className="text-primary-200 text-sm font-medium">
                  Função *
                </Label>
                <select
                  id="role"
                  value={userForm.role}
                  onChange={(e) => handleUserFormChange('role', e.target.value)}
                  className="mt-1 w-full px-3 py-2 bg-primary-800 border border-primary-600 rounded-lg text-primary-100 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                >
                  <option value="user">Usuário</option>
                  <option value="admin">Administrador</option>
                </select>
                <p className="text-primary-500 text-xs mt-1">
                  Administradores têm acesso completo ao sistema
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 justify-end mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowUserModal(false);
                  setUserForm({ login: '', password: '', role: 'user' });
                  setUserFormErrors({});
                }}
                className="px-4 py-2 text-primary-300"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateUser}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700"
              >
                <span className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Criar Usuário
                </span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
