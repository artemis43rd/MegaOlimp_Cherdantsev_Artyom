import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Modal, ScrollView, ActivityIndicator, TextInput, StatusBar
} from 'react-native';
import * as API from './src/api/matchService';
import * as Storage from './src/utils/storage';
import MatchCard from './src/components/MatchCard';

export default function App() {
  const [isAuth, setIsAuth] = useState(false);
  const [activeTab, setActiveTab] = useState('Home');
  const [items, setItems] = useState<any[]>([]);
  const [leagues, setLeagues] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMoreLoading, setIsMoreLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Фильтры и поиск
  const [teamSearch, setTeamSearch] = useState('');
  const [selectedLeague, setSelectedLeague] = useState<any>({ id: null, name: 'All Leagues' });
  const [showLeaguePicker, setShowLeaguePicker] = useState(false);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('day');
  const [searchMode, setSearchMode] = useState<'Upcoming' | 'Past'>('Upcoming');

  // Пагинация
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 30;

  const [details, setDetails] = useState<any>(null);

  // --- ЗАГРУЗКА СПИСКА ЛИГ ---
  const loadLeagues = useCallback(async () => {
    try {
      const res = await API.fetchLeagues();
      const rawLeagues = res.data.data || [];
      const uniqueMap = new Map();
      rawLeagues.forEach((l: any) => {
        const fullName = l.country?.name ? `${l.name} (${l.country.name})` : l.name;
        if (!uniqueMap.has(fullName)) uniqueMap.set(fullName, { id: l.id, name: fullName });
      });
      const sorted = Array.from(uniqueMap.values()).sort((a, b) => a.name.localeCompare(b.name));
      setLeagues([{ id: null, name: 'All Leagues' }, ...sorted]);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    if (isAuth) {
      loadLeagues();
      loadHomeData();
    }
  }, [isAuth, loadLeagues]);

  // --- ЗАГРУЗКА ГЛАВНОГО ЭКРАНА (С пагинацией) ---
  const loadHomeData = async (isLoadMore = false) => {
    if (isLoadMore && (!hasMore || isMoreLoading)) return;

    if (!isLoadMore) {
      setIsLoading(true);
      setOffset(0);
      setHasMore(true);
    } else {
      setIsMoreLoading(true);
    }

    const currentOffset = isLoadMore ? offset : 0;

    try {
      const res = await API.fetchMatches({
        upcoming: true,
        limit: LIMIT,
        offset: currentOffset,
        timezone: 3
      });
      const newData = res.data.data || [];

      if (isLoadMore) {
        setItems(prev => [...prev, ...newData]);
      } else {
        setItems(newData);
        await Storage.saveToDisk('cache_home', newData);
      }

      setOffset(currentOffset + LIMIT);
      if (newData.length < LIMIT) setHasMore(false);
      setIsOffline(false);
    } catch (e) {
      if (!isLoadMore) {
        const cached = await Storage.loadFromDisk('cache_home');
        if (cached) { setItems(cached); setIsOffline(true); }
      }
    }
    setIsLoading(false);
    setIsMoreLoading(false);
  };

  // --- ЗАГРУЗКА ПОИСКА (С пагинацией) ---
  const loadSearchData = async (mode: 'Upcoming' | 'Past', isLoadMore = false) => {
    if (isLoadMore && (!hasMore || isMoreLoading)) return;

    if (!isLoadMore) {
      setIsLoading(true);
      setOffset(0);
      setHasMore(true);
    } else {
      setIsMoreLoading(true);
    }

    const currentOffset = isLoadMore ? offset : 0;
    const now = new Date();
    let fromStr = '';
    let toStr = '';

    if (mode === 'Upcoming') {
      fromStr = now.toISOString().split('T')[0];
      const toD = new Date();
      if (timeRange === 'day') toD.setDate(now.getDate() + 2);
      else if (timeRange === 'week') toD.setDate(now.getDate() + 8);
      else toD.setMonth(now.getMonth() + 1);
      toStr = toD.toISOString().split('T')[0];
    } else {
      toStr = new Date(now.getTime() + 86400000).toISOString().split('T')[0];
      const fromD = new Date();
      if (timeRange === 'day') fromD.setDate(now.getDate() - 1);
      else if (timeRange === 'week') fromD.setDate(now.getDate() - 7);
      else fromD.setMonth(now.getMonth() - 1);
      fromStr = fromD.toISOString().split('T')[0];
    }

    const params: any = {
      from: fromStr,
      to: toStr,
      limit: LIMIT,
      offset: currentOffset,
      timezone: 3
    };

    if (selectedLeague?.id) params.leagueId = selectedLeague.id;
    if (mode === 'Upcoming') params.upcoming = true; else params.ended = true;

    try {
      const res = await API.fetchMatches(params);
      let newItems = res.data.data || [];

      if (teamSearch) {
        newItems = newItems.filter((m: any) =>
          m.homeTeam?.name?.toLowerCase().includes(teamSearch.toLowerCase()) ||
          m.awayTeam?.name?.toLowerCase().includes(teamSearch.toLowerCase())
        );
      }

      if (isLoadMore) {
        setItems(prev => [...prev, ...newItems]);
      } else {
        setItems(newItems);
      }

      setOffset(currentOffset + LIMIT);
      if (newItems.length < LIMIT) setHasMore(false);
      setIsOffline(false);
    } catch (e) {
      setIsOffline(true);
    }
    setIsLoading(false);
    setIsMoreLoading(false);
  };

  const handleLeagueJump = (leagueItem: any) => {
    const found = leagues.find(l => l.id === leagueItem.id);
    setSelectedLeague(found || { id: leagueItem.id, name: leagueItem.name });
    setActiveTab('Search');
    setSearchMode('Upcoming');
    setTimeout(() => loadSearchData('Upcoming'), 100);
  };

  const formatFullDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
           + ' at ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  // --- РЕНДЕР АВТОРИЗАЦИИ ---
  if (!isAuth) {
    return (
      <View style={styles.authContainer}>
        <Text style={styles.authTitle}>Football Stats</Text>
        <TextInput placeholder="Email" style={styles.authInput} placeholderTextColor="#8E8E93" />
        <TextInput placeholder="Password" secureTextEntry style={styles.authInput} placeholderTextColor="#8E8E93" />
        <TouchableOpacity style={styles.authBtn} onPress={() => setIsAuth(true)}>
          <Text style={styles.btnText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>Offline Mode: Using Cached Data</Text>
        </View>
      )}

      <Text style={styles.headerTitle}>Football Stats</Text>

      {activeTab === 'Search' && (
        <View style={styles.searchSection}>
          <TextInput
            placeholder="Search team name..."
            style={styles.teamInput}
            value={teamSearch}
            onChangeText={setTeamSearch}
            placeholderTextColor="#8E8E93"
          />
          <Text style={styles.label}>League</Text>
          <TouchableOpacity onPress={() => setShowLeaguePicker(true)} style={styles.pickerTrigger}>
            <Text style={{color: selectedLeague?.id ? '#000' : '#8E8E93'}}>{selectedLeague.name}</Text>
            <Text style={{color: '#8E8E93'}}>▼</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Time Range</Text>
          <View style={styles.rangeRow}>
            {['day', 'week', 'month'].map(r => (
              <TouchableOpacity key={r} onPress={() => setTimeRange(r as any)} style={[styles.rangeBtn, timeRange === r && styles.rangeBtnActive]}>
                <Text style={[styles.rangeText, timeRange === r && styles.rangeTextActive]}>{r.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.row}>
            <TouchableOpacity onPress={() => {setSearchMode('Upcoming'); loadSearchData('Upcoming');}} style={styles.applyBtn}>
              <Text style={styles.btnText}>Search</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {setSearchMode('Past'); loadSearchData('Past');}} style={[styles.applyBtn, {backgroundColor: '#607D8B'}]}>
              <Text style={styles.btnText}>Archive</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {isLoading ? <ActivityIndicator style={{marginTop: 50}} color="#4178FF" /> : (
        <FlatList
          data={items}
          contentContainerStyle={{padding: 16, flexGrow: 1}}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={({item}) => (
            <MatchCard
              item={item}
              onPress={() => setDetails(item)}
              onLeaguePress={() => handleLeagueJump(item.season?.league || {id: item.leagueId, name: item.leagueName})}
            />
          )}

          ListFooterComponent={() => (
            hasMore && items.length > 0 ? (
              <TouchableOpacity
                style={styles.loadMoreBtn}
                onPress={() => activeTab === 'Home' ? loadHomeData(true) : loadSearchData(searchMode, true)}
                disabled={isMoreLoading}
              >
                {isMoreLoading ? <ActivityIndicator color="#4178FF" /> : <Text style={styles.loadMoreText}>Load More</Text>}
              </TouchableOpacity>
            ) : <View style={{height: 40}} />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No matches found</Text>
            </View>
          }
        />
      )}

      {/* Picker Modal */}
      <Modal visible={showLeaguePicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModal}>
            <Text style={styles.modalTitle}>Select League</Text>
            <FlatList
              data={leagues}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={[styles.pickerItem, selectedLeague?.id === item.id && {backgroundColor: '#F2F2F7'}]}
                  onPress={() => { setSelectedLeague(item); setShowLeaguePicker(false); }}
                >
                  <Text style={selectedLeague?.id === item.id ? {fontWeight: 'bold', color: '#4178FF'} : null}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity onPress={() => setShowLeaguePicker(false)} style={styles.modalClose}>
              <Text style={{color: '#FF3B30', fontWeight: 'bold'}}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Details Modal */}
      <Modal visible={!!details} animationType="slide">
        <View style={styles.detailsContainer}>
          <TouchableOpacity onPress={() => setDetails(null)} style={styles.backBtn}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
          <View style={styles.detailsCard}>
            <Text style={styles.detTeams}>{details?.homeTeam?.name} vs {details?.awayTeam?.name}</Text>
            <Text style={styles.detDate}>{formatFullDate(details?.date)}</Text>
            <View style={styles.detInfoBox}>
               <View style={styles.detRow}><Text style={styles.detLabel}>Country</Text><Text style={styles.detVal}>{details?.homeTeam?.country?.name || 'International'}</Text></View>
               <View style={styles.detRow}><Text style={styles.detLabel}>League</Text><Text style={styles.detVal}>{details?.season?.league?.name || details?.leagueName}</Text></View>
               <View style={styles.detRow}><Text style={styles.detLabel}>Status</Text><Text style={[styles.detVal, {color: '#4178FF'}]}>{details?.statusName || 'Scheduled'}</Text></View>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.tabBar}>
        <TouchableOpacity onPress={() => {setActiveTab('Home'); loadHomeData();}} style={styles.tabItem}>
          <Text style={[styles.tabText, activeTab === 'Home' && styles.tabTextActive]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('Search')} style={styles.tabItem}>
          <Text style={[styles.tabText, activeTab === 'Search' && styles.tabTextActive]}>Search</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', paddingTop: 50 },
  offlineBanner: { backgroundColor: '#FF9500', padding: 8, alignItems: 'center' },
  offlineText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  authContainer: { flex: 1, justifyContent: 'center', padding: 30, backgroundColor: '#fff' },
  authTitle: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 40 },
  authInput: { backgroundColor: '#F2F2F7', padding: 16, borderRadius: 12, marginBottom: 16, fontSize: 16, color: '#000' },
  authBtn: { backgroundColor: '#4178FF', padding: 18, borderRadius: 12, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
  searchSection: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  teamInput: { backgroundColor: '#F2F2F7', padding: 12, borderRadius: 10, marginBottom: 15, color: '#000' },
  label: { fontSize: 10, color: '#8E8E93', marginBottom: 8, textTransform: 'uppercase', fontWeight: 'bold' },
  pickerTrigger: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 10, marginBottom: 15, alignItems: 'center' },
  rangeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  rangeBtn: { flex: 1, alignItems: 'center', padding: 10, backgroundColor: '#F2F2F7', marginHorizontal: 4, borderRadius: 10 },
  rangeBtnActive: { backgroundColor: '#EBF2FF', borderWidth: 1, borderColor: '#4178FF' },
  rangeText: { fontSize: 11, color: '#8E8E93' },
  rangeTextActive: { color: '#4178FF', fontWeight: 'bold' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  applyBtn: { flex: 1, backgroundColor: '#4178FF', padding: 16, borderRadius: 12, alignItems: 'center', marginHorizontal: 4 },
  btnText: { color: '#fff', fontWeight: 'bold' },
  tabBar: { flexDirection: 'row', height: 75, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E5EA', paddingBottom: 15 },
  tabItem: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabText: { fontSize: 12, color: '#8E8E93' },
  tabTextActive: { color: '#4178FF', fontWeight: 'bold' },
  listHeader: { fontSize: 12, fontWeight: 'bold', color: '#8E8E93', marginBottom: 15, textTransform: 'uppercase' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, fontWeight: 'bold', color: '#1C1C1E' },
  loadMoreBtn: { padding: 15, alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, marginVertical: 10, borderWidth: 1, borderColor: '#E5E5EA' },
  loadMoreText: { color: '#4178FF', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 25 },
  pickerModal: { backgroundColor: '#fff', borderRadius: 24, padding: 20, maxHeight: '80%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  pickerItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  modalClose: { marginTop: 15, alignItems: 'center', padding: 10 },
  detailsContainer: { flex: 1, padding: 25, backgroundColor: '#F8F9FA' },
  detailsCard: { backgroundColor: '#fff', padding: 25, borderRadius: 24, marginTop: 20, elevation: 4 },
  detTeams: { fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
  detDate: { textAlign: 'center', color: '#8E8E93', marginVertical: 15, fontSize: 14 },
  detInfoBox: { backgroundColor: '#F8F9FA', padding: 20, borderRadius: 16 },
  detRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  detLabel: { color: '#8E8E93' },
  detVal: { fontWeight: 'bold' },
  backBtn: { paddingVertical: 10 },
  backText: { fontSize: 16, fontWeight: 'bold' }
});