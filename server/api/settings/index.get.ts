// server/api/settings/index.get.ts
import { SettingsService } from '../../services/settings.service';

export default defineEventHandler(async (event) => {
  return await SettingsService.getSettings();
});
