import React, { useState, FC } from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Outlet } from 'react-router-dom';

const Layout: FC = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [sidebarOpen, setSidebarOpen] = useState(!isMobile); // Close on mobile by default

    const handleSidebarToggle = () => {
        setSidebarOpen(!sidebarOpen);
    };

    // Dynamic sidebar width for desktop only
    const sidebarWidth = sidebarOpen ? 240 : 64;

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            {/* Desktop Sidebar */}
            {!isMobile && (
                <Box
                    sx={{
                        width: sidebarWidth,
                        flexShrink: 0,
                        transition: theme.transitions.create('width', {
                            easing: theme.transitions.easing.sharp,
                            duration: theme.transitions.duration.leavingScreen,
                        }),
                    }}
                >
                    <Sidebar 
                        open={sidebarOpen} 
                        onToggle={handleSidebarToggle}
                        onClose={() => setSidebarOpen(false)}
                        isMobile={false}
                    />
                </Box>
            )}
            
            {/* Main Content Area */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    width: isMobile ? '100%' : `calc(100% - ${sidebarWidth}px)`,
                    transition: theme.transitions.create(['width', 'margin'], {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.leavingScreen,
                    }),
                }}
            >
                {/* Header */}
                <Header 
                    onMenuClick={isMobile ? handleSidebarToggle : undefined}
                    showMenuButton={isMobile}
                />
                
                {/* Page Content */}
                <Box
                    sx={{
                        flexGrow: 1,
                        p: 3,
                        backgroundColor: 'grey.50',
                        overflow: 'auto',
                    }}
                >
                    <Outlet />
                </Box>
            </Box>

            {/* Mobile/Tablet Sidebar Overlay */}
            {isMobile && (
                <>
                    <Sidebar 
                        open={sidebarOpen} 
                        onToggle={handleSidebarToggle}
                        onClose={() => setSidebarOpen(false)}
                        isMobile={true}
                    />
                    
                    {/* Mobile Overlay Backdrop */}
                    {sidebarOpen && (
                        <Box
                            sx={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                zIndex: theme.zIndex.drawer - 1,
                            }}
                            onClick={() => setSidebarOpen(false)}
                        />
                    )}
                </>
            )}
        </Box>
    );
};

export default Layout;
export { Layout };