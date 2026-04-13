import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function Auth() {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (tab === "login") {
      const { error } = await signIn(email, password);
      if (error) toast.error(error.message);
    } else {
      if (password.length < 6) {
        toast.error("Senha deve ter pelo menos 6 caracteres");
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, name);
      if (error) toast.error(error.message);
      else toast.success("Conta criada! Verifique seu e-mail.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 py-8">
      <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
        Finx<span className="text-accent">.</span>
      </h1>
      <p className="text-sm text-muted-foreground mb-10 text-center">
        Controle financeiro inteligente
      </p>

      <div className="glass-card p-7 w-full max-w-sm">
        <div className="flex gap-1 bg-background rounded-lg p-1 mb-6">
          <button
            onClick={() => setTab("login")}
            className={`flex-1 py-2 rounded-md text-sm font-semibold transition-colors ${
              tab === "login" ? "bg-secondary text-foreground" : "text-muted-foreground"
            }`}
          >
            Entrar
          </button>
          <button
            onClick={() => setTab("register")}
            className={`flex-1 py-2 rounded-md text-sm font-semibold transition-colors ${
              tab === "register" ? "bg-secondary text-foreground" : "text-muted-foreground"
            }`}
          >
            Cadastrar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {tab === "register" && (
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1.5 block">
                Nome
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                className="w-full bg-secondary border border-border rounded-lg px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
                required
              />
            </div>
          )}
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1.5 block">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full bg-secondary border border-border rounded-lg px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
              required
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1.5 block">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={tab === "register" ? "Mínimo 6 caracteres" : "Sua senha"}
              className="w-full bg-secondary border border-border rounded-lg px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-base transition-colors hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 mt-1"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {tab === "login" ? "Entrar" : "Criar conta"}
          </button>
        </form>
      </div>
    </div>
  );
}
