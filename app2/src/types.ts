export type RequestData = {
  type: 'sw/request';
  id: number;
  data: Omit<
    Request,
    'arrayBuffer' | 'blob' | 'formData' | 'json' | 'text' | 'clone'
  >;
};

export type NewServer = {
  type: 'server/create';
  id: string;
  port: MessagePort;
};

export type ServerClose = {
  type: 'server/shutdown';
  id: string;
};

export type ChannelMessage = NewServer | RequestData;
