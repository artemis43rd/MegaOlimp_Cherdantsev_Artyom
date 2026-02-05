import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const MatchCard = ( { item, onPress }: any) => {
    const whatsTheMatchStatus = () => {
        if ([3, 4, 5, 6, 7, 11, 19].includes(item.status)) return "InProgress";
        if ([8, 10, 12 ,13, 14, 15, 17, 18].includes(item.status)) return "Finished";
        return "Upcoming";
        };

    const theme = { bg: '#E3F2FD', border: '#2196F3' };

    return (
        <TouchableOpacity
              onPress={onPress}
              style={[styles.card, { backgroundColor: theme.bg, borderLeftColor: theme.border }]}
            >
            <View style={styles.content}>
                <View style={styles.sideBlock}>
                    <Text style={styles.sideText}>{item.homeTeam.name}</Text>
                </View>

                <View style={styles.centerBlock}>
                    <Text style={styles.mainValue}>{item.date.substring(11,15)}</Text> "2026-01-31T21:00:00+00:00"
                </View>

                <View style={styles.sideBlock}>
                    <Text style={styles.sideText}>{item.awayTeam.name}</Text>
                </View>
            </View>
        </TouchableOpacity>
        );
    };

const styles = StyleSheet.create({
    card: { padding: 15, marginBottom : 10, borderRadius: 10, elevation: 3 },
    content: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sideBlock: { flex: 1, alignItems: 'center' },
    centerBlock: { width: 100, alignItems: 'center' },
    mainValue: { fontSize: 18, fontWeight: '800' },
    sideText: { fontSize: 11, textAlign: 'center', color: '#333' }
    });

export default React.memo(MatchCard);