import React from 'react';

const LoginPage = () => {
    function handleLogin() {
        // Navigates the entire browser window to your backend OAuth starter route
        window.location.href = import.meta.env.VITE_BACKEND_URL + '/auth/github';
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
            <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-md">
                <h2 className="mb-6 text-xl font-semibold text-center">Welcome Back</h2>

                <button
                    onClick={handleLogin}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-100 px-4 py-2.5 font-medium text-black hover:bg-zinc-200 transition"
                >
                    {/* You can drop a GitHub SVG icon here later */}
                    Sign in with GitHub
                </button>
            </div>
        </div>
    );
};

export default LoginPage;