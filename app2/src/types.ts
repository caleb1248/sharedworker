export type Overwrite<T, U extends Partial<Record<keyof T, any>>> = Pick<
  T,
  Exclude<keyof T, keyof U>
> &
  U;

export type RequestData = {
  type: 'sw/request';
  id: number;
  data: Overwrite<
    Omit<
      Request,
      | 'clone'
      | 'arrayBuffer'
      | 'blob'
      | 'json'
      | 'text'
      | 'formData'
      | 'signal'
      | 'mode'
    >,
    { headers: [string, string][] }
  >;
};

export type NewServer = {
  type: 'server/create';
  id: string;
};

export type ServerClose = {
  type: 'server/shutdown';
  id: string;
};

export type ResponseData = {
  type: 'server/response';
  id: number;
  data: Overwrite<
    Omit<
      Response,
      'clone' | 'arrayBuffer' | 'blob' | 'json' | 'text' | 'formData'
    >,
    { headers: [string, string][] }
  >;
};

export type ErrorData = {
  type: 'error';
  id: number;
  data: Error;
};

export type ChannelMessage =
  | NewServer
  | RequestData
  | ServerClose
  | ResponseData
  | ErrorData;
