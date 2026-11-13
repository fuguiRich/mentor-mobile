import { api } from '../lib/api'
import type { UploadedFile } from './types'

export const fileApi = {
  upload(files: File[], ownerType?: string, ownerId?: string) {
    const form = new FormData()
    for (const file of files) form.append('files', file)
    if (ownerType) form.append('ownerType', ownerType)
    if (ownerId) form.append('ownerId', ownerId)
    return api.upload<UploadedFile[]>('/files', form)
  },
  async preview(fileId: string): Promise<Blob> {
    return api.download(`/files/${fileId}/preview`)
  },
  async download(fileId: string): Promise<Blob> {
    return api.download(`/files/${fileId}/download`)
  },
}
