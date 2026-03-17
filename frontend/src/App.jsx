import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import WelcomeScreen from './components/WelcomeScreen';
import IDE from './components/IDE';

function AppContent() {
    const { state } = useApp();

    return (
        <div className="h-screen flex flex-col bg-studio-bg">
            {state.screen === 'welcome' ? <WelcomeScreen /> : <IDE />}
        </div>
    );
}

export default function App() {
    return (
        <AppProvider>
            <AppContent />
        </AppProvider>
    );
}
