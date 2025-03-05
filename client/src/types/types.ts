export interface ServerStatus {
  success: boolean;
  statusCode: number;
  request: {
    ip: string;
    method: string;
    url: string;
  };
  message: string;
  data: {
    application: {
      environment: string;
      uptime: string;
      memoryUsage: {
        heapTotal: string;
        heapUsed: string;
      };
    };
    system: {
      cpuUsage: number[];
      totalMemory: string;
      freeMemory: string;
    };
    timestamp: number;
  };
}

export interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  details: string;
}
