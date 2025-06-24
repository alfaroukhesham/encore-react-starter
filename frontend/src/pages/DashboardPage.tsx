import React from 'react';
import {
    Box,
    Typography,
    Grid,
    Paper,
    Card,
    CardContent
} from '@mui/material';
import {
    Article,
    Image,
    People,
    Visibility
} from '@mui/icons-material';

const statsCards = [
    {
        title: 'Total Articles',
        value: '24',
        icon: <Article fontSize="large" />,
        color: '#1976d2'
    },
    {
        title: 'Media Files',
        value: '156',
        icon: <Image fontSize="large" />,
        color: '#388e3c'
    },
    {
        title: 'Users',
        value: '8',
        icon: <People fontSize="large" />,
        color: '#f57c00'
    },
    {
        title: 'Page Views',
        value: '1,234',
        icon: <Visibility fontSize="large" />,
        color: '#7b1fa2'
    }
];

export function DashboardPage() {
    return (
        <Box>
            <Typography variant="h4" component="h1" gutterBottom>
                Dashboard
            </Typography>
            
            <Grid container spacing={3}>
                {statsCards.map((card, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                        <Card>
                            <CardContent>
                                <Box display="flex" alignItems="center" justifyContent="space-between">
                                    <Box>
                                        <Typography color="textSecondary" gutterBottom>
                                            {card.title}
                                        </Typography>
                                        <Typography variant="h4" component="h2">
                                            {card.value}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ color: card.color }}>
                                        {card.icon}
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
            
            <Box mt={4}>
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Recent Activity
                    </Typography>
                    <Typography color="textSecondary">
                        No recent activity to display.
                    </Typography>
                </Paper>
            </Box>
        </Box>
    );
} 