import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, Loader2, ArrowRight, ShieldCheck, KeyRound, CheckCircle2, ChevronLeft } from 'lucide-react';

type AuthView = 'login' | 'register' | 'forgot' | 'forgot-success';

const Auth = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [view, setView] = useState<AuthView>('login');
    const [error, setError] = useState<string | null>(null);

    const isLogin = view === 'login';

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            } else {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
            }
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });
            if (error) throw error;
            setView('forgot-success');
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const goBack = () => {
        setError(null);
        setEmail('');
        setView('login');
    };

    /* ─── Forgot Password Success Screen ─── */
    if (view === 'forgot-success') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
                <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden text-center space-y-6">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
                    <div className="relative z-10 space-y-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                            <CheckCircle2 size={32} className="text-white" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">E-mail enviado!</h1>
                            <p className="text-zinc-500 text-sm font-medium leading-relaxed">
                                Enviamos um link de redefinição para <span className="font-bold text-zinc-700 dark:text-zinc-300">{email}</span>. Verifique sua caixa de entrada.
                            </p>
                        </div>
                        <button
                            onClick={goBack}
                            className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-black text-sm shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            <ChevronLeft size={18} />
                            Voltar ao login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    /* ─── Forgot Password Form ─── */
    if (view === 'forgot') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
                <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                    <div className="relative z-10 space-y-8">
                        <button
                            onClick={goBack}
                            className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                        >
                            <ChevronLeft size={16} />
                            Voltar ao login
                        </button>

                        <div className="text-center space-y-2">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-400 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20 mb-6">
                                <KeyRound size={30} className="text-white" />
                            </div>
                            <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white">Esqueceu a senha?</h1>
                            <p className="text-zinc-500 text-sm font-medium">
                                Sem problema! Informe seu e-mail e enviaremos um link para redefinir sua senha.
                            </p>
                        </div>

                        <form onSubmit={handleForgotPassword} className="space-y-4">
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                                <input
                                    type="email"
                                    placeholder="Seu e-mail cadastrado"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400"
                                    required
                                />
                            </div>

                            {error && (
                                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 text-sm font-bold text-center">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-black text-sm shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    <>
                                        Enviar link de redefinição
                                        <ArrowRight size={20} />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    /* ─── Login / Register ─── */
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
            <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">

                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                <div className="relative z-10 space-y-8">
                    <div className="text-center space-y-2">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20 mb-6">
                            <ShieldCheck size={32} className="text-white" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
                            {isLogin ? 'Bem-vindo de volta' : 'Criar nova conta'}
                        </h1>
                        <p className="text-zinc-500 text-sm font-medium">
                            {isLogin ? 'Entre para acessar suas finanças.' : 'Comece a controlar seu dinheiro hoje.'}
                        </p>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-4">
                        <div className="space-y-4">
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                                <input
                                    type="email"
                                    placeholder="Seu e-mail"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400"
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                                    <input
                                        type="password"
                                        placeholder="Sua senha"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400"
                                        required
                                    />
                                </div>
                                {isLogin && (
                                    <div className="flex justify-end pr-1 pt-1">
                                        <button
                                            type="button"
                                            onClick={() => { setError(null); setView('forgot'); }}
                                            className="text-xs font-bold text-zinc-400 hover:text-blue-500 transition-colors"
                                        >
                                            Esqueceu sua senha?
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 text-sm font-bold text-center animate-in slide-in-from-top-2">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-black text-sm shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <>
                                    {isLogin ? 'Entrar' : 'Cadastrar'}
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="text-center">
                        <button
                            onClick={() => { setError(null); setView(isLogin ? 'register' : 'login'); }}
                            className="text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                        >
                            {isLogin ? (
                                <>Não tem uma conta? <span className="text-blue-500">Cadastre-se</span></>
                            ) : (
                                <>Já tem uma conta? <span className="text-blue-500">Entre agora</span></>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Auth;
