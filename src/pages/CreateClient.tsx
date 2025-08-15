import ClientForm from "../components/ClientForm";

export default function CreateClient() {
  return (
    <div className="max-w-6xl mx-auto p-5">
      <div className="border-b-2 border-gray-200 dark:border-gray-700 pb-5 mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Gestão de Clientes
        </h1>
        <nav className="text-sm text-gray-600 dark:text-gray-400">
          <a 
            href="#home" 
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
          >
            Início
          </a>
          <span className="mx-2 text-gray-300">|</span>
          <span className="text-gray-900 dark:text-white font-medium">Cadastrar Cliente</span>
        </nav>
      </div>
      
      <main>
        <ClientForm />
      </main>
    </div>
  );
}
