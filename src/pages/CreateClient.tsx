import ClientForm from "../components/ClientForm";

export default function CreateClient() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="border-b border-primary-600 pb-4 mb-6">
        <h1 className="text-2xl font-bold text-gradient-secondary mb-2">
          Cadastrar Cliente
        </h1>
        <p className="text-primary-300">
          Adicione um novo cliente ao sistema
        </p>
      </div>
      
      <main>
        <ClientForm />
      </main>
    </div>
  );
}
