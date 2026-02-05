import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEY } from '../constants/config';

export const saveToDisk =  async (key: string , data: any) => {
    try {
        await AsyncStorage.setItem(key, JSON.stringify(data));
        } catch (e) { console.error('Error of writing data', e); }
    }

export const loadFromDisk = async (key: string) => {
    try {
        const value = await AsyncStorage.getItem(key);
        return value ? JSON.parse(value) : null;
    } catch (e) { return null; }
};