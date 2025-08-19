export interface UploadResponse {
  success: boolean;
  statusCode: number;
  request: {
    ip: string;
    method: string;
    url: string;
  };
  message: string;
  data: {
    urls: string[];
  };
}


export interface UploadClipResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    url: string;
  };
}


export interface ClipRequest {
  url: string;
  text: string;
}

export interface ClipResponse {
  success: boolean;
  statusCode: number;
  request: {
    ip: string;
    method: string;
    url: string;
  };
  message: string;
  data: string; 
}



export interface PostResponse {
  success: boolean;
  statusCode: number;
  request: {
    ip: string;
    method: string;
    url: string;
  };
  message: string;
  data: any | null;
}