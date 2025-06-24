import React from 'react';
import {
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Divider,
    Box,
    Typography,
    Tooltip,
    IconButton,
    useTheme
} from '@mui/material';
import {
    Dashboard,
    Article,
    Image,
    People,
    Settings,
    Notifications,
    Menu as MenuIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'Content', icon: <Article />, path: '/content' },
    { text: 'Media', icon: <Image />, path: '/media' },
    { text: 'Users', icon: <People />, path: '/users' },
    { text: 'Notifications', icon: <Notifications />, path: '/notifications' },
    { text: 'Settings', icon: <Settings />, path: '/settings' },
];

interface SidebarProps {
    open: boolean;
    onToggle: () => void;
    onClose: () => void;
    isMobile?: boolean;
}

export function Sidebar({ open, onToggle, onClose, isMobile = false }: SidebarProps) {
    const theme = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    const handleNavigation = (path: string) => {
        navigate(path);
        // Close sidebar on mobile after navigation
        if (isMobile) {
            onClose();
        }
    };

    // Always render sidebar, use transforms for mobile
    return (
        <Box
            sx={{
                width: isMobile ? 240 : (open ? 240 : 64),
                height: '100vh',
                backgroundColor: 'background.paper',
                borderRight: 1,
                borderColor: 'divider',
                overflow: 'hidden',
                position: isMobile ? 'fixed' : 'relative',
                left: 0,
                top: 0,
                zIndex: isMobile ? theme.zIndex.drawer : 'auto',
                transition: theme.transitions.create(['width', 'transform'], {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.leavingScreen,
                }),
                transform: isMobile ? (open ? 'translateX(0)' : 'translateX(-100%)') : 'none',
            }}
        >
            {/* Sidebar Header with Toggle Button */}
            <Box sx={{ 
                p: (open || isMobile) ? 2 : 1, 
                borderBottom: 1, 
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: (open || isMobile) ? 'space-between' : 'center',
                minHeight: 64, // Consistent header height
            }}>
                {(open || isMobile) ? (
                    <>
                        <Typography variant="h6" component="div" color="primary" sx={{ fontWeight: 600 }}>
                            CMS Portfolio
                        </Typography>
                        <IconButton
                            size="small"
                            onClick={onToggle}
                            aria-label={isMobile ? "close sidebar" : "collapse sidebar"}
                        >
                            <CloseIcon />
                        </IconButton>
                    </>
                ) : (
                    <IconButton
                        size="small"
                        onClick={onToggle}
                        aria-label="expand sidebar"
                    >
                        <MenuIcon />
                    </IconButton>
                )}
            </Box>

            {/* Navigation Menu */}
            <Box sx={{ overflow: 'auto', height: 'calc(100vh - 64px)' }}>
                <List sx={{ p: 0 }}>
                    {menuItems.map((item) => (
                        <ListItem key={item.text} disablePadding>
                            {(open || isMobile) ? (
                                // Expanded state - show icon + text
                                <ListItemButton
                                    selected={location.pathname === item.path}
                                    onClick={() => handleNavigation(item.path)}
                                    sx={{
                                        minHeight: 48,
                                        px: 2.5,
                                        '&.Mui-selected': {
                                            backgroundColor: 'primary.main',
                                            color: 'primary.contrastText',
                                            '& .MuiListItemIcon-root': {
                                                color: 'primary.contrastText',
                                            },
                                            '&:hover': {
                                                backgroundColor: 'primary.dark',
                                            },
                                        },
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 40 }}>
                                        {item.icon}
                                    </ListItemIcon>
                                    <ListItemText primary={item.text} />
                                </ListItemButton>
                            ) : (
                                // Collapsed state - show only icon with tooltip
                                <Tooltip title={item.text} placement="right" arrow>
                                    <ListItemButton
                                        selected={location.pathname === item.path}
                                        onClick={() => handleNavigation(item.path)}
                                        sx={{
                                            minHeight: 48,
                                            justifyContent: 'center',
                                            px: 1,
                                            '&.Mui-selected': {
                                                backgroundColor: 'primary.main',
                                                color: 'primary.contrastText',
                                                '& .MuiListItemIcon-root': {
                                                    color: 'primary.contrastText',
                                                },
                                                '&:hover': {
                                                    backgroundColor: 'primary.dark',
                                                },
                                            },
                                        }}
                                    >
                                        <ListItemIcon sx={{ 
                                            minWidth: 0, 
                                            justifyContent: 'center'
                                        }}>
                                            {item.icon}
                                        </ListItemIcon>
                                    </ListItemButton>
                                </Tooltip>
                            )}
                        </ListItem>
                    ))}
                </List>
                <Divider />
            </Box>
        </Box>
    );
} 