import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Users, ClipboardList } from 'lucide-react';

function Home() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    setGreetMsg(await invoke("greet", { name }));
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="border-b border-primary-600 pb-4 mb-6">
        <h1 className="text-2xl font-bold text-gradient-secondary mb-2">
          Bem-vindo ao EditArt
        </h1>
        <p className="text-primary-300">
          Sistema de gestão de clientes desenvolvido com Tauri + React
        </p>
      </div>

      <main>
        <div className="text-center max-w-5xl mx-auto">

          <div className="my-8">
            <h3 className="text-lg font-semibold text-primary-100 mb-4">
              Ações Rápidas
            </h3>
            <div className="flex gap-4 justify-center flex-wrap">
              <a 
                href="#clients" 
                className="group inline-flex items-center gap-2 px-6 py-3 bg-secondary-500 text-primary-900 rounded-lg font-semibold hover-lift shadow-secondary hover:shadow-secondary transition-all duration-300"
              >
                <Users className="w-5 h-5" />
                <span>Gestão de Clientes</span>
              </a>
              <a 
                href="#orders" 
                className="group inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-primary-100 rounded-lg font-semibold hover-lift shadow-teal hover:shadow-teal transition-all duration-300"
              >
                <ClipboardList className="w-5 h-5" />
                <span>Gestão de Pedidos</span>
              </a>
            </div>
          </div>

          <div className="my-8 p-6 glass-effect rounded-xl">
            <h3 className="text-lg font-semibold text-primary-100 mb-4">
              Teste de Conexão
            </h3>
            <form
              className="flex gap-3 justify-center my-4"
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
                className="input-dark px-4 py-2 rounded-lg min-w-60"
              />
              <button 
                type="submit"
                className="px-6 py-2 bg-secondary-500 text-primary-900 rounded-lg font-semibold hover-lift shadow-secondary transition-all duration-200"
              >
                Testar
              </button>
            </form>
            {greetMsg && (
              <p className="mt-4 inline-block px-4 py-2 bg-teal-600 text-primary-100 rounded-lg font-medium shadow-teal">
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
