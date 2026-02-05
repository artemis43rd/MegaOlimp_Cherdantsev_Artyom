import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Modal, StyleSheet, ScrollView } from 'react-native';
import * as API from './src/api/matchService';
import * as Storage from './src/utils/storage';
import MatchCard from './src/components/MatchCard';

export default function App() {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [activeDate, setActiveDate] = useState(new Date().toISOString().split('T')[0]);

  const timeline = useMemo(() => {
    return Array.from({ length: 3 }, (_, i) => {
    const d = new Date();
      d.setDate(d.getDate() + i);
        return { iso: d.toISOString().split('T')[0], day: d.getDate() };
      });
    }, []);

  const displayedItems = useMemo(() => {
    return items.filter(item =>
      item.date.startsWith(activeDate) //&&
      //item.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [items, activeDate, search]);

  const syncData = useCallback(async () => {
      try {
        const response = await API.fetchDataByRange(timeline[0].iso, timeline[2].iso);
        const result = response.item.list;
        setItems(result);
        await Storage.saveToDisk('cache_items', result);
      } catch (e) {
        const cached = await Storage.loadFromDisk('cache_items');
        if (cached) setItems(cached);
      }
    }, [timeline]);

    useEffect(() => {
      setIsLoading(true);
      syncData().finally(() => setIsLoading(false));
    }, [syncData]);

    return (
        <View style={styles.root}>
            <Text style={styles.title}>Football Stats</Text>
            <TextInput
                placeholder="Search teams, leagues..."
                style={styles.input}
                onChangeText={setSearch}
              />
              {isLoading ? <ActivityIndicator size="large" /> : (
                  <FlatList
                    item={displayedItems}
                    keyExtractor={item => item.id.toString()}
                    renderItem={({ item }) => <MatchCard item={item} onPress={() => handleOpenDetails(item.id)} />}
                    ListEmptyComponent={<Text style={styles.empty}>No data loaded</Text>}
                  />
                )}
        </View>
        )
    }

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f9f9f9', padding: 20, paddingTop: 50 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  input: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 20, borderWidth: 1, borderColor: '#ddd' },
  empty: { textAlign: 'center', marginTop: 50, color: '#999' }
});