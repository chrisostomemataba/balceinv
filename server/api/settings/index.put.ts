// server/api/settings/index.put.ts
import { SettingsService } from '../../services/settings.service';
import { AuthService } from '../../services/auth.service';

export default defineEventHandler(async (event) => {
  const user = AuthService.getUserFromToken(event);
  
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }
  
  return await SettingsService.updateSettings(event, user.userId);
});
