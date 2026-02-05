import axios from 'axios';
import { API_URL } from '../constants/config';

const client = axios.create({
  baseURL: API_URL
});

export const fetchMatches = (params: any) =>
  client.get('Games/list', { params: { timezone: 3, ...params } });

export const fetchGameDetails = (id: number) => client.get(`Games/${id}`);
export const fetchLeagues = () => client.get('Leagues');