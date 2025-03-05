import { servicesAxiosInstance } from './config';
import { ServerStatus } from '../types/types';

const getServerStatus = async (): Promise<ServerStatus> => {
  const response = await servicesAxiosInstance.get<ServerStatus>('/api/v1/health');
  return response.data;
};

export {
  getServerStatus
};
