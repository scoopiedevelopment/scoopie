import axios, { AxiosInstance } from 'axios';

// Ensure that the environment variable is defined
const baseURL = import.meta.env.VITE_SERVER_URL as string;

const servicesAxiosInstance: AxiosInstance = axios.create({
    baseURL: baseURL
});

export {
  servicesAxiosInstance
};
