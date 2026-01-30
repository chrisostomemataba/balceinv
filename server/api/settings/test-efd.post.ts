// server/api/settings/test-efd.post.ts
import { SettingsService } from '../../services/settings.service';

export default defineEventHandler(async (event) => {
  return await SettingsService.testEFDConnection(event);
});