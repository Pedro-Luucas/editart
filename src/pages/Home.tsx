import { useState } from "react";
import reactLogo from "../assets/react.svg";
import { invoke } from "@tauri-apps/api/core";

function Home() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    setGreetMsg(await invoke("greet", { name }));
  }

  return (
    <div className="max-w-6xl mx-auto p-5">
      <div className="border-b-2 border-gray-200 dark:border-gray-700 pb-5 mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          EditArt - Sistema de Gestão
        </h1>
        <nav className="text-sm text-gray-600 dark:text-gray-400">
          <span className="text-gray-900 dark:text-white font-medium">Início</span>
          <span className="mx-2 text-gray-300">|</span>
          <a 
            href="#create-client" 
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
          >
            Cadastrar Cliente
          </a>
        </nav>
      </div>

      <main>
        <div className="text-center max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-8">
            Bem-vindo ao EditArt
          </h2>
          
          <div className="flex justify-center gap-5 my-8">
            <a href="https://vite.dev" target="_blank" rel="noopener noreferrer">
              <img 
                src="/vite.svg" 
                className="h-24 p-6 transition-all duration-700 hover:logo-vite" 
                alt="Vite logo" 
              />
            </a>
            <a href="https://tauri.app" target="_blank" rel="noopener noreferrer">
              <img 
                src="/tauri.svg" 
                className="h-24 p-6 transition-all duration-700 hover:logo-tauri" 
                alt="Tauri logo" 
              />
            </a>
            <a href="https://react.dev" target="_blank" rel="noopener noreferrer">
              <img 
                src={reactLogo} 
                className="h-24 p-6 transition-all duration-700 hover:logo-react" 
                alt="React logo" 
              />
            </a>
          </div>
          
          <p className="text-gray-700 dark:text-gray-300 mb-12">
            Sistema de gestão de clientes desenvolvido com Tauri + React
          </p>

          <div className="my-12">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Ações Rápidas
            </h3>
            <div className="flex gap-4 justify-center flex-wrap">
              <a 
                href="#create-client" 
                className="inline-block px-8 py-4 bg-blue-600 text-white rounded-lg font-medium text-base transition-all duration-300 hover:bg-blue-700 hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
              >
                📝 Cadastrar Novo Cliente
              </a>
              <button 
                className="inline-block px-8 py-4 bg-gray-200 text-gray-600 rounded-lg font-medium text-base opacity-60 cursor-not-allowed"
                disabled
              >
                📋 Listar Clientes
              </button>
            </div>
          </div>

          <div className="my-12 p-8 bg-gray-100 dark:bg-gray-800 rounded-xl">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Teste de Conexão
            </h3>
            <form
              className="flex gap-3 justify-center my-5"
              onSubmit={(e) => {
                e.preventDefault();
                greet();
              }}
            >
              <input
                id="greet-input"
                onChange={(e) => setName(e.currentTarget.value)}
                placeholder="Digite seu nome..."
                value={name}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button 
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
              >
                Testar
              </button>
            </form>
            {greetMsg && (
              <p className="mt-4 inline-block px-5 py-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-lg">
                {greetMsg}
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Home;
