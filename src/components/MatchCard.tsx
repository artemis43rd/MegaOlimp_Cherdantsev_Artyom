import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const MatchCard = ({ item, onPress, onLeaguePress }: any) => {
  if (!item) return null;

  const formatDateLabel = (dateStr: string) => {
    const matchDate = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    // Сравнение дат (без учета времени)
    if (matchDate.toDateString() === today.toDateString()) return 'Today';
    if (matchDate.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

    return matchDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <TouchableOpacity onPress={onPress} style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.countryText}>{item.homeTeam?.country?.name || 'International'}</Text>
        <View style={styles.dateBadge}>
          <Text style={styles.dateBadgeText}>{formatDateLabel(item.date)}</Text>
        </View>
      </View>

      <View style={styles.mainContent}>
        <Text style={styles.teamName}>{item.homeTeam?.name}</Text>
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{item.date?.substring(11, 16)} PM</Text>
        </View>
        <Text style={styles.teamName}>{item.awayTeam?.name}</Text>
      </View>

      <View style={styles.bottomRow}>
        <TouchableOpacity onPress={onLeaguePress} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <Text style={styles.leagueName}>{item.season?.league?.name}</Text>
        </TouchableOpacity>
        <Text style={styles.arrow}>></Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  countryText: { fontSize: 13, color: '#8E8E93', textTransform: 'uppercase' },
  dateBadge: { backgroundColor: '#EBF2FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  dateBadgeText: { color: '#4178FF', fontSize: 11, fontWeight: 'bold' },
  mainContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 10 },
  teamName: { flex: 1, fontSize: 15, fontWeight: '700', color: '#1C1C1E', textAlign: 'center' },
  timeContainer: { width: 80, alignItems: 'center' },
  timeText: { fontSize: 14, color: '#8E8E93', fontWeight: '500' },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, borderTopWidth: 1, borderTopColor: '#F2F2F7', paddingTop: 12 },
  leagueName: { fontSize: 13, color: '#4178FF', fontWeight: '600' },
  arrow: { color: '#C7C7CC', fontSize: 14 }
});

export default React.memo(MatchCard);