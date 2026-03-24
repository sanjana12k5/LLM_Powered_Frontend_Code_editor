import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FolderOpen, Sparkles, Cpu, Code2, Zap, ArrowRight, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function WelcomeScreen() {
    const { dispatch } = useApp();
    const [showAIInput, setShowAIInput] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [generating, setGenerating] = useState(false);

    const handleOpenProject = async () => {
        try {
            let folderPath;

            if (window.electronAPI) {
                folderPath = await window.electronAPI.openFolderDialog();
            } else {
                folderPath = prompt('Enter project folder path:');
            }

            if (!folderPath) return;

            dispatch({ type: 'SET_STATUS', payload: 'Loading project...' });

            let tree;
            if (window.electronAPI) {
                tree = await window.electronAPI.readDirectory(folderPath);
            } else {
                const res = await axios.post('/api/read-files', { projectPath: folderPath });
                tree = res.data.tree;
            }

            const projectName = folderPath.split(/[\\/]/).pop();
            dispatch({
                type: 'SET_PROJECT',
                payload: { path: folderPath, name: projectName, tree }
            });
        } catch (err) {
            console.error('Failed to open project:', err);
            dispatch({ type: 'SET_STATUS', payload: 'Failed to open project' });
        }
    };

    const handleGenerateProject = async () => {
        if (!aiPrompt.trim()) return;
        setGenerating(true);

        try {
            const res = await axios.post('/api/generate-project', { prompt: aiPrompt });
            const { files, projectName } = res.data;

            let savePath;
            if (window.electronAPI) {
                savePath = await window.electronAPI.saveProjectDialog();
                if (!savePath) { setGenerating(false); return; }
                await window.electronAPI.saveGeneratedProject(savePath, files);
                const tree = await window.electronAPI.readDirectory(savePath);
                dispatch({
                    type: 'SET_PROJECT',
                    payload: { path: savePath, name: projectName, tree }
                });
            } else {
                dispatch({ type: 'SET_STATUS', payload: 'Project generated (browser mode - no save)' });
            }
        } catch (err) {
            console.error('Failed to generate project:', err);
            dispatch({ type: 'SET_STATUS', payload: 'Failed to generate project' });
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="h-screen flex flex-col items-center justify-center bg-studio-bg relative overflow-hidden">
            {/* Animated background gradients */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-3xl"></div>
            </div>

            {/* Title area */}
            <div className="relative z-10 text-center mb-12 animate-fade-in">
                <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/30">
                        <Cpu className="w-8 h-8 text-white" />
                    </div>
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent mb-3">
                    AI Diagnostic Studio
                </h1>
                <p className="text-studio-text-muted text-lg max-w-md">
                    Analyze, diagnose, and generate frontend code with AI-powered intelligence
                </p>
            </div>

            {/* Option cards */}
            {!showAIInput ? (
                <div className="relative z-10 flex gap-6 animate-slide-up">
                    {/* Open Project Card */}
                    <button
                        onClick={handleOpenProject}
                        className="group glass-card p-8 w-72 text-left hover:border-blue-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 cursor-pointer"
                    >
                        <div className="p-3 bg-blue-500/10 rounded-xl w-fit mb-5 group-hover:bg-blue-500/20 transition-colors">
                            <FolderOpen className="w-7 h-7 text-blue-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-studio-text mb-2">Open Existing Project</h3>
                        <p className="text-sm text-studio-text-muted mb-4">
                            Select a folder from your file system to analyze and edit
                        </p>
                        <div className="flex items-center gap-2 text-blue-400 text-sm font-medium group-hover:gap-3 transition-all">
                            <span>Browse folders</span>
                            <ArrowRight className="w-4 h-4" />
                        </div>
                    </button>

                    {/* Generate Project Card */}
                    <button
                        onClick={() => setShowAIInput(true)}
                        className="group glass-card p-8 w-72 text-left hover:border-purple-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 cursor-pointer"
                    >
                        <div className="p-3 bg-purple-500/10 rounded-xl w-fit mb-5 group-hover:bg-purple-500/20 transition-colors">
                            <Sparkles className="w-7 h-7 text-purple-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-studio-text mb-2">Generate New Project</h3>
                        <p className="text-sm text-studio-text-muted mb-4">
                            Describe your project and let AI create the code for you
                        </p>
                        <div className="flex items-center gap-2 text-purple-400 text-sm font-medium group-hover:gap-3 transition-all">
                            <span>Start with AI</span>
                            <Zap className="w-4 h-4" />
                        </div>
                    </button>
                </div>
            ) : (
                /* AI Prompt Input */
                <div className="relative z-10 w-full max-w-2xl px-6 animate-slide-up">
                    <div className="glass-card p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-purple-500/10 rounded-lg">
                                <Sparkles className="w-5 h-5 text-purple-400" />
                            </div>
                            <h3 className="text-lg font-semibold">Generate New Project with AI</h3>
                        </div>

                        <textarea
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            placeholder="Describe the project you want to generate...&#10;&#10;Example: Create a responsive portfolio website with a hero section, about me, projects gallery, and contact form using HTML, CSS, and JavaScript."
                            className="w-full h-40 bg-studio-bg border border-studio-border rounded-xl p-4 text-studio-text placeholder-studio-text-muted/50 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 resize-none font-mono text-sm transition-all"
                            autoFocus
                        />

                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={() => { setShowAIInput(false); setAiPrompt(''); }}
                                className="btn-secondary"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleGenerateProject}
                                disabled={generating || !aiPrompt.trim()}
                                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {generating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4" />
                                        Generate Project
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="absolute bottom-6 text-center text-studio-text-muted/50 text-xs">
                <div className="flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5" />
                    <span>AI Diagnostic Studio v1.0 — Built with React, Electron & AI</span>
                </div>
            </div>
        </div>
    );
}
