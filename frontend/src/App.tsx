import React from 'react';
import { Provider } from 'react-redux';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { Toaster } from 'sonner';
import { store } from './store/store';
import { AppRouter } from './components/AppRouter';

const theme = createTheme({
    palette: {
        primary: {
            main: '#1976d2',
        },
        secondary: {
            main: '#dc004e',
        },
    },
});

function App() {
    return (
        <Provider store={store}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <AppRouter />
                <Toaster 
                    position="top-right" 
                    richColors 
                    expand={false}
                    duration={4000}
                />
            </ThemeProvider>
        </Provider>
    );
}

export default App;
