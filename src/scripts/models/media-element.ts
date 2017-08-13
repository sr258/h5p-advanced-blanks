export enum MediaType {
  Image,
  Video
}

export class MediaElement {
  type: MediaType;
  uri: string;
  id: string;

  constructor(type: MediaType, uri: string, id: string) {
    this.type = type;
    this.uri = uri;
    this.id = id;
  }
}