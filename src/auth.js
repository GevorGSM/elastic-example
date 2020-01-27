import base64 from 'base-64';
import { API_URL } from './helpers';

export const checkLogin = () => {
  return fetch(`${API_URL}/login/check`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({}),
    credentials: 'include',
  }).then(response => {
    return response.ok;
  }).catch(() => false);
};

export const login = (userName, password) => {
  return fetch(`${API_URL}/listhub/_search`, {
    headers: new Headers({
      "Authorization": `Basic ${base64.encode(`${userName}:${password}`)}`
    }),
  }).catch(error => ({ error }))
};
