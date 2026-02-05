import axios from 'axios';
import { API_TOKEN, API_URL } from '../constants/config';

const client = axios.create({
  baseURL: API_URL,
  params: API_TOKEN
});

export const fetchDataByRange = (stratDate: string, endDate: string) =>
    clint.get('entries/list', {
            params: {
                from: stratDate,
                to: endDate,
                timeZone: 3
                }
        });