// server/api/settings/upload-logo.post.ts
import { SettingsService } from '../../services/settings.service';

export default defineEventHandler(async (event) => {
  return await SettingsService.uploadLogo(event);
});