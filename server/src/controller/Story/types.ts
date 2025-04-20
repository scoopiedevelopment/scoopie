
enum LocalMediaType {
    Image = 'Image',
    Video = 'Video',
    Clip = 'Clip',
  }

export interface UploadStoryType {
    mediaUrl: string,
    mediaType: LocalMediaType
}